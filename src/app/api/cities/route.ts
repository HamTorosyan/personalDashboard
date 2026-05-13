import { NextRequest, NextResponse } from "next/server"
import { readJson, writeJson } from "@/lib/serverStorage"
import type { SavedCity } from "@/hooks/useTimezones"

interface CitiesData {
  currentCity: SavedCity | null
  savedCities: SavedCity[]
}

const DEFAULT: CitiesData = { currentCity: null, savedCities: [] }

export async function GET() {
  const data = await readJson<CitiesData>("timezones.json", DEFAULT)
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const body = (await req.json()) as CitiesData
  await writeJson("timezones.json", body)
  return NextResponse.json({ ok: true })
}
