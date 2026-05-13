export type EventSource = "holiday" | "ics"

export type EventColor = string

export interface CalendarEvent {
  id: string
  title: string
  source: EventSource
  start: string
  end: string
  isAllDay: boolean
  color: EventColor
  location?: string
  meetingUrl?: string
  isCancelled?: boolean
  isTentative?: boolean
  isOnlineMeeting?: boolean
  bodyPreview?: string
  /** Populated for holiday events */
  countryCode?: string
  /** Populated for ICS events — matches IcsFeed.id */
  feedId?: string
}

export interface CalendarResponse {
  events: CalendarEvent[]
  rangeStart: string
  rangeEnd: string
  fetchedAt: string
}
