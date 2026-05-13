import { formatDayHeader } from "@/lib/dateUtils"
import { clsx } from "clsx"

interface DayHeaderProps {
  date: Date
  isToday: boolean
  allDayEvents?: Array<{ id: string; title: string; color: string }>
  minRows?: number
}

export default function DayHeader({ date, isToday, allDayEvents = [], minRows = 0 }: DayHeaderProps) {
  const { weekday, day } = formatDayHeader(date)

  return (
    <div className="flex flex-col items-center py-1 border-b border-gray-200 dark:border-gray-700 overflow-hidden w-full">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {weekday}
      </span>
      <span
        className={clsx(
          "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold mt-0.5",
          isToday
            ? "bg-blue-600 text-white"
            : "text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
        )}
      >
        {day}
      </span>
      {allDayEvents.map((ev) => {
        const isHex = ev.color.startsWith("#")
        return (
          <div
            key={ev.id}
            className={clsx(
              "w-full mt-0.5 px-1 py-0.5 rounded text-xs text-white truncate",
              !isHex && (ALL_DAY_COLOR_MAP[ev.color] ?? "bg-gray-400")
            )}
            style={isHex ? { backgroundColor: ev.color } : undefined}
            title={ev.title}
          >
            {ev.title}
          </div>
        )
      })}
      {Array.from({ length: Math.max(0, minRows - allDayEvents.length) }).map((_, i) => (
        <div key={`pad-${i}`} className="invisible w-full mt-0.5 px-1 py-0.5 text-xs">
          &nbsp;
        </div>
      ))}
    </div>
  )
}

const ALL_DAY_COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  cyan: "bg-cyan-500",
  green: "bg-green-600",
  gray: "bg-gray-400",
  orange: "bg-orange-500",
}
