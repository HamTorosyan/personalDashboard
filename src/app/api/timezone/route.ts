import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const city = searchParams.get("city")
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")
  const reverse = searchParams.get("reverse") === "true"

  let latitude: number
  let longitude: number
  let timezone: string | undefined
  let name: string | undefined
  let country: string | undefined

  if (city) {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
      { next: { revalidate: 86400 } }
    )
    if (!geoRes.ok) return NextResponse.json({ error: "Geocoding failed" }, { status: 502 })
    const geoData = await geoRes.json()
    if (!geoData.results?.length) return NextResponse.json({ error: "City not found" }, { status: 404 })

    const r = geoData.results[0]
    latitude = r.latitude
    longitude = r.longitude
    timezone = r.timezone
    name = r.name
    country = r.country
  } else if (lat && lon) {
    latitude = parseFloat(lat)
    longitude = parseFloat(lon)

    if (reverse) {
      // Reverse geocode: coordinates → city name + country
      try {
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
          {
            headers: { "User-Agent": "PersonalDashboard/1.0" },
            next: { revalidate: 86400 },
          }
        )
        if (nomRes.ok) {
          const nomData = await nomRes.json()
          const addr = nomData.address ?? {}
          name = addr.city || addr.town || addr.village || addr.county || nomData.name
          country = addr.country
        }
      } catch {}
    }
  } else {
    return NextResponse.json({ error: "Provide city or lat+lon" }, { status: 400 })
  }

  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude!}&longitude=${longitude!}&current=temperature_2m,apparent_temperature,weather_code&timezone=auto`,
    { next: { revalidate: 1800 } }
  )
  if (!weatherRes.ok) return NextResponse.json({ error: "Weather fetch failed" }, { status: 502 })
  const weatherData = await weatherRes.json()

  // timezone from weather response (always available with timezone=auto)
  const resolvedTimezone = timezone ?? weatherData.timezone

  return NextResponse.json({
    ...(name ? { city: name, country, latitude, longitude } : {}),
    ...(resolvedTimezone ? { timezone: resolvedTimezone } : {}),
    weather: {
      temp: Math.round(weatherData.current.temperature_2m),
      feelsLike: Math.round(weatherData.current.apparent_temperature),
      weatherCode: weatherData.current.weather_code,
    },
  })
}
