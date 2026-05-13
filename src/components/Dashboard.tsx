"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import TwoWeekCalendar from "@/components/calendar/TwoWeekCalendar"
import TimezoneConverter from "@/components/TimezoneConverter"
import { useCalendarEvents } from "@/hooks/useCalendarEvents"
import { useIcsFeeds } from "@/hooks/useIcsFeeds"
import { RefreshCw, Moon, Sun, Bell } from "lucide-react"

const SELECTED_COUNTRIES_KEY = "dashboard.selectedCountries"
const HIDDEN_COUNTRIES_KEY = "dashboard.hiddenCountries"
const COUNTRY_COLORS_KEY = "dashboard.countryColors"

export default function Dashboard() {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [hiddenCountries, setHiddenCountries] = useState<string[]>([])
  const [countryColors, setCountryColors] = useState<Record<string, string>>({})
  const [calendarWide, setCalendarWide] = useState(true)
  const [isDark, setIsDark] = useState(false)
  const handleLayoutHint = useCallback((wide: boolean) => setCalendarWide(wide), [])
  const { feeds, addFeed, removeFeed, updateFeed, updateFeedColor, toggleFeedVisibility } = useIcsFeeds()

  useEffect(() => {
    const storedTheme = localStorage.getItem("dashboard.theme")
    const dark = storedTheme === "dark" || (!storedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    setIsDark(dark)
    document.documentElement.classList.toggle("dark", dark)
    try {
      const stored = localStorage.getItem(SELECTED_COUNTRIES_KEY)
      if (stored) setSelectedCountries(JSON.parse(stored))
    } catch {}
    try {
      const stored = localStorage.getItem(HIDDEN_COUNTRIES_KEY)
      if (stored) setHiddenCountries(JSON.parse(stored))
    } catch {}
    try {
      const stored = localStorage.getItem(COUNTRY_COLORS_KEY)
      if (stored) setCountryColors(JSON.parse(stored))
    } catch {}
  }, [])

  const { events, isLoading, error, feedErrors, refetch } = useCalendarEvents(selectedCountries, feeds)

  function addCountry(code: string, color: string) {
    setSelectedCountries((prev) => {
      if (prev.includes(code)) return prev
      const next = [...prev, code]
      localStorage.setItem(SELECTED_COUNTRIES_KEY, JSON.stringify(next))
      return next
    })
    updateCountryColor(code, color)
  }

  function removeCountry(code: string) {
    setSelectedCountries((prev) => {
      const next = prev.filter((c) => c !== code)
      localStorage.setItem(SELECTED_COUNTRIES_KEY, JSON.stringify(next))
      return next
    })
    setHiddenCountries((prev) => {
      const next = prev.filter((c) => c !== code)
      localStorage.setItem(HIDDEN_COUNTRIES_KEY, JSON.stringify(next))
      return next
    })
  }

  function updateCountryColor(code: string, color: string) {
    setCountryColors((prev) => {
      const next = { ...prev, [code]: color }
      localStorage.setItem(COUNTRY_COLORS_KEY, JSON.stringify(next))
      return next
    })
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
    localStorage.setItem("dashboard.theme", next ? "dark" : "light")
  }

  function toggleCountryVisibility(code: string) {
    setHiddenCountries((prev) => {
      const next = prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
      localStorage.setItem(HIDDEN_COUNTRIES_KEY, JSON.stringify(next))
      return next
    })
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
            onClick={refetch}
            title="Refresh"
            className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw size={16} />
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
