"use client"

import { CalendarEvent } from "@/lib/types"
import { getCurrentWeekStart, getNextWeekStart } from "@/lib/dateUtils"
import { addDays, parseISO } from "date-fns"
import WeekGrid from "./WeekGrid"

interface TwoWeekCalendarProps {
  events: CalendarEvent[]
  isLoading?: boolean
}

export default function TwoWeekCalendar({ events, isLoading = false }: TwoWeekCalendarProps) {
  const currentWeekStart = getCurrentWeekStart()
  const nextWeekStart = getNextWeekStart()

  function eventsForWeek(weekStart: Date) {
    const weekEnd = addDays(weekStart, 7)
    return events.filter((e) => {
      try {
        const start = parseISO(e.start)
        return start >= weekStart && start < weekEnd
      } catch {
        return false
      }
    })
  }

  function weekLabel(weekStart: Date) {
    const end = addDays(weekStart, 6)
    return `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-lg border border-gray-200 overflow-hidden animate-pulse">
            <div className="h-10 bg-gray-100" />
            <div className="grid grid-cols-8 divide-x divide-gray-200">
              {Array.from({ length: 8 }).map((_, j) => (
                <div key={j} className="h-96 bg-gray-50" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <WeekGrid
        weekStart={currentWeekStart}
        events={eventsForWeek(currentWeekStart)}
        label={`This week · ${weekLabel(currentWeekStart)}`}
      />
      <WeekGrid
        weekStart={nextWeekStart}
        events={eventsForWeek(nextWeekStart)}
        label={`Next week · ${weekLabel(nextWeekStart)}`}
      />
    </div>
  )
}
