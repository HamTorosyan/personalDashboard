import { NextRequest, NextResponse } from "next/server"
import { fetchHolidays } from "@/lib/holidays"
import { getTwoWeekRange } from "@/lib/dateUtils"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const countriesParam = searchParams.get("countries") ?? ""
  const countries = countriesParam
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)

  if (countries.length === 0) {
    return NextResponse.json({ events: [] })
  }

  const { start, end } = getTwoWeekRange()

  try {
    const events = await fetchHolidays(countries, start, end)
    return NextResponse.json({ events })
  } catch (err) {
    console.error("Holidays API error:", err)
    return NextResponse.json({ events: [], error: "Failed to fetch holidays" })
  }
}
