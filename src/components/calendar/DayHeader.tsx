import { formatDayHeader } from "@/lib/dateUtils"
import { clsx } from "clsx"

interface DayHeaderProps {
  date: Date
  isToday: boolean
  allDayEvents?: Array<{ id: string; title: string; color: string }>
}

export default function DayHeader({ date, isToday, allDayEvents = [] }: DayHeaderProps) {
  const { weekday, day } = formatDayHeader(date)

  return (
    <div className="flex flex-col items-center py-1 border-b border-gray-200">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {weekday}
      </span>
      <span
        className={clsx(
          "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold mt-0.5",
          isToday
            ? "bg-blue-600 text-white"
            : "text-gray-800 hover:bg-gray-100"
        )}
      >
        {day}
      </span>
      {allDayEvents.map((ev) => (
        <div
          key={ev.id}
          className={clsx(
            "w-full mt-0.5 px-1 py-0.5 rounded text-xs text-white truncate",
            ALL_DAY_COLOR_MAP[ev.color] ?? "bg-gray-400"
          )}
          title={ev.title}
        >
          {ev.title}
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
}
