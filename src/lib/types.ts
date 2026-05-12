export type EventSource = "microsoft" | "zoom" | "holiday"

export type EventColor = "blue" | "purple" | "cyan" | "green" | "gray"

export interface CalendarEvent {
  /** Prefixed: "ms-<id>", "zoom-<uuid>", "holiday-<date>-<countryCode>" */
  id: string
  title: string
  source: EventSource
  /** ISO 8601 with timezone offset e.g. "2026-05-11T09:00:00+04:00" */
  start: string
  end: string
  isAllDay: boolean
  /** blue=Outlook, purple=Teams, cyan=Zoom, green=Holiday, gray=cancelled */
  color: EventColor
  location?: string
  meetingUrl?: string
  isCancelled?: boolean
  isTentative?: boolean
  isOnlineMeeting?: boolean
  bodyPreview?: string
  /** Populated for holiday events */
  countryCode?: string
}

export interface CalendarResponse {
  events: CalendarEvent[]
  rangeStart: string
  rangeEnd: string
  fetchedAt: string
}

export interface MicrosoftAccountToken {
  oid: string
  accessToken: string
  refreshToken: string
  expiresAt: number
}
