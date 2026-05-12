"use client"

import { useState, useEffect } from "react"
import TwoWeekCalendar from "@/components/calendar/TwoWeekCalendar"
import CountrySelector, { STORAGE_KEY } from "@/components/CountrySelector"
import AuthButtons from "@/components/AuthButtons"
import { useCalendarEvents } from "@/hooks/useCalendarEvents"
import { RefreshCw } from "lucide-react"

export default function Dashboard() {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])

  // Load persisted country selection on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setSelectedCountries(JSON.parse(stored))
    } catch {}
  }, [])

  const { events, isLoading, error, refetch } = useCalendarEvents(selectedCountries)

  return (
    <main className="max-w-screen-2xl mx-auto px-4 py-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Personal Dashboard</h1>
        <div className="flex flex-wrap items-center gap-3">
          <CountrySelector
            selected={selectedCountries}
            onChange={setSelectedCountries}
          />
          <AuthButtons />
          <button
            onClick={refetch}
            title="Refresh"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 text-sm hover:bg-gray-100 transition-colors"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </header>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <Legend color="bg-blue-500" label="Outlook" />
        <Legend color="bg-purple-500" label="Teams" />
        <Legend color="bg-cyan-500" label="Zoom" />
        <Legend color="bg-green-600" label="Holiday" />
        <Legend color="bg-gray-400" label="Cancelled" />
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <TwoWeekCalendar events={events} isLoading={isLoading} />
    </main>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded-sm ${color}`} />
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}
