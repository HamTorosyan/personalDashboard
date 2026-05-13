"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"

export interface SavedCity {
  id: string
  alias: string
  city: string
  country: string
  timezone: string
  latitude: number
  longitude: number
  isPinned?: boolean
}

export interface WeatherData {
  temp: number
  feelsLike: number
  weatherCode: number
}

export interface ResolvedCity {
  city: string
  country: string
  timezone: string
  latitude: number
  longitude: number
}

const PLACEHOLDER: SavedCity = {
  id: "current",
  alias: "Current location",
  city: "",
  country: "",
  timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC",
  latitude: 0,
  longitude: 0,
  isPinned: true,
}

export function useTimezones() {
  const [currentCity, setCurrentCity] = useState<SavedCity>(PLACEHOLDER)
  const [savedCities, setSavedCities] = useState<SavedCity[]>([])
  const [weather, setWeather] = useState<Record<string, WeatherData>>({})
  const [now, setNow] = useState(() => new Date())

  // Refs so async callbacks always see latest state
  const currentCityRef = useRef<SavedCity>(PLACEHOLDER)
  const savedCitiesRef = useRef<SavedCity[]>([])
  currentCityRef.current = currentCity
  savedCitiesRef.current = savedCities

  const cities = useMemo(
    () => [currentCity, ...savedCities],
    [currentCity, savedCities]
  )

  // Persist to server (fire-and-forget; optimistic UI)
  const saveToServer = useCallback((current: SavedCity, saved: SavedCity[]) => {
    fetch("/api/cities", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentCity: current.city ? current : null, savedCities: saved }),
    }).catch(() => {})
  }, [])

  // Load from server on mount
  useEffect(() => {
    fetch("/api/cities")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return
        if (data.currentCity) setCurrentCity(data.currentCity)
        if (data.savedCities?.length) setSavedCities(data.savedCities)
      })
      .catch(() => {})
  }, [])

  // Tick every 30 seconds
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  // Auto-detect current location via server-side IP geolocation (avoids Chrome CORS/tracking blocks)
  useEffect(() => {
    async function detectLocation() {
      try {
        const res = await fetch("/api/location")
        if (!res.ok) return
        const data = await res.json()
        if (!data.city || !data.timezone) return

        const detectedCity: SavedCity = {
          id: "current",
          alias: data.city,
          city: data.city,
          country: data.country || "",
          timezone: data.timezone,
          latitude: data.latitude,
          longitude: data.longitude,
          isPinned: true,
        }

        setCurrentCity((prev) => {
          const userHasEdited = prev.city !== "" && prev.alias !== prev.city
          const next = { ...detectedCity, alias: userHasEdited ? prev.alias : detectedCity.city }
          saveToServer(next, savedCitiesRef.current)
          return next
        })

        if (data.weather) {
          setWeather((prev) => ({ ...prev, current: data.weather }))
        }
      } catch {}
    }
    detectLocation()
  }, [saveToServer])

  const fetchWeather = useCallback(async (list: SavedCity[]) => {
    if (!list.length) return
    const results = await Promise.allSettled(
      list.map(async (c) => {
        if (!c.latitude && !c.longitude) return null
        const res = await fetch(`/api/timezone?lat=${c.latitude}&lon=${c.longitude}`)
        if (!res.ok) return null
        const data = await res.json()
        return { id: c.id, weather: data.weather as WeatherData }
      })
    )
    setWeather((prev) => {
      const next = { ...prev }
      for (const r of results) {
        if (r.status === "fulfilled" && r.value) next[r.value.id] = r.value.weather
      }
      return next
    })
  }, [])

  // Weather refresh: initial + every 30 min
  useEffect(() => {
    fetchWeather(cities)
    const id = setInterval(() => fetchWeather(cities), 30 * 60_000)
    return () => clearInterval(id)
  }, [cities, fetchWeather])

  async function addCity(query: string, alias: string, resolved?: ResolvedCity): Promise<string | null> {
    let cityInfo: ResolvedCity
    let weatherData: WeatherData | undefined

    if (resolved) {
      cityInfo = resolved
      const wRes = await fetch(`/api/timezone?lat=${resolved.latitude}&lon=${resolved.longitude}`)
      if (wRes.ok) weatherData = (await wRes.json()).weather
    } else {
      const res = await fetch(`/api/timezone?city=${encodeURIComponent(query)}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        return (data.error as string) ?? "Failed to add city"
      }
      const data = await res.json()
      cityInfo = { city: data.city, country: data.country, timezone: data.timezone, latitude: data.latitude, longitude: data.longitude }
      weatherData = data.weather
    }

    const newCity: SavedCity = {
      id: Date.now().toString(),
      alias: alias.trim() || cityInfo.city,
      ...cityInfo,
    }
    const next = [...savedCitiesRef.current, newCity]
    setSavedCities(next)
    saveToServer(currentCityRef.current, next)
    if (weatherData) setWeather((prev) => ({ ...prev, [newCity.id]: weatherData! }))
    return null
  }

  function removeCity(id: string) {
    const next = savedCitiesRef.current.filter((c) => c.id !== id)
    setSavedCities(next)
    saveToServer(currentCityRef.current, next)
    setWeather((prev) => {
      const n = { ...prev }
      delete n[id]
      return n
    })
  }

  function updateAlias(id: string, alias: string) {
    if (!alias.trim()) return
    if (id === "current") {
      setCurrentCity((prev) => {
        const next = { ...prev, alias: alias.trim() }
        saveToServer(next, savedCitiesRef.current)
        return next
      })
      return
    }
    setSavedCities((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, alias: alias.trim() } : c))
      saveToServer(currentCityRef.current, next)
      return next
    })
  }

  function reorderCities(fromId: string, toId: string) {
    if (fromId === toId || toId === "current") return
    setSavedCities((prev) => {
      const fromIdx = prev.findIndex((c) => c.id === fromId)
      const toIdx = prev.findIndex((c) => c.id === toId)
      if (fromIdx === -1 || toIdx === -1) return prev
      const next = [...prev]
      const [item] = next.splice(fromIdx, 1)
      next.splice(toIdx > fromIdx ? toIdx - 1 : toIdx, 0, item)
      saveToServer(currentCityRef.current, next)
      return next
    })
  }

  return { cities, weather, now, addCity, removeCity, updateAlias, reorderCities }
}
