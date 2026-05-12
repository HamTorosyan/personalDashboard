import {
  startOfWeek,
  addWeeks,
  addDays,
  addMinutes,
  format,
  parseISO,
  differenceInMinutes,
} from "date-fns"

/** Returns the Monday–Sunday range covering the current week and the next week. */
export function getTwoWeekRange(today: Date = new Date()) {
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const start = weekStart
  const end = addDays(addWeeks(weekStart, 2), -1)
  return { start, end }
}

/** Returns ISO string for the start of the current week (Monday). */
export function getCurrentWeekStart(today: Date = new Date()): Date {
  return startOfWeek(today, { weekStartsOn: 1 })
}

/** Returns ISO string for the start of next week (Monday). */
export function getNextWeekStart(today: Date = new Date()): Date {
  return addWeeks(startOfWeek(today, { weekStartsOn: 1 }), 1)
}

/**
 * Graph API calendarView expects local-time ISO without a Z suffix.
 * e.g. "2026-05-11T00:00:00"
 */
export function toGraphISOString(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss")
}

/** Returns ISO date string "yyyy-MM-dd" for a Date. */
export function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

/**
 * Calculates grid row start (1-indexed) for an event.
 * Grid starts at 08:00; each row = 30 minutes.
 * Row 1 is reserved for the day header, so row 2 = 08:00.
 */
export function getEventRowStart(isoStart: string): number {
  const start = parseISO(isoStart)
  const dayStart = new Date(start)
  dayStart.setHours(8, 0, 0, 0)
  const minutesSince8am = differenceInMinutes(start, dayStart)
  return Math.max(2, Math.floor(minutesSince8am / 30) + 2)
}

/**
 * Calculates how many grid rows (30-min slots) an event spans.
 * Minimum of 1 row.
 */
export function getEventRowSpan(isoStart: string, isoEnd: string): number {
  const start = parseISO(isoStart)
  const end = parseISO(isoEnd)
  const duration = differenceInMinutes(end, start)
  return Math.max(1, Math.ceil(duration / 30))
}

/** Formats a Date as "Mon 11" for day column headers. */
export function formatDayHeader(date: Date): { weekday: string; day: string } {
  return {
    weekday: format(date, "EEE"),
    day: format(date, "d"),
  }
}

/** Returns an array of 7 Date objects starting from weekStart (Monday). */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

/** Returns an array of time labels for the gutter: "08:00", "08:30", ..., "20:00". */
export function getTimeSlots(): string[] {
  const slots: string[] = []
  let current = new Date(0)
  current.setHours(8, 0, 0, 0)
  const end = new Date(0)
  end.setHours(20, 0, 0, 0)
  while (current <= end) {
    slots.push(format(current, "HH:mm"))
    current = addMinutes(current, 30)
  }
  return slots
}

/** Total number of 30-minute rows in the grid (08:00–20:00 inclusive = 25 slots). */
export const TIME_SLOT_COUNT = 25
