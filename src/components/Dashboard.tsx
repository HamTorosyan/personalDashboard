"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import TwoWeekCalendar from "@/components/calendar/TwoWeekCalendar"
import CountrySelector, { STORAGE_KEY, CountryFlag } from "@/components/CountrySelector"
import IcsFeedManager from "@/components/IcsFeedManager"
import TimezoneConverter from "@/components/TimezoneConverter"
import { ColorPicker } from "@/components/ColorPicker"
import { useCalendarEvents } from "@/hooks/useCalendarEvents"
import { useIcsFeeds } from "@/hooks/useIcsFeeds"
import { RefreshCw } from "lucide-react"

const HIDDEN_COUNTRIES_KEY = "dashboard.hiddenCountries"
const COUNTRY_COLORS_KEY = "dashboard.countryColors"
const DEFAULT_HOLIDAY_COLOR = "#16a34a"

const countryName = new Intl.DisplayNames(["en"], { type: "region" })

export default function Dashboard() {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [hiddenCountries, setHiddenCountries] = useState<string[]>([])
  const [countryColors, setCountryColors] = useState<Record<string, string>>({})
  const [activePickerCode, setActivePickerCode] = useState<string | null>(null)
  const [calendarWide, setCalendarWide] = useState(true)
  const handleLayoutHint = useCallback((wide: boolean) => setCalendarWide(wide), [])
  const { feeds, addFeed, removeFeed, updateFeedColor, toggleFeedVisibility } = useIcsFeeds()

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
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

  function getCountryColor(code: string): string {
    return countryColors[code] ?? DEFAULT_HOLIDAY_COLOR
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

  function toggleCountryVisibility(code: string) {
    setHiddenCountries((prev) => {
      const next = prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
      localStorage.setItem(HIDDEN_COUNTRIES_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">

      {/* ── Top bar ── */}
      <header className="shrink-0 px-5 py-3 bg-white border-b border-gray-200 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900 whitespace-nowrap">Personal Dashboard</h1>
        <button
          onClick={refetch}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 text-sm hover:bg-gray-100 transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left — Calendar */}
        <div
          className={`overflow-y-auto p-4 border-r border-gray-200 bg-white transition-[width] duration-300 ${calendarWide ? "w-[60%]" : "w-[40%]"}`}
        >
          <TwoWeekCalendar events={visibleEvents} isLoading={isLoading} onLayoutHint={handleLayoutHint} />
        </div>

        {/* Right — two stacked panels */}
        <div className={`shrink-0 flex flex-col overflow-hidden transition-[width] duration-300 ${calendarWide ? "w-[40%]" : "w-[60%]"}`}>

          {/* Right-top — calendar controls */}
          <div className="flex-[2] overflow-y-auto p-5 border-b border-gray-200 bg-white flex flex-col gap-5">

            {/* ICS feeds */}
            <IcsFeedManager
              feeds={feeds}
              feedErrors={feedErrors}
              onAdd={addFeed}
              onRemove={removeFeed}
              onUpdateColor={updateFeedColor}
              onToggleVisibility={toggleFeedVisibility}
            />

            {/* Countries */}
            <div className="flex flex-col gap-2">
              <CountrySelector selected={selectedCountries} onChange={setSelectedCountries} />
              {selectedCountries.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 pl-0.5">
                  {selectedCountries.map((code) => (
                    <label key={code} className="relative flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!hiddenCountries.includes(code)}
                        onChange={() => toggleCountryVisibility(code)}
                        className="w-3.5 h-3.5 rounded accent-green-600 cursor-pointer"
                      />
                      {/* Color dot — opens picker */}
                      <button
                        type="button"
                        title="Change holiday color"
                        onClick={(e) => {
                          e.preventDefault()
                          setActivePickerCode(activePickerCode === code ? null : code)
                        }}
                        style={{ backgroundColor: getCountryColor(code) }}
                        className="w-3 h-3 rounded-sm shrink-0 ring-1 ring-transparent hover:ring-gray-400 transition-all border border-black/10"
                      />
                      {activePickerCode === code && (
                        <ColorPicker
                          current={getCountryColor(code)}
                          onChange={(color) => {
                            updateCountryColor(code, color)
                            setActivePickerCode(null)
                          }}
                          onClose={() => setActivePickerCode(null)}
                        />
                      )}
                      <CountryFlag code={code} size={16} />
                      <span className={hiddenCountries.includes(code) ? "text-gray-400" : "text-gray-700"}>
                        {countryName.of(code) ?? code}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 flex-wrap">
              <Legend color="bg-purple-500" label="Teams meeting" />
              <Legend color="bg-gray-400" label="Cancelled" />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Right-bottom — time zones */}
          <div className="flex-[3] overflow-y-auto p-5 bg-gray-50">
            <TimezoneConverter />
          </div>

        </div>
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded-sm ${color}`} />
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}
