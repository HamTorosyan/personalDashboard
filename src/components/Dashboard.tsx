"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import TwoWeekCalendar from "@/components/calendar/TwoWeekCalendar"
import TimezoneConverter from "@/components/TimezoneConverter"
import { useCalendarEvents } from "@/hooks/useCalendarEvents"
import { useIcsFeeds } from "@/hooks/useIcsFeeds"
import { RefreshCw, Check, Moon, Sun, Bell } from "lucide-react"
import { clsx } from "clsx"

const SELECTED_COUNTRIES_KEY = "dashboard.selectedCountries"
const HIDDEN_COUNTRIES_KEY = "dashboard.hiddenCountries"
const COUNTRY_COLORS_KEY = "dashboard.countryColors"

type ServerSettings = {
  selectedCountries?: string[]
  hiddenCountries?: string[]
  countryColors?: Record<string, string>
  theme?: string | null
}

function saveSettingsToServer(patch: Partial<ServerSettings>) {
  fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  }).catch(() => {})
}

export default function Dashboard() {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [hiddenCountries, setHiddenCountries] = useState<string[]>([])
  const [countryColors, setCountryColors] = useState<Record<string, string>>({})
  const [calendarWide, setCalendarWide] = useState(true)
  const [isDark, setIsDark] = useState(false)
  const handleLayoutHint = useCallback((wide: boolean) => setCalendarWide(wide), [])
  const { feeds, addFeed, removeFeed, updateFeed, updateFeedColor, toggleFeedVisibility } = useIcsFeeds()

  useEffect(() => {
    // Fast path: load from localStorage for instant render
    const storedTheme = localStorage.getItem("dashboard.theme")
    const dark = storedTheme === "dark" || (!storedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    setIsDark(dark)
    document.documentElement.classList.toggle("dark", dark)
    let localCountries: string[] = []
    let localHidden: string[] = []
    let localColors: Record<string, string> = {}
    try {
      const stored = localStorage.getItem(SELECTED_COUNTRIES_KEY)
      if (stored) { localCountries = JSON.parse(stored); setSelectedCountries(localCountries) }
    } catch {}
    try {
      const stored = localStorage.getItem(HIDDEN_COUNTRIES_KEY)
      if (stored) { localHidden = JSON.parse(stored); setHiddenCountries(localHidden) }
    } catch {}
    try {
      const stored = localStorage.getItem(COUNTRY_COLORS_KEY)
      if (stored) { localColors = JSON.parse(stored); setCountryColors(localColors) }
    } catch {}

    // Authoritative: fetch from server (server wins for keys that exist)
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: ServerSettings) => {
        if ("selectedCountries" in data && Array.isArray(data.selectedCountries)) {
          setSelectedCountries(data.selectedCountries)
          localStorage.setItem(SELECTED_COUNTRIES_KEY, JSON.stringify(data.selectedCountries))
        } else if (localCountries.length > 0) {
          saveSettingsToServer({ selectedCountries: localCountries })
        }
        if ("hiddenCountries" in data && Array.isArray(data.hiddenCountries)) {
          setHiddenCountries(data.hiddenCountries)
          localStorage.setItem(HIDDEN_COUNTRIES_KEY, JSON.stringify(data.hiddenCountries))
        } else if (localHidden.length > 0) {
          saveSettingsToServer({ hiddenCountries: localHidden })
        }
        if ("countryColors" in data && data.countryColors && typeof data.countryColors === "object") {
          setCountryColors(data.countryColors)
          localStorage.setItem(COUNTRY_COLORS_KEY, JSON.stringify(data.countryColors))
        } else if (Object.keys(localColors).length > 0) {
          saveSettingsToServer({ countryColors: localColors })
        }
        if ("theme" in data && (data.theme === "dark" || data.theme === "light")) {
          const serverDark = data.theme === "dark"
          setIsDark(serverDark)
          document.documentElement.classList.toggle("dark", serverDark)
          localStorage.setItem("dashboard.theme", data.theme)
        } else if (storedTheme) {
          saveSettingsToServer({ theme: storedTheme })
        }
      })
      .catch(() => {})
  }, [])

  const { events, isLoading, isRefreshing, error, feedErrors, refetch } = useCalendarEvents(selectedCountries, feeds)
  const [justRefreshed, setJustRefreshed] = useState(false)

  async function handleRefetch() {
    await refetch()
    setJustRefreshed(true)
    setTimeout(() => setJustRefreshed(false), 1500)
  }

  function addCountry(code: string, color: string) {
    if (selectedCountries.includes(code)) return
    const nextCountries = [...selectedCountries, code]
    const nextColors = { ...countryColors, [code]: color }
    setSelectedCountries(nextCountries)
    setCountryColors(nextColors)
    localStorage.setItem(SELECTED_COUNTRIES_KEY, JSON.stringify(nextCountries))
    localStorage.setItem(COUNTRY_COLORS_KEY, JSON.stringify(nextColors))
    saveSettingsToServer({ selectedCountries: nextCountries, countryColors: nextColors })
  }

  function removeCountry(code: string) {
    const nextCountries = selectedCountries.filter((c) => c !== code)
    const nextHidden = hiddenCountries.filter((c) => c !== code)
    setSelectedCountries(nextCountries)
    setHiddenCountries(nextHidden)
    localStorage.setItem(SELECTED_COUNTRIES_KEY, JSON.stringify(nextCountries))
    localStorage.setItem(HIDDEN_COUNTRIES_KEY, JSON.stringify(nextHidden))
    saveSettingsToServer({ selectedCountries: nextCountries, hiddenCountries: nextHidden })
  }

  function updateCountryColor(code: string, color: string) {
    const next = { ...countryColors, [code]: color }
    setCountryColors(next)
    localStorage.setItem(COUNTRY_COLORS_KEY, JSON.stringify(next))
    saveSettingsToServer({ countryColors: next })
  }

  // Client-side visibility filter + holiday color override
  const visibleEvents = useMemo(() => {
    const hiddenFeedIds = new Set(feeds.filter((f) => !f.visible).map((f) => f.id))
    const hiddenCountrySet = new Set(hiddenCountries)
    return events
      .filter((e) => {
        if (e.source === "ics") return !hiddenFeedIds.has(e.feedId ?? "")
        if (e.source === "holiday") return !hiddenCountrySet.has(e.countryCode ?? "")
        return true
      })
      .map((e) => {
        if (e.source === "holiday" && e.countryCode) {
          const color = countryColors[e.countryCode]
          if (color) return { ...e, color }
        }
        return e
      })
  }, [events, feeds, hiddenCountries, countryColors])

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle("dark", next)
    const theme = next ? "dark" : "light"
    localStorage.setItem("dashboard.theme", theme)
    saveSettingsToServer({ theme })
  }

  function toggleCountryVisibility(code: string) {
    const next = hiddenCountries.includes(code)
      ? hiddenCountries.filter((c) => c !== code)
      : [...hiddenCountries, code]
    setHiddenCountries(next)
    localStorage.setItem(HIDDEN_COUNTRIES_KEY, JSON.stringify(next))
    saveSettingsToServer({ hiddenCountries: next })
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">

      {/* ── Top bar ── */}
      <header className="shrink-0 px-5 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">Personal Dashboard</h1>
        <div className="flex items-center gap-2">
          <button
            title="Notifications"
            className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Bell size={16} />
          </button>
          <button
            onClick={handleRefetch}
            title={isRefreshing ? "Refreshing…" : "Refresh"}
            disabled={isRefreshing}
            className={clsx(
              "p-1.5 rounded-md border transition-all duration-200",
              isRefreshing
                ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400"
                : justRefreshed
                ? "border-green-400 bg-green-50 dark:bg-green-900/30 text-green-500 dark:text-green-400"
                : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
          >
            {isRefreshing
              ? <RefreshCw size={16} className="animate-spin" />
              : justRefreshed
              ? <Check size={16} />
              : <RefreshCw size={16} />
            }
          </button>
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ══ Section: Calendar Preview ══════════════════════════════════════════ */}
        <div
          className={`overflow-hidden flex flex-col p-4 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-[width] duration-300 ${calendarWide ? "w-[60%]" : "w-[40%]"}`}
        >
          <TwoWeekCalendar
            events={visibleEvents}
            isLoading={isLoading}
            onLayoutHint={handleLayoutHint}
            feeds={feeds}
            feedErrors={feedErrors}
            onAddFeed={addFeed}
            onRemoveFeed={removeFeed}
            onUpdateFeed={updateFeed}
            onUpdateFeedColor={updateFeedColor}
            onToggleFeedVisibility={toggleFeedVisibility}
            selectedCountries={selectedCountries}
            hiddenCountries={hiddenCountries}
            countryColors={countryColors}
            onAddCountry={addCountry}
            onRemoveCountry={removeCountry}
            onUpdateCountryColor={updateCountryColor}
            onToggleCountryVisibility={toggleCountryVisibility}
            error={error}
          />
        </div>

        {/* ══ Section: Time Zones ════════════════════════════════════════════════ */}
        <div className={`overflow-y-auto p-5 bg-gray-50 dark:bg-gray-800 transition-[width] duration-300 ${calendarWide ? "w-[40%]" : "w-[60%]"}`}>
          <TimezoneConverter />
        </div>

      </div>
    </div>
  )
}
