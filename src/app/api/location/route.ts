import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  // Prefer a forwarded client IP (reverse proxy); fall back to auto-detect
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const isLoopback = !forwarded || forwarded === "127.0.0.1" || forwarded === "::1"

  // When loopback (localhost dev), omit the IP so ipapi.co uses the server's
  // outgoing public IP — which is the same machine as the browser, so it's correct.
  const url = isLoopback
    ? "https://ipapi.co/json/"
    : `https://ipapi.co/${forwarded}/json/`

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "PersonalDashboard/1.0" },
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      return NextResponse.json({ error: "Location detection failed" }, { status: 502 })
    }

    const data = await res.json()

    if (data.error) {
      return NextResponse.json({ error: data.reason ?? "Location detection failed" }, { status: 422 })
    }

    if (!data.city || !data.timezone) {
      return NextResponse.json({ error: "Incomplete location data" }, { status: 422 })
    }

    // Fetch weather for the detected coordinates
    const wRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${data.latitude}&longitude=${data.longitude}&current=temperature_2m,apparent_temperature,weather_code&timezone=auto`,
      { next: { revalidate: 1800 } }
    )
    const wData = wRes.ok ? await wRes.json() : null

    return NextResponse.json({
      city: data.city,
      country: data.country_name || data.country,
      timezone: data.timezone,
      latitude: data.latitude,
      longitude: data.longitude,
      weather: wData
        ? {
            temp: Math.round(wData.current.temperature_2m),
            feelsLike: Math.round(wData.current.apparent_temperature),
            weatherCode: wData.current.weather_code,
          }
        : null,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Location detection failed" },
      { status: 500 }
    )
  }
}
