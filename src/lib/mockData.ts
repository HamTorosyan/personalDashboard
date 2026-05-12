import { CalendarEvent } from "@/lib/types"
import { getCurrentWeekStart, getNextWeekStart } from "@/lib/dateUtils"
import { addDays, addHours, format } from "date-fns"

function isoOffset(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ssxxx")
}

export function getMockEvents(): CalendarEvent[] {
  const thisMonday = getCurrentWeekStart()
  const nextMonday = getNextWeekStart()

  return [
    // This week — Monday standup (Teams)
    {
      id: "ms-mock-1",
      title: "Daily Standup",
      source: "microsoft",
      start: isoOffset(addHours(addDays(thisMonday, 0), 9)),
      end: isoOffset(addHours(addDays(thisMonday, 0), 9.5)),
      isAllDay: false,
      color: "purple",
      isOnlineMeeting: true,
      meetingUrl: "https://teams.microsoft.com/l/meetup-join/example",
    },
    // This week — Wednesday review (Outlook)
    {
      id: "ms-mock-2",
      title: "Sprint Review",
      source: "microsoft",
      start: isoOffset(addHours(addDays(thisMonday, 2), 14)),
      end: isoOffset(addHours(addDays(thisMonday, 2), 15)),
      isAllDay: false,
      color: "blue",
      bodyPreview: "Review completed sprint items with the team.",
    },
    // This week — Thursday Zoom call
    {
      id: "zoom-mock-1",
      title: "1:1 with Manager",
      source: "zoom",
      start: isoOffset(addHours(addDays(thisMonday, 3), 11)),
      end: isoOffset(addHours(addDays(thisMonday, 3), 11.5)),
      isAllDay: false,
      color: "cyan",
      isOnlineMeeting: true,
      meetingUrl: "https://zoom.us/j/example",
    },
    // This week — overlapping events Friday
    {
      id: "ms-mock-3",
      title: "Design Sync",
      source: "microsoft",
      start: isoOffset(addHours(addDays(thisMonday, 4), 10)),
      end: isoOffset(addHours(addDays(thisMonday, 4), 11)),
      isAllDay: false,
      color: "purple",
      isOnlineMeeting: true,
    },
    {
      id: "zoom-mock-2",
      title: "Client Demo",
      source: "zoom",
      start: isoOffset(addHours(addDays(thisMonday, 4), 10)),
      end: isoOffset(addHours(addDays(thisMonday, 4), 10.5)),
      isAllDay: false,
      color: "cyan",
      isOnlineMeeting: true,
    },
    // This week — holiday (Friday)
    {
      id: "holiday-mock-1",
      title: "Public Holiday",
      source: "holiday",
      start: format(addDays(thisMonday, 4), "yyyy-MM-dd"),
      end: format(addDays(thisMonday, 4), "yyyy-MM-dd"),
      isAllDay: true,
      color: "green",
      countryCode: "US",
    },
    // Next week — Tuesday all-hands (Teams)
    {
      id: "ms-mock-4",
      title: "All-Hands Meeting",
      source: "microsoft",
      start: isoOffset(addHours(addDays(nextMonday, 1), 13)),
      end: isoOffset(addHours(addDays(nextMonday, 1), 14)),
      isAllDay: false,
      color: "purple",
      isOnlineMeeting: true,
    },
    // Next week — cancelled meeting
    {
      id: "ms-mock-5",
      title: "Cancelled: Team Lunch",
      source: "microsoft",
      start: isoOffset(addHours(addDays(nextMonday, 2), 12)),
      end: isoOffset(addHours(addDays(nextMonday, 2), 13)),
      isAllDay: false,
      color: "gray",
      isCancelled: true,
    },
  ]
}
