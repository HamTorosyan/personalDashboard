import { NextRequest, NextResponse } from "next/server"
import ical, { VEvent } from "node-ical"
import { RRule, RRuleSet, rrulestr } from "rrule"
import { startOfMonth, endOfMonth, addMonths, subMonths, format } from "date-fns"
import type { CalendarEvent, EventColor } from "@/lib/types"

interface IcsFeedInput {
  id: string
  label: string
  url: string
  color: EventColor
}

// node-ical string fields are ParameterValue = string | { val: string; params: Record<string,string> }
function str(v: unknown): string {
  if (!v) return ""
  if (typeof v === "string") return v
  if (typeof v === "object" && "val" in (v as object)) return (v as { val: string }).val
  return String(v)
}

function extractTeamsUrl(text: string): string | undefined {
  const match = text.match(/https:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^\s<>"&]+/)
  return match?.[0]
}

function isTeamsEvent(event: VEvent): boolean {
  return (
    str(event.url).includes("teams.microsoft.com") ||
    str(event.location).includes("teams.microsoft.com") ||
    str(event.description).includes("teams.microsoft.com")
  )
}

// rrule works in "floating" time (no timezone). node-ical gives us Date objects
// already converted to local time. We need UTC-normalized dates for rrule.between().
function toRRuleDate(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()))
}

function expandRecurring(event: VEvent, rangeStart: Date, rangeEnd: Date): Array<{ start: Date; end: Date }> {
  const rruleRaw = event.rrule
  if (!rruleRaw) return []

  const baseStart = event.start
  const baseEnd = event.end ?? event.start
  if (!baseStart) return []

  const durationMs = baseEnd.getTime() - baseStart.getTime()

  try {
    // node-ical exposes the raw RRULE string on rrule.toString()
    const rruleStr: string = typeof rruleRaw === "string" ? rruleRaw : (rruleRaw as { toString(): string }).toString()

    // Build the full RRULE string with DTSTART so rrule.js can parse it
    const dtstart = toRRuleDate(baseStart)
    let rule: RRule | RRuleSet

    if (rruleStr.includes("RRULE:") || rruleStr.includes("EXDATE") || rruleStr.includes("RDATE")) {
      rule = rrulestr(rruleStr, { dtstart, forceset: false })
    } else {
      // Plain value like "FREQ=WEEKLY;..."
      rule = new RRule({ ...RRule.parseString(rruleStr), dtstart })
    }

    const rsStart = toRRuleDate(rangeStart)
    const rsEnd = toRRuleDate(rangeEnd)

    const occurrences = rule.between(rsStart, rsEnd, true)

    return occurrences.map((occ) => {
      // occ is in floating UTC from rrule — convert back to a real Date
      const start = new Date(
        Date.UTC(occ.getUTCFullYear(), occ.getUTCMonth(), occ.getUTCDate(),
          occ.getUTCHours(), occ.getUTCMinutes(), occ.getUTCSeconds())
      )
      const end = new Date(start.getTime() + durationMs)
      return { start, end }
    })
  } catch {
    return []
  }
}

export async function POST(req: NextRequest) {
  const { feeds } = (await req.json()) as { feeds: IcsFeedInput[] }
  const now = new Date()
  const rangeStart = startOfMonth(subMonths(now, 12))
  const rangeEnd = endOfMonth(addMonths(now, 12))

  const allEvents: CalendarEvent[] = []
  const errors: Record<string, string> = {}

  await Promise.allSettled(
    feeds.map(async (feed) => {
      try {
        let res: Response
        try {
          res = await fetch(feed.url, {
            headers: { "User-Agent": "PersonalDashboard/1.0" },
            signal: AbortSignal.timeout(15_000),
          })
        } catch (err) {
          errors[feed.id] = err instanceof Error ? `Network error: ${err.message}` : "Network error"
          return
        }

        if (!res.ok) {
          errors[feed.id] = `Server returned HTTP ${res.status}`
          return
        }

        const text = await res.text()

        if (!text.trimStart().startsWith("BEGIN:VCALENDAR")) {
          errors[feed.id] = text.toLowerCase().includes("<html")
            ? "Google Calendar public URLs only work if you've enabled public sharing. Use the Secret address instead: Google Calendar → Settings → [Calendar] → Integrate calendar → Secret address in iCal format"
            : "URL did not return a valid ICS file — make sure you copied the ICS link, not the HTML link"
          return
        }

        let parsed: ReturnType<typeof ical.sync.parseICS>
        try {
          parsed = ical.sync.parseICS(text)
        } catch (err) {
          errors[feed.id] = `Failed to parse calendar: ${err instanceof Error ? err.message : "unknown error"}`
          return
        }

        let count = 0
        for (const [, component] of Object.entries(parsed)) {
          if (!component || component.type !== "VEVENT") continue
          const event = component as VEvent

          const baseStart = event.start
          const baseEnd = event.end ?? event.start
          if (!baseStart) continue

          const isAllDay = event.datetype === "date"
          const isCancelled = str(event.status) === "CANCELLED"
          const isTeams = isTeamsEvent(event)
          const urlStr = str(event.url)
          const descStr = str(event.description)
          const title = str(event.summary) || "(No title)"
          const location = str(event.location) || undefined
          const meetingUrl = isTeams
            ? (urlStr.includes("teams.microsoft.com") ? urlStr : undefined) ?? extractTeamsUrl(descStr)
            : urlStr || undefined
          const color = isCancelled ? "gray" : isTeams ? "purple" : feed.color

          const baseProps = {
            title,
            source: "ics" as const,
            feedId: feed.id,
            isAllDay,
            color,
            location,
            meetingUrl: meetingUrl || undefined,
            isCancelled,
            isTentative: str(event.status) === "TENTATIVE",
            isOnlineMeeting: isTeams,
            bodyPreview: descStr.slice(0, 300) || undefined,
          }

          // Recurring event — expand occurrences within range
          if (event.rrule) {
            const occurrences = expandRecurring(event, rangeStart, rangeEnd)
            for (const { start, end } of occurrences) {
              // All-day recurring dates come from Date.UTC() inside expandRecurring,
              // so use UTC getters to recover the intended calendar date.
              const startStr = isAllDay
                ? `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}-${String(start.getUTCDate()).padStart(2, "0")}`
                : start.toISOString()
              const endStr = isAllDay
                ? `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, "0")}-${String(end.getUTCDate()).padStart(2, "0")}`
                : end.toISOString()
              allEvents.push({
                ...baseProps,
                id: `ics-${feed.id}-${event.uid}-${start.getTime()}`,
                start: startStr,
                end: endStr,
              })
              count++
            }
            continue
          }

          // Non-recurring: simple range filter
          if (baseEnd < rangeStart || baseStart > rangeEnd) continue

          allEvents.push({
            ...baseProps,
            id: `ics-${feed.id}-${event.uid}`,
            // All-day dates from node-ical are local-time Date objects — format in local time
            // to avoid the UTC-midnight off-by-one-day bug in Western timezones.
            start: isAllDay ? format(baseStart, "yyyy-MM-dd") : baseStart.toISOString(),
            end: isAllDay ? format(baseEnd, "yyyy-MM-dd") : baseEnd.toISOString(),
          })
          count++
        }

        if (count === 0 && Object.keys(parsed).length > 0) {
          errors[feed.id] = `Calendar loaded but no events found in the current date range (${rangeStart.toDateString()} – ${rangeEnd.toDateString()})`
        }
      } catch (err) {
        errors[feed.id] = err instanceof Error ? err.message : "Unexpected error"
      }
    })
  )

  const seen = new Set<string>()
  const events = allEvents.filter((e) => {
    if (seen.has(e.id)) return false
    seen.add(e.id)
    return true
  })

  return NextResponse.json({ events, errors })
}
