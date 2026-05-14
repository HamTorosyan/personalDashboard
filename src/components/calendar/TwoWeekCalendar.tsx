"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  addDays, addMonths, format, parseISO,
  startOfWeek, startOfDay, endOfDay, startOfMonth, endOfMonth,
} from "date-fns"
import { ChevronLeft, ChevronRight, Settings } from "lucide-react"
import { clsx } from "clsx"
import type { CalendarEvent, EventColor } from "@/lib/types"
import type { IcsFeed } from "@/hooks/useIcsFeeds"
import WeekGrid from "./WeekGrid"
import MonthView from "./MonthView"
import IcsFeedManager from "@/components/IcsFeedManager"
import HolidayManager from "@/components/HolidayManager"

// ─── types & helpers ─────────────────────────────────────────────────────────

type CalendarView = "day" | "work-week" | "week" | "month"

const VIEW_LABELS: Record<CalendarView, string> = {
  day: "Day",
  "work-week": "Work Week",
  week: "Week",
  month: "Month",
}

function monday(date: Date) {
  return startOfWeek(date, { weekStartsOn: 1 })
}

function viewRange(view: CalendarView, date: Date): { start: Date; end: Date } {
  const mon = monday(date)
  switch (view) {
    case "day":
      return { start: startOfDay(date), end: endOfDay(date) }
    case "work-week":
    case "week":
      return { start: mon, end: addDays(mon, 14) }
    case "month":
      return { start: startOfMonth(date), end: endOfMonth(date) }
  }
}

function viewTitle(view: CalendarView, date: Date): string {
  const mon = monday(date)
  switch (view) {
    case "day":
      return format(date, "EEEE, MMMM d, yyyy")
    case "work-week":
      return `${format(mon, "MMM d")} – ${format(addDays(mon, 11), "MMM d, yyyy")}`
    case "week":
      return `${format(mon, "MMM d")} – ${format(addDays(mon, 13), "MMM d, yyyy")}`
    case "month":
      return format(date, "MMMM yyyy")
  }
}

function navigateDate(view: CalendarView, date: Date, dir: 1 | -1): Date {
  switch (view) {
    case "day":       return addDays(date, dir)
    case "work-week":
    case "week":      return addDays(date, 7 * dir)
    case "month":     return addMonths(date, dir)
  }
}

function filterEvents(events: CalendarEvent[], start: Date, end: Date) {
  return events.filter((e) => {
    try {
      const s = parseISO(e.start)
      const eEnd = parseISO(e.end)
      return s < end && eEnd > start
    } catch { return false }
  })
}

function maxAllDayPerDay(evts: CalendarEvent[], start: Date, days: number): number {
  let max = 0
  for (let i = 0; i < days; i++) {
    const d = format(addDays(start, i), "yyyy-MM-dd")
    max = Math.max(max, evts.filter((e) => e.isAllDay && e.start.startsWith(d)).length)
  }
  return max
}


// ─── component ───────────────────────────────────────────────────────────────

interface TwoWeekCalendarProps {
  events: CalendarEvent[]
  isLoading?: boolean
  onLayoutHint?: (wide: boolean) => void
  // ICS feeds
  feeds: IcsFeed[]
  feedErrors: Record<string, string>
  onAddFeed: (label: string, url: string, color: EventColor) => string | null
  onRemoveFeed: (id: string) => void
  onUpdateFeed: (id: string, label: string, url: string, color: EventColor) => string | null
  onUpdateFeedColor: (id: string, color: EventColor) => void
  onToggleFeedVisibility: (id: string) => void
  // Holidays
  selectedCountries: string[]
  hiddenCountries: string[]
  countryColors: Record<string, string>
  onAddCountry: (code: string, color: EventColor) => void
  onRemoveCountry: (code: string) => void
  onUpdateCountryColor: (code: string, color: EventColor) => void
  onToggleCountryVisibility: (code: string) => void
  // Error banner
  error?: string | null
}

export default function TwoWeekCalendar({
  events,
  isLoading = false,
  onLayoutHint,
  feeds,
  feedErrors,
  onAddFeed,
  onRemoveFeed,
  onUpdateFeed,
  onUpdateFeedColor,
  onToggleFeedVisibility,
  selectedCountries,
  hiddenCountries,
  countryColors,
  onAddCountry,
  onRemoveCountry,
  onUpdateCountryColor,
  onToggleCountryVisibility,
  error,
}: TwoWeekCalendarProps) {
  const [view, setView] = useState<CalendarView>("week")
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date())
  const [showNextWeek, setShowNextWeek] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [draftView, setDraftView] = useState<CalendarView>(view)
  const [draftShowNextWeek, setDraftShowNextWeek] = useState(showNextWeek)

  // Scroll sync refs
  const grid1Ref = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>
  const grid2Ref = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>
  const isSyncing = useRef(false)
  const settingsRef = useRef<HTMLDivElement>(null)
  const didAutoNavigate = useRef(false)

  // Auto-navigate to nearest ICS event when they first load
  useEffect(() => {
    if (didAutoNavigate.current) return
    const icsEvents = events.filter((e) => e.source === "ics")
    if (icsEvents.length === 0) return
    didAutoNavigate.current = true
    const today = new Date()
    const nearest = icsEvents
      .map((e) => {
        try { return { date: parseISO(e.start), event: e } } catch { return null }
      })
      .filter(Boolean)
      .sort((a, b) => Math.abs(a!.date.getTime() - today.getTime()) - Math.abs(b!.date.getTime() - today.getTime()))[0]
    if (nearest) setCurrentDate(nearest.date)
  }, [events])

  const isWeekMode = view === "week" || view === "work-week"
  const calendarWide = !isWeekMode || showNextWeek

  useEffect(() => {
    onLayoutHint?.(calendarWide)
  }, [calendarWide, onLayoutHint])

  // Close settings popup on outside click
  useEffect(() => {
    if (!showSettings) return
    function onMouseDown(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false)
      }
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [showSettings])

  const handleGrid1Scroll = useCallback((scrollTop: number) => {
    if (isSyncing.current) return
    const el = grid2Ref.current
    if (!el) return
    isSyncing.current = true
    el.scrollTop = scrollTop
    requestAnimationFrame(() => { isSyncing.current = false })
  }, [])

  const handleGrid2Scroll = useCallback((scrollTop: number) => {
    if (isSyncing.current) return
    const el = grid1Ref.current
    if (!el) return
    isSyncing.current = true
    el.scrollTop = scrollTop
    requestAnimationFrame(() => { isSyncing.current = false })
  }, [])

  const mon = monday(currentDate)
  const { start: rangeStart, end: rangeEnd } = viewRange(view, currentDate)
  const visibleEvents = filterEvents(events, rangeStart, rangeEnd)

  if (isLoading) {
    return (
      <div className="flex gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
            <div className="h-10 bg-gray-100 dark:bg-gray-700" />
            <div className="h-96 bg-gray-50 dark:bg-gray-800" />
          </div>
        ))}
      </div>
    )
  }

  const week2Start = addDays(mon, 7)

  const syncedAllDayRows = (() => {
    if (!isWeekMode) return 0
    const days = view === "work-week" ? 5 : 7
    const w1 = filterEvents(events, mon, week2Start)
    const w2 = filterEvents(events, week2Start, addDays(mon, 14))
    return Math.max(
      maxAllDayPerDay(w1, mon, days),
      showNextWeek ? maxAllDayPerDay(w2, week2Start, days) : 0
    )
  })()

  return (
    <div className="h-full flex flex-col">
      {/* ── toolbar ── */}
      <div className="flex-none flex items-center justify-between mb-3 gap-2">

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentDate((d) => navigateDate(view, d, -1))}
            className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Previous"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-2.5 py-1.5 text-sm leading-4 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentDate((d) => navigateDate(view, d, 1))}
            className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Next"
          >
            <ChevronRight size={16} />
          </button>
          <span className="ml-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
            {viewTitle(view, currentDate)}
          </span>
        </div>

        {/* Gear button + settings popup */}
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => {
              setDraftView(view)
              setDraftShowNextWeek(showNextWeek)
              setShowSettings((v) => !v)
            }}
            className={clsx(
              "relative p-1.5 rounded-md border transition-colors",
              showSettings
                ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
            title="Calendar settings"
          >
            <Settings size={15} />
            {Object.keys(feedErrors).length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 border border-white dark:border-gray-900" />
            )}
          </button>

          {showSettings && (
            <div className="absolute right-0 top-full mt-1.5 z-50 w-96 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg flex flex-col overflow-hidden" style={{ maxHeight: "80vh" }}>

              {/* ── View settings (fixed, always visible) ── */}
              <div className="flex-none p-3 flex flex-col gap-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                    View
                  </label>
                  <select
                    value={draftView}
                    onChange={(e) => setDraftView(e.target.value as CalendarView)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {(Object.keys(VIEW_LABELS) as CalendarView[]).map((v) => (
                      <option key={v} value={v}>{VIEW_LABELS[v]}</option>
                    ))}
                  </select>
                </div>

                {(draftView === "week" || draftView === "work-week") && (
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={draftShowNextWeek}
                      onChange={(e) => setDraftShowNextWeek(e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-blue-600 cursor-pointer"
                    />
                    Show next week
                  </label>
                )}
              </div>

              {/* ── Calendars & Holidays (scrollable) ── */}
              <div className="overflow-y-auto p-3 flex flex-col gap-4">
                <IcsFeedManager
                  feeds={feeds}
                  feedErrors={feedErrors}
                  onAdd={onAddFeed}
                  onRemove={onRemoveFeed}
                  onUpdate={onUpdateFeed}
                  onUpdateColor={onUpdateFeedColor}
                  onToggleVisibility={onToggleFeedVisibility}
                />

                <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                  <HolidayManager
                    selected={selectedCountries}
                    hiddenCountries={hiddenCountries}
                    countryColors={countryColors}
                    onAdd={onAddCountry}
                    onRemove={onRemoveCountry}
                    onUpdateColor={onUpdateCountryColor}
                    onToggleVisibility={onToggleCountryVisibility}
                  />
                </div>

                {error && (
                  <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs">
                    {error}
                  </div>
                )}
              </div>

              {/* ── Actions (fixed at bottom) ── */}
              <div className="flex-none flex gap-2 p-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setView(draftView)
                    setShowNextWeek(draftShowNextWeek)
                    setShowSettings(false)
                  }}
                  className="flex-1 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── views ── */}
      <div className="flex-1 min-h-0">

      {view === "day" && (
        <WeekGrid weekStart={currentDate} events={visibleEvents} dayCount={1} highlightTodayColumn={false} />
      )}

      {view === "work-week" && (
        <div className="flex gap-3 h-full">
          <div className="flex-1 min-w-0 h-full">
            <WeekGrid
              weekStart={mon}
              events={filterEvents(events, mon, week2Start)}
              dayCount={5}
              minAllDayRows={syncedAllDayRows}
              scrollRef={grid1Ref}
              onScroll={showNextWeek ? handleGrid1Scroll : undefined}
              hideScrollbar={showNextWeek}
            />
          </div>
          {showNextWeek && (
            <div className="flex-1 min-w-0 h-full">
              <WeekGrid
                weekStart={week2Start}
                events={filterEvents(events, week2Start, addDays(mon, 14))}
                dayCount={5}
                minAllDayRows={syncedAllDayRows}
                scrollRef={grid2Ref}
                onScroll={handleGrid2Scroll}
              />
            </div>
          )}
        </div>
      )}

      {view === "week" && (
        <div className="flex gap-3 h-full">
          <div className="flex-1 min-w-0 h-full">
            <WeekGrid
              weekStart={mon}
              events={filterEvents(events, mon, week2Start)}
              dayCount={7}
              minAllDayRows={syncedAllDayRows}
              scrollRef={grid1Ref}
              onScroll={showNextWeek ? handleGrid1Scroll : undefined}
              hideScrollbar={showNextWeek}
            />
          </div>
          {showNextWeek && (
            <div className="flex-1 min-w-0 h-full">
              <WeekGrid
                weekStart={week2Start}
                events={filterEvents(events, week2Start, addDays(mon, 14))}
                dayCount={7}
                minAllDayRows={syncedAllDayRows}
                scrollRef={grid2Ref}
                onScroll={handleGrid2Scroll}
              />
            </div>
          )}
        </div>
      )}

      {view === "month" && (
        <MonthView date={currentDate} events={visibleEvents} />
      )}

      </div>
    </div>
  )
}
