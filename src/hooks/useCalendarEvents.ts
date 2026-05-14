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
  const [isRefreshing, setIsRefreshing] = useState(false)
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
    if (!feedList.length) { setIcsEvents([]); setFeedErrors({}); return }
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

  // On mount: fetch settings directly for ICS feeds — don't depend on feeds prop
  // arriving asynchronously, which breaks on first load.
  useEffect(() => {
    setIsLoading(true)
    const init = async () => {
      const settings = await fetch("/api/settings")
        .then((r) => (r.ok ? r.json() : {}))
        .catch(() => ({}))
      const directFeeds: IcsFeed[] = settings.icsFeeds ?? []
      await Promise.all([
        fetchHolidays(selectedCountries),
        fetchIcs(directFeeds),
      ])
    }
    init().finally(() => setIsLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch holidays when country selection changes
  useEffect(() => {
    fetchHolidays(selectedCountries)
  }, [selectedCountries.join(",")]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch ICS when feeds are added/removed/edited via the UI
  const feedsKey = feeds.map((f) => `${f.id}:${f.url}`).join(",")
  useEffect(() => {
    if (!feedsKey) return // skip the initial empty mount
    fetchIcs(feeds)
  }, [feedsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Poll every 5 minutes
  useEffect(() => {
    const id = setInterval(() => {
      if (feedsRef.current.length > 0) fetchIcs(feedsRef.current)
    }, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [fetchIcs])

  const refetch = useCallback(async () => {
    setIsRefreshing(true)
    await Promise.all([
      fetchIcs(feedsRef.current),
      fetchHolidays(selectedCountries),
    ])
    setIsRefreshing(false)
  }, [fetchIcs, fetchHolidays, selectedCountries]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    events: [...holidays, ...icsEvents],
    isLoading,
    isRefreshing,
    error,
    feedErrors,
    refetch,
  }
}
