"use client"

import { format, startOfMonth, startOfWeek, addDays, isSameDay, isSameMonth, isToday, parseISO } from "date-fns"
import { clsx } from "clsx"
import type { CalendarEvent } from "@/lib/types"

interface MonthViewProps {
  date: Date
  events: CalendarEvent[]
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const CHIP: Record<string, string> = {
  blue:   "bg-blue-500 text-white",
  purple: "bg-purple-500 text-white",
  cyan:   "bg-cyan-500 text-white",
  green:  "bg-green-600 text-white",
  gray:   "bg-gray-300 text-gray-600",
  orange: "bg-orange-500 text-white",
}

export default function MonthView({ date, events }: MonthViewProps) {
  const gridStart = startOfWeek(startOfMonth(date), { weekStartsOn: 1 })
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells — 6 rows × 7 cols */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const inMonth = isSameMonth(day, date)
          const today = isToday(day)
          const dayEvents = events.filter((e) => {
            try { return isSameDay(parseISO(e.start), day) } catch { return false }
          })
          const visible = dayEvents.slice(0, 3)
          const overflow = dayEvents.length - visible.length
          const isLastCol = i % 7 === 6

          return (
            <div
              key={i}
              className={clsx(
                "min-h-[6.5rem] border-b border-r border-gray-100 p-1.5",
                !inMonth && "bg-gray-50/70",
                isLastCol && "border-r-0"
              )}
            >
              {/* Day number */}
              <div
                className={clsx(
                  "w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 mx-auto",
                  today
                    ? "bg-blue-600 text-white font-bold"
                    : inMonth
                    ? "text-gray-800"
                    : "text-gray-400"
                )}
              >
                {format(day, "d")}
              </div>

              {/* Event chips */}
              <div className="space-y-0.5">
                {visible.map((e) => {
                  const isHex = e.color.startsWith("#")
                  return (
                  <div
                    key={e.id}
                    onClick={() => e.meetingUrl && window.open(e.meetingUrl, "_blank", "noopener,noreferrer")}
                    title={e.title}
                    className={clsx(
                      "text-[11px] truncate rounded px-1 py-0.5 leading-tight",
                      isHex ? "text-white" : (CHIP[e.color] ?? CHIP.blue),
                      e.meetingUrl && "cursor-pointer",
                      e.isCancelled && "opacity-60 line-through"
                    )}
                    style={isHex ? { backgroundColor: e.color } : undefined}
                  >
                    {!e.isAllDay && (
                      <span className="opacity-75 mr-0.5">{format(parseISO(e.start), "HH:mm")}</span>
                    )}
                    {e.title}
                  </div>
                  )
                })}
                {overflow > 0 && (
                  <div className="text-[11px] text-gray-400 pl-1">+{overflow} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
