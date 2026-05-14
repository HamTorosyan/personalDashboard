import { CalendarEvent } from "@/lib/types"

interface NagerHoliday {
  date: string
  localName: string
  name: string
  countryCode: string
  fixed: boolean
  global: boolean
  counties: string[] | null
  launchYear: number | null
  types: string[]
}

export function normalizeHoliday(raw: NagerHoliday): CalendarEvent {
  return {
    id: `holiday-${raw.date}-${raw.countryCode}`,
    title: raw.name || raw.localName,
    source: "holiday",
    start: raw.date,
    end: raw.date,
    isAllDay: true,
    color: "green",
    countryCode: raw.countryCode,
  }
}

export async function fetchHolidays(
  countryCodes: string[],
  rangeStart: Date,
  rangeEnd: Date
): Promise<CalendarEvent[]> {
  const years = new Set([rangeStart.getFullYear(), rangeEnd.getFullYear()])

  const requests = Array.from(years).flatMap((year) =>
    countryCodes.map(async (code) => {
      const response = await fetch(
        `https://date.nager.at/api/v3/PublicHolidays/${year}/${code.toUpperCase()}`,
        { next: { revalidate: 86400 } }
      )
      if (!response.ok) return []
      const data: NagerHoliday[] = await response.json()
      return data.map(normalizeHoliday)
    })
  )

  const results = await Promise.allSettled(requests)
  return results
    .filter((r): r is PromiseFulfilledResult<CalendarEvent[]> => r.status === "fulfilled")
    .flatMap((r) => r.value)
}
