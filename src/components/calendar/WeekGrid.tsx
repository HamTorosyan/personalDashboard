"use client"

import { useEffect, useRef, useState } from "react"
import { clsx } from "clsx"
import { CalendarEvent } from "@/lib/types"
import {
  getWeekDays,
  getTimeSlots,
  getEventRowStart,
  getEventRowSpan,
  toDateString,
  TIME_SLOT_COUNT,
} from "@/lib/dateUtils"
import { isSameDay, isToday, parseISO } from "date-fns"
import DayHeader from "./DayHeader"
import TimeGutter from "./TimeGutter"
import EventBlock from "./EventBlock"

interface WeekGridProps {
  weekStart: Date
  events: CalendarEvent[]
  label?: string
  dayCount?: number
  minAllDayRows?: number
  scrollRef?: React.RefObject<HTMLDivElement>
  onScroll?: (scrollTop: number) => void
  hideScrollbar?: boolean
  highlightTodayColumn?: boolean
}

const ROW_HEIGHT_PX = 56 // 3.5rem at 16px base
const ROW_HEIGHT = "3.5rem"

export default function WeekGrid({
  weekStart,
  events,
  label,
  dayCount = 7,
  minAllDayRows = 0,
  scrollRef: externalScrollRef,
  onScroll,
  hideScrollbar = false,
  highlightTodayColumn = true,
}: WeekGridProps) {
  const days = getWeekDays(weekStart).slice(0, dayCount)
  const timeSlots = getTimeSlots()
  const internalScrollRef = useRef<HTMLDivElement>(null)
  const scrollRef = (externalScrollRef ?? internalScrollRef) as React.RefObject<HTMLDivElement>

  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  // Auto-scroll: show current time if today is visible, otherwise start at 8 AM
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const todayVisible = days.some((d) => isToday(d))
    const targetHour = todayVisible ? Math.max(8, now.getHours() - 1) : 8
    el.scrollTop = targetHour * 2 * ROW_HEIGHT_PX
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isTodayVisible = days.some((d) => isToday(d))
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes()
  const timeLineTopPx = (minutesSinceMidnight / 30) * ROW_HEIGHT_PX

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

  function layoutDayEvents(dayEvents: CalendarEvent[]) {
    if (dayEvents.length <= 1) {
      return dayEvents.map((e) => ({ event: e, left: 0, width: 100 }))
    }

    const columns: CalendarEvent[][] = []
    const assignments: Map<string, number> = new Map()

    for (const ev of dayEvents) {
      const evStart = getEventRowStart(ev.start)
      const evEnd = evStart + getEventRowSpan(ev.start, ev.end)

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
    <div className="h-full flex flex-col">
      {label && (
        <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 px-2">
          {label}
        </h2>
      )}

      {/*
        Single scrollable container — scrollbar is on this div, so it takes
        space from the full width (header + body), keeping columns aligned.
      */}
      <div
        ref={scrollRef}
        className={clsx(
          "flex-1 min-h-0 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden overflow-y-auto bg-white dark:bg-gray-900",
          hideScrollbar && "scrollbar-hidden"
        )}
        onScroll={onScroll ? (e) => onScroll((e.target as HTMLDivElement).scrollTop) : undefined}
      >
        {/* ── Sticky header: corner + day names ── */}
        <div
          className="sticky top-0 z-20 grid border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
          style={{ gridTemplateColumns: `3rem repeat(${dayCount}, minmax(0, 1fr))` }}
        >
          <div className="border-r border-gray-200 dark:border-gray-700" />
          {days.map((day) => (
            <div
              key={toDateString(day)}
              className={clsx(
                "border-r border-gray-200 dark:border-gray-700 last:border-r-0 overflow-hidden min-w-0",
                highlightTodayColumn && isToday(day)
                  ? "bg-blue-50 dark:bg-blue-950/30"
                  : ""
              )}
            >
              <DayHeader
                date={day}
                isToday={isToday(day)}
                allDayEvents={getEventsForDay(day, allDayEvents).map((e) => ({
                  id: e.id,
                  title: e.title,
                  color: e.color,
                }))}
                minRows={minAllDayRows}
              />
            </div>
          ))}
        </div>

        {/* ── Grid body (relative so the time line is anchored here) ── */}
        <div className="relative">
          {/* Current-time indicator */}
          {isTodayVisible && (
            <div
              className="absolute z-10 pointer-events-none flex items-center"
              style={{ top: `${timeLineTopPx}px`, left: "3rem", right: 0 }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 dark:bg-blue-400 -ml-1.5 flex-none" />
              <div className="flex-1 h-px bg-blue-500 dark:bg-blue-400" />
            </div>
          )}

          <div
            className="grid"
            style={{
              gridTemplateColumns: `3rem repeat(${dayCount}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${TIME_SLOT_COUNT}, ${ROW_HEIGHT})`,
            }}
          >
            {/* Time gutter */}
            <div
              className="relative border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              style={{ gridColumn: 1, gridRow: `1 / ${TIME_SLOT_COUNT + 1}` }}
            >
              <div
                className="grid"
                style={{ gridTemplateRows: `repeat(${TIME_SLOT_COUNT}, ${ROW_HEIGHT})` }}
              >
                <TimeGutter />
              </div>
            </div>

            {/* Day columns */}
            {days.map((day, colIdx) => {
              const dayTimedEvents = getEventsForDay(day, timedEvents)
              const laid = layoutDayEvents(dayTimedEvents)

              return (
                <div
                  key={`col-${toDateString(day)}`}
                  className={clsx(
                    "relative border-r border-gray-200 dark:border-gray-700 last:border-r-0",
                    highlightTodayColumn && isToday(day) && "bg-blue-50/40 dark:bg-blue-900/10"
                  )}
                  style={{
                    gridColumn: colIdx + 2,
                    gridRow: `1 / ${TIME_SLOT_COUNT + 1}`,
                  }}
                >
                  {/* 30-min grid lines */}
                  {timeSlots.map((_, rowIdx) => (
                    <div
                      key={rowIdx}
                      className="absolute w-full border-b border-gray-100 dark:border-gray-800"
                      style={{ top: `${(rowIdx / TIME_SLOT_COUNT) * 100}%`, height: 0 }}
                    />
                  ))}

                  {/* Hour lines (every 60 min) slightly darker */}
                  {timeSlots.map((_, rowIdx) =>
                    rowIdx % 2 === 0 ? (
                      <div
                        key={`hour-${rowIdx}`}
                        className="absolute w-full border-b border-gray-200 dark:border-gray-700"
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
                          height: `${Math.max(heightPct, (1 / totalRows) * 100)}%`,
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
      </div>
    </div>
  )
}
