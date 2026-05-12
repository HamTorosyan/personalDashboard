import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { fetchMicrosoftEvents } from "@/lib/microsoft"
import { fetchZoomMeetings } from "@/lib/zoom"
import { getTwoWeekRange, toGraphISOString } from "@/lib/dateUtils"
import type { CalendarEvent, CalendarResponse } from "@/lib/types"

export async function GET() {
  const session = await auth()
  const { start, end } = getTwoWeekRange()

  const fetches: Promise<CalendarEvent[]>[] = []

  // Microsoft (one request per connected account)
  for (const acct of session?.microsoftAccounts ?? []) {
    fetches.push(
      fetchMicrosoftEvents(acct.accessToken, toGraphISOString(start), toGraphISOString(end))
    )
  }

  // Zoom
  if (session?.zoomAccessToken) {
    fetches.push(fetchZoomMeetings(session.zoomAccessToken, start, end))
  }

  const results = await Promise.allSettled(fetches)
  const allEvents = results
    .filter((r): r is PromiseFulfilledResult<CalendarEvent[]> => r.status === "fulfilled")
    .flatMap((r) => r.value)

  // Deduplicate
  const seen = new Set<string>()
  const events = allEvents.filter((e) => {
    if (seen.has(e.id)) return false
    seen.add(e.id)
    return true
  })

  const body: CalendarResponse = {
    events,
    rangeStart: start.toISOString(),
    rangeEnd: end.toISOString(),
    fetchedAt: new Date().toISOString(),
  }

  return NextResponse.json(body)
}
