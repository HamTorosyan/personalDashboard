import { CalendarEvent } from "@/lib/types"

interface GraphEventDateTime {
  dateTime: string
  timeZone: string
}

interface GraphOnlineMeeting {
  joinUrl: string
}

interface GraphEvent {
  id: string
  subject: string
  start: GraphEventDateTime
  end: GraphEventDateTime
  location?: { displayName: string }
  onlineMeeting?: GraphOnlineMeeting | null
  isCancelled?: boolean
  showAs?: string
  bodyPreview?: string
  isAllDay?: boolean
}

interface GraphResponse {
  value: GraphEvent[]
  "@odata.nextLink"?: string
}

export function normalizeMicrosoftEvent(raw: GraphEvent): CalendarEvent {
  const isCancelled = raw.isCancelled ?? false
  const isTeams = raw.onlineMeeting != null
  const isTentative = raw.showAs === "tentative"

  return {
    id: `ms-${raw.id}`,
    title: raw.subject ?? "(No title)",
    source: "microsoft",
    start: raw.start.dateTime.includes("+") || raw.start.dateTime.endsWith("Z")
      ? raw.start.dateTime
      : `${raw.start.dateTime}`,
    end: raw.end.dateTime.includes("+") || raw.end.dateTime.endsWith("Z")
      ? raw.end.dateTime
      : `${raw.end.dateTime}`,
    isAllDay: raw.isAllDay ?? false,
    color: isCancelled ? "gray" : isTeams ? "purple" : "blue",
    location: raw.location?.displayName,
    meetingUrl: raw.onlineMeeting?.joinUrl,
    isCancelled,
    isTentative,
    isOnlineMeeting: isTeams,
    bodyPreview: raw.bodyPreview,
  }
}

export async function fetchMicrosoftEvents(
  accessToken: string,
  startDateTime: string,
  endDateTime: string
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    startDateTime,
    endDateTime,
    $select: "id,subject,start,end,location,onlineMeeting,isCancelled,showAs,bodyPreview,isAllDay",
    $top: "100",
    $orderby: "start/dateTime",
  })

  const events: CalendarEvent[] = []
  let url: string | null =
    `https://graph.microsoft.com/v1.0/me/calendarView?${params.toString()}`

  while (url) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: 'outlook.timezone="UTC"',
      },
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Graph API error ${response.status}: ${err}`)
    }

    const data: GraphResponse = await response.json()
    events.push(...data.value.map(normalizeMicrosoftEvent))
    url = data["@odata.nextLink"] ?? null
  }

  return events
}
