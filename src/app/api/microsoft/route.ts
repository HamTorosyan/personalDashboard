import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { fetchMicrosoftEvents } from "@/lib/microsoft"
import { getTwoWeekRange, toGraphISOString } from "@/lib/dateUtils"

export async function GET(request: NextRequest) {
  const session = await auth()
  const accounts = session?.microsoftAccounts

  if (!accounts || accounts.length === 0) {
    return NextResponse.json({ events: [] })
  }

  const { searchParams } = request.nextUrl
  const { start, end } = getTwoWeekRange()
  const startISO = searchParams.get("start") ?? toGraphISOString(start)
  const endISO = searchParams.get("end") ?? toGraphISOString(end)

  const results = await Promise.allSettled(
    accounts.map((acct) => fetchMicrosoftEvents(acct.accessToken, startISO, endISO))
  )

  const events = results
    .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchMicrosoftEvents>>> =>
      r.status === "fulfilled"
    )
    .flatMap((r) => r.value)

  // Deduplicate by id (shared calendars may appear in multiple accounts)
  const seen = new Set<string>()
  const unique = events.filter((e) => {
    if (seen.has(e.id)) return false
    seen.add(e.id)
    return true
  })

  return NextResponse.json({ events: unique })
}
