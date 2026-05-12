import { CalendarEvent } from "@/lib/types"
import { addMinutes, parseISO, formatISO } from "date-fns"

interface ZoomMeeting {
  uuid: string
  id: number
  topic: string
  start_time: string
  duration: number
  join_url: string
  type: number
}

interface ZoomMeetingListResponse {
  meetings: ZoomMeeting[]
  next_page_token?: string
}

export function normalizeZoomMeeting(raw: ZoomMeeting): CalendarEvent {
  const start = parseISO(raw.start_time)
  const end = addMinutes(start, raw.duration)

  return {
    id: `zoom-${raw.uuid}`,
    title: raw.topic ?? "Zoom Meeting",
    source: "zoom",
    start: formatISO(start),
    end: formatISO(end),
    isAllDay: false,
    color: "cyan",
    meetingUrl: raw.join_url,
    isOnlineMeeting: true,
  }
}

export async function fetchZoomMeetings(
  accessToken: string,
  rangeStart: Date,
  rangeEnd: Date
): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = []
  let nextPageToken = ""

  do {
    const params = new URLSearchParams({
      type: "upcoming",
      page_size: "100",
    })
    if (nextPageToken) params.set("next_page_token", nextPageToken)

    const response = await fetch(
      `https://api.zoom.us/v2/users/me/meetings?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Zoom API error ${response.status}: ${err}`)
    }

    const data: ZoomMeetingListResponse = await response.json()

    for (const meeting of data.meetings ?? []) {
      const start = parseISO(meeting.start_time)
      if (start >= rangeStart && start < rangeEnd) {
        events.push(normalizeZoomMeeting(meeting))
      }
    }

    nextPageToken = data.next_page_token ?? ""
  } while (nextPageToken)

  return events
}
