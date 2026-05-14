import { readJson, writeJson } from "@/lib/serverStorage"
import { NextRequest, NextResponse } from "next/server"

type Settings = {
  icsFeeds?: unknown[]
  selectedCountries?: string[]
  hiddenCountries?: string[]
  countryColors?: Record<string, string>
  theme?: string | null
}

export async function GET() {
  const settings = await readJson<Settings>("settings.json", {})
  return NextResponse.json(settings)
}

export async function POST(req: NextRequest) {
  const patch = (await req.json()) as Partial<Settings>
  const current = await readJson<Settings>("settings.json", {})
  const updated = { ...current, ...patch }
  await writeJson("settings.json", updated)
  return NextResponse.json(updated)
}
