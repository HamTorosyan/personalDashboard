import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { fetchZoomMeetings } from "@/lib/zoom"
import { getTwoWeekRange } from "@/lib/dateUtils"

export async function GET() {
  const session = await auth()
  const zoomToken = session?.zoomAccessToken

  if (!zoomToken) {
    return NextResponse.json({ events: [] })
  }

  const { start, end } = getTwoWeekRange()

  try {
    const events = await fetchZoomMeetings(zoomToken, start, end)
    return NextResponse.json({ events })
  } catch (err) {
    console.error("Zoom API error:", err)
    return NextResponse.json({ events: [], error: "Failed to fetch Zoom meetings" })
  }
}
