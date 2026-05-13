"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { CalendarEvent } from "@/lib/types"
import type { IcsFeed } from "@/hooks/useIcsFeeds"

const POLL_INTERVAL_MS = 5 * 60 * 1000

export function useCalendarEvents(selectedCountries: string[], feeds: IcsFeed[]) {
  const [holidays, setHolidays] = useState<CalendarEvent[]>([])
  const [icsEvents, setIcsEvents] = useState<CalendarEvent[]>([])
  const [feedErrors, setFeedErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error] = useState<string | null>(null)

  const feedsRef = useRef(feeds)
  feedsRef.current = feeds

  const fetchHolidays = useCallback(async (countries: string[]) => {
    if (countries.length === 0) { setHolidays([]); return }
    try {
      const res = await fetch(`/api/holidays?countries=${countries.join(",")}`)
      if (res.ok) {
        const data = await res.json()
        setHolidays(data.events ?? [])
      }
    } catch {}
  }, [])

  const fetchIcs = useCallback(async (feedList: IcsFeed[]) => {
    if (!feedList.length) { setIcsEvents([]); return }
    try {
      const res = await fetch("/api/ics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeds: feedList }),
      })
      if (res.ok) {
        const data = await res.json()
        setIcsEvents(data.events ?? [])
        setFeedErrors(data.errors ?? {})
      }
    } catch {}
  }, [])

  // Initial load
  useEffect(() => {
    setIsLoading(true)
    Promise.all([
      fetchHolidays(selectedCountries),
      fetchIcs(feeds),
    ]).finally(() => setIsLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch holidays when country selection changes
  useEffect(() => {
    fetchHolidays(selectedCountries)
  }, [selectedCountries.join(",")]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch ICS when feeds change
  const feedsKey = feeds.map((f) => f.id).join(",")
  useEffect(() => {
    fetchIcs(feedsRef.current)
  }, [feedsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Poll ICS every 5 minutes
  useEffect(() => {
    const id = setInterval(() => fetchIcs(feedsRef.current), POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [fetchIcs])

  const refetch = useCallback(() => {
    fetchIcs(feedsRef.current)
    fetchHolidays(selectedCountries)
  }, [fetchIcs, fetchHolidays, selectedCountries]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    events: [...holidays, ...icsEvents],
    isLoading,
    error,
    feedErrors,
    refetch,
  }
}
