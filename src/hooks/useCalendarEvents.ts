"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { CalendarEvent } from "@/lib/types"

const POLL_INTERVAL_MS = 5 * 60 * 1000

export function useCalendarEvents(selectedCountries: string[]) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [holidays, setHolidays] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const countriesRef = useRef(selectedCountries)
  countriesRef.current = selectedCountries

  const fetchEvents = useCallback(async () => {
    try {
      const calRes = await fetch("/api/calendar")
      if (calRes.ok) {
        const data = await calRes.json()
        setEvents(data.events ?? [])
      }
    } catch (err) {
      setError("Failed to load calendar events")
    }
  }, [])

  const fetchHolidays = useCallback(async (countries: string[]) => {
    if (countries.length === 0) {
      setHolidays([])
      return
    }
    try {
      const res = await fetch(`/api/holidays?countries=${countries.join(",")}`)
      if (res.ok) {
        const data = await res.json()
        setHolidays(data.events ?? [])
      }
    } catch {
      // holidays are non-critical; silently ignore
    }
  }, [])

  // Initial load
  useEffect(() => {
    setIsLoading(true)
    Promise.all([fetchEvents(), fetchHolidays(selectedCountries)]).finally(() =>
      setIsLoading(false)
    )
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch holidays when country selection changes
  useEffect(() => {
    fetchHolidays(selectedCountries)
  }, [selectedCountries.join(",")]) // eslint-disable-line react-hooks/exhaustive-deps

  // Poll calendar events every 5 minutes
  useEffect(() => {
    const id = setInterval(fetchEvents, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [fetchEvents])

  return {
    events: [...events, ...holidays],
    isLoading,
    error,
    refetch: fetchEvents,
  }
}
