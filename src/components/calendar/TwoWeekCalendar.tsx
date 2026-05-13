"use client"

import { useState, useEffect } from "react"
import {
  addDays, addMonths, format, parseISO,
  startOfWeek, startOfDay, endOfDay, startOfMonth, endOfMonth,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { clsx } from "clsx"
import type { CalendarEvent } from "@/lib/types"
import WeekGrid from "./WeekGrid"
import MonthView from "./MonthView"

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
      // Both show 2 weeks; range covers full 14 days
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
      // Mon of week 1 → Fri of week 2 (+11 days)
      return `${format(mon, "MMM d")} – ${format(addDays(mon, 11), "MMM d, yyyy")}`
    case "week":
      // Mon of week 1 → Sun of week 2 (+13 days)
      return `${format(mon, "MMM d")} – ${format(addDays(mon, 13), "MMM d, yyyy")}`
    case "month":
      return format(date, "MMMM yyyy")
  }
}

function navigateDate(view: CalendarView, date: Date, dir: 1 | -1): Date {
  switch (view) {
    case "day":       return addDays(date, dir)
    case "work-week":
    case "week":      return addDays(date, 14 * dir)
    case "month":     return addMonths(date, dir)
  }
}

function filterEvents(events: CalendarEvent[], start: Date, end: Date) {
  return events.filter((e) => {
    try { const s = parseISO(e.start); return s >= start && s < end }
    catch { return false }
  })
}

function weekLabel(mon: Date, dayCount: number) {
  const end = addDays(mon, dayCount - 1)
  return `${format(mon, "MMM d")} – ${format(end, "MMM d")}`
}

// ─── component ───────────────────────────────────────────────────────────────

interface TwoWeekCalendarProps {
  events: CalendarEvent[]
  isLoading?: boolean
  onLayoutHint?: (wide: boolean) => void
}

export default function TwoWeekCalendar({ events, isLoading = false, onLayoutHint }: TwoWeekCalendarProps) {
  const [view, setView] = useState<CalendarView>("week")
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date())
  const [showNextWeek, setShowNextWeek] = useState(true)

  const isWeekMode = view === "week" || view === "work-week"
  const calendarWide = !isWeekMode || showNextWeek

  useEffect(() => {
    onLayoutHint?.(calendarWide)
  }, [calendarWide, onLayoutHint])

  const mon = monday(currentDate)
  const { start: rangeStart, end: rangeEnd } = viewRange(view, currentDate)
  const visibleEvents = filterEvents(events, rangeStart, rangeEnd)

  if (isLoading) {
    return (
      <div className="flex gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="flex-1 rounded-lg border border-gray-200 overflow-hidden animate-pulse">
            <div className="h-10 bg-gray-100" />
            <div className="h-96 bg-gray-50" />
          </div>
        ))}
      </div>
    )
  }

  const week2Start = addDays(mon, 7)

  return (
    <div>
      {/* ── toolbar ── */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentDate((d) => navigateDate(view, d, -1))}
            className="p-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
            title="Previous"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 text-sm hover:bg-gray-100 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentDate((d) => navigateDate(view, d, 1))}
            className="p-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
            title="Next"
          >
            <ChevronRight size={16} />
          </button>
          <span className="ml-2 text-sm font-semibold text-gray-800">
            {viewTitle(view, currentDate)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isWeekMode && (
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showNextWeek}
                onChange={(e) => setShowNextWeek(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-blue-600 cursor-pointer"
              />
              Show next week
            </label>
          )}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            {(Object.keys(VIEW_LABELS) as CalendarView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={clsx(
                  "px-3 py-1.5 font-medium border-r border-gray-200 last:border-r-0 transition-colors whitespace-nowrap",
                  view === v ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                )}
              >
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── views ── */}

      {view === "day" && (
        <WeekGrid weekStart={currentDate} events={visibleEvents} dayCount={1} />
      )}

      {view === "work-week" && (
        <div className="flex gap-3">
          <div className="flex-1 min-w-0">
            <WeekGrid
              weekStart={mon}
              events={filterEvents(events, mon, week2Start)}
              dayCount={5}
              label={weekLabel(mon, 5)}
            />
          </div>
          {showNextWeek && (
            <div className="flex-1 min-w-0">
              <WeekGrid
                weekStart={week2Start}
                events={filterEvents(events, week2Start, addDays(mon, 14))}
                dayCount={5}
                label={weekLabel(week2Start, 5)}
              />
            </div>
          )}
        </div>
      )}

      {view === "week" && (
        <div className="flex gap-3">
          <div className="flex-1 min-w-0">
            <WeekGrid
              weekStart={mon}
              events={filterEvents(events, mon, week2Start)}
              dayCount={7}
              label={weekLabel(mon, 7)}
            />
          </div>
          {showNextWeek && (
            <div className="flex-1 min-w-0">
              <WeekGrid
                weekStart={week2Start}
                events={filterEvents(events, week2Start, addDays(mon, 14))}
                dayCount={7}
                label={weekLabel(week2Start, 7)}
              />
            </div>
          )}
        </div>
      )}

      {view === "month" && (
        <MonthView date={currentDate} events={visibleEvents} />
      )}
    </div>
  )
}
