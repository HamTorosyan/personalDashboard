"use client"

import { CalendarEvent } from "@/lib/types"
import { clsx } from "clsx"
import { Video } from "lucide-react"
import { format, parseISO } from "date-fns"

interface EventBlockProps {
  event: CalendarEvent
  style?: React.CSSProperties
}

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-500 hover:bg-blue-600 border-blue-700",
  purple: "bg-purple-500 hover:bg-purple-600 border-purple-700",
  cyan: "bg-cyan-500 hover:bg-cyan-600 border-cyan-700",
  green: "bg-green-600 hover:bg-green-700 border-green-800",
  gray: "bg-gray-400 hover:bg-gray-500 border-gray-600 line-through",
  orange: "bg-orange-500 hover:bg-orange-600 border-orange-700",
}

export default function EventBlock({ event, style }: EventBlockProps) {
  const isHex = event.color.startsWith("#")
  const colorClasses = isHex ? "" : (COLOR_MAP[event.color] ?? COLOR_MAP.blue)
  const bgStyle = isHex ? { backgroundColor: event.color } : undefined

  function handleClick() {
    if (event.meetingUrl) {
      window.open(event.meetingUrl, "_blank", "noopener,noreferrer")
    }
  }

  const startLabel = event.isAllDay
    ? null
    : format(parseISO(event.start), "HH:mm")

  return (
    <div
      role="button"
      tabIndex={event.meetingUrl ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      title={`${event.title}${event.location ? `\n${event.location}` : ""}${event.bodyPreview ? `\n${event.bodyPreview}` : ""}`}
      className={clsx(
        "absolute inset-x-0.5 rounded px-1 py-0.5 text-white text-xs border-l-2 overflow-hidden",
        "flex flex-col gap-0",
        colorClasses,
        event.meetingUrl && "cursor-pointer",
        event.isCancelled && "opacity-60"
      )}
      style={{ ...bgStyle, ...style }}
    >
      <div className="flex items-center gap-1 min-w-0">
        {event.isOnlineMeeting && (
          <Video className="shrink-0" size={10} />
        )}
        <span className="font-medium truncate leading-tight">{event.title}</span>
      </div>
      {startLabel && (
        <span className="text-white/80 text-[10px] leading-tight">{startLabel}</span>
      )}
    </div>
  )
}
