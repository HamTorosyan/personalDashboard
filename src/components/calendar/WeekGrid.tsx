"use client"

import { CalendarEvent } from "@/lib/types"
import {
  getWeekDays,
  getTimeSlots,
  getEventRowStart,
  getEventRowSpan,
  toDateString,
  TIME_SLOT_COUNT,
} from "@/lib/dateUtils"
import { isSameDay, isToday, parseISO, startOfDay } from "date-fns"
import DayHeader from "./DayHeader"
import TimeGutter from "./TimeGutter"
import EventBlock from "./EventBlock"

interface WeekGridProps {
  weekStart: Date
  events: CalendarEvent[]
  label?: string
  dayCount?: number
}

export default function WeekGrid({ weekStart, events, label, dayCount = 7 }: WeekGridProps) {
  const days = getWeekDays(weekStart).slice(0, dayCount)
  const timeSlots = getTimeSlots()

  // Split events into all-day and timed
  const allDayEvents = events.filter((e) => e.isAllDay)
  const timedEvents = events.filter((e) => !e.isAllDay)

  function getEventsForDay(day: Date, eventList: CalendarEvent[]) {
    return eventList.filter((e) => {
      try {
        return isSameDay(parseISO(e.start), day)
      } catch {
        return false
      }
    })
  }

  /**
   * For overlapping timed events on the same day, assign left/width percentages
   * so they appear side-by-side.
   */
  function layoutDayEvents(dayEvents: CalendarEvent[]) {
    if (dayEvents.length <= 1) {
      return dayEvents.map((e) => ({ event: e, left: 0, width: 100 }))
    }

    // Simple greedy column assignment
    const columns: CalendarEvent[][] = []
    const assignments: Map<string, number> = new Map()

    for (const ev of dayEvents) {
      const evStart = getEventRowStart(ev.start)
      const evEnd = evStart + getEventRowSpan(ev.start, ev.end)

      // Find the first column where the last event doesn't overlap
      let placed = false
      for (let col = 0; col < columns.length; col++) {
        const lastInCol = columns[col][columns[col].length - 1]
        const lastEnd =
          getEventRowStart(lastInCol.start) +
          getEventRowSpan(lastInCol.start, lastInCol.end)
        if (evStart >= lastEnd) {
          columns[col].push(ev)
          assignments.set(ev.id, col)
          placed = true
          break
        }
      }
      if (!placed) {
        columns.push([ev])
        assignments.set(ev.id, columns.length - 1)
      }
    }

    const total = columns.length
    return dayEvents.map((ev) => {
      const col = assignments.get(ev.id) ?? 0
      return {
        event: ev,
        left: (col / total) * 100,
        width: (1 / total) * 100,
      }
    })
  }

  return (
    <div className="mb-6">
      {label && <h2 className="text-sm font-semibold text-gray-600 mb-1 px-2">{label}</h2>}

      {/*
        CSS Grid:
          col 1 = time gutter (3rem)
          cols 2–8 = 7 day columns
          row 1 = day headers
          rows 2–(TIME_SLOT_COUNT+1) = 30-min time slots
      */}
      <div
        className="grid border border-gray-200 rounded-lg overflow-hidden bg-white"
        style={{
          gridTemplateColumns: `3rem repeat(${dayCount}, 1fr)`,
          gridTemplateRows: `auto repeat(${TIME_SLOT_COUNT}, 3.5rem)`,
        }}
      >
        {/* Top-left corner cell */}
        <div className="border-b border-r border-gray-200 bg-gray-50" style={{ gridColumn: 1, gridRow: 1 }} />

        {/* Day header cells */}
        {days.map((day, colIdx) => (
          <div
            key={toDateString(day)}
            className="border-b border-r border-gray-200 bg-gray-50 last:border-r-0"
            style={{ gridColumn: colIdx + 2, gridRow: 1 }}
          >
            <DayHeader
              date={day}
              isToday={isToday(day)}
              allDayEvents={getEventsForDay(day, allDayEvents).map((e) => ({
                id: e.id,
                title: e.title,
                color: e.color,
              }))}
            />
          </div>
        ))}

        {/* Time gutter labels */}
        <div style={{ gridColumn: 1, gridRow: `2 / ${TIME_SLOT_COUNT + 2}` }} className="relative border-r border-gray-200 bg-gray-50">
          <div
            className="grid"
            style={{ gridTemplateRows: `repeat(${TIME_SLOT_COUNT}, 3.5rem)` }}
          >
            <TimeGutter />
          </div>
        </div>

        {/* Day columns with events */}
        {days.map((day, colIdx) => {
          const dayTimedEvents = getEventsForDay(day, timedEvents)
          const laid = layoutDayEvents(dayTimedEvents)

          return (
            <div
              key={`col-${toDateString(day)}`}
              className="relative border-r border-gray-200 last:border-r-0"
              style={{
                gridColumn: colIdx + 2,
                gridRow: `2 / ${TIME_SLOT_COUNT + 2}`,
              }}
            >
              {/* Horizontal grid lines every 30 min */}
              {timeSlots.map((_, rowIdx) => (
                <div
                  key={rowIdx}
                  className="absolute w-full border-b border-gray-100"
                  style={{ top: `${(rowIdx / TIME_SLOT_COUNT) * 100}%`, height: 0 }}
                />
              ))}

              {/* Hour lines (every other slot = 60 min) slightly darker */}
              {timeSlots.map((_, rowIdx) =>
                rowIdx % 2 === 0 ? (
                  <div
                    key={`hour-${rowIdx}`}
                    className="absolute w-full border-b border-gray-200"
                    style={{ top: `${(rowIdx / TIME_SLOT_COUNT) * 100}%`, height: 0 }}
                  />
                ) : null
              )}

              {/* Events */}
              {laid.map(({ event, left, width }) => {
                const rowStart = getEventRowStart(event.start)
                const rowSpan = getEventRowSpan(event.start, event.end)
                const totalRows = TIME_SLOT_COUNT

                const topPct = ((rowStart - 2) / totalRows) * 100
                const heightPct = (rowSpan / totalRows) * 100

                return (
                  <EventBlock
                    key={event.id}
                    event={event}
                    style={{
                      top: `${topPct}%`,
                      height: `${Math.max(heightPct, 3.5 / (totalRows * 3.5) * 100)}%`,
                      left: `${left}%`,
                      width: `${width}%`,
                      right: "auto",
                    }}
                  />
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
