"use client"

import { useState, useEffect, useRef, useMemo, KeyboardEvent, DragEvent } from "react"
import { Clock, Plus, X, Loader2, Pencil, Check, GripVertical, MapPin, RotateCcw } from "lucide-react"
import { clsx } from "clsx"
import { useTimezones, SavedCity, WeatherData, ResolvedCity } from "@/hooks/useTimezones"

// ─── helpers ─────────────────────────────────────────────────────────────────

function weatherInfo(code: number): { icon: string; label: string } {
  if (code === 0) return { icon: "☀️", label: "Clear" }
  if (code <= 2) return { icon: "🌤️", label: "Partly cloudy" }
  if (code === 3) return { icon: "☁️", label: "Overcast" }
  if (code <= 48) return { icon: "🌫️", label: "Foggy" }
  if (code <= 57) return { icon: "🌦️", label: "Drizzle" }
  if (code <= 67) return { icon: "🌧️", label: "Rain" }
  if (code <= 77) return { icon: "🌨️", label: "Snow" }
  if (code <= 82) return { icon: "🌦️", label: "Showers" }
  if (code <= 86) return { icon: "🌨️", label: "Snow showers" }
  return { icon: "⛈️", label: "Thunderstorm" }
}

function formatCityTime(timezone: string, date: Date) {
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)

  const dayDate = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date)

  const hour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    }).format(date),
    10
  )

  return { time, dayDate, hour }
}

function getOffsetLabel(timezone: string): string {
  const now = new Date()
  const localOffset = -now.getTimezoneOffset()
  const utc = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }))
  const tz = new Date(now.toLocaleString("en-US", { timeZone: timezone }))
  const cityOffset = Math.round((tz.getTime() - utc.getTime()) / 60_000)
  const diff = cityOffset - localOffset
  if (diff === 0) return "Your time"
  const sign = diff > 0 ? "+" : ""
  const h = Math.trunc(diff / 60)
  const m = Math.abs(diff % 60)
  return m === 0 ? `${sign}${h}h` : `${sign}${h}h ${m}m`
}

function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24
  const m = totalMinutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function getCurrentTimeMinutes(now: Date): number {
  return Math.round((now.getHours() * 60 + now.getMinutes()) / 15) * 15
}

// ─── time-of-day theming ─────────────────────────────────────────────────────

type TimePeriod = "night" | "morning" | "day" | "evening"

function getTimePeriod(hour: number): TimePeriod {
  if (hour >= 6 && hour < 12) return "morning"
  if (hour >= 12 && hour < 18) return "day"
  if (hour >= 18 && hour < 22) return "evening"
  return "night"
}

const PERIOD = {
  night: {
    card:        "bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700",
    dark:        true,
    alias:       "text-sky-400",
    editBorder:  "border-sky-500 text-sky-400",
    subText:     "text-slate-400",
    timeText:    "text-white",
    weatherText: "text-slate-200",
    feelsLike:   "text-slate-500",
    removeBtn:   "text-slate-300 hover:bg-slate-700",
    grip:        "text-slate-400",
    pin:         "text-sky-400",
    badge:       "bg-slate-700 text-slate-300",
    badgeNow:    "bg-green-900 text-green-300",
  },
  morning: {
    card:        "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200",
    dark:        false,
    alias:       "text-amber-700",
    editBorder:  "border-amber-400 text-amber-700",
    subText:     "text-amber-600/70",
    timeText:    "text-gray-900",
    weatherText: "text-gray-700",
    feelsLike:   "text-amber-400",
    removeBtn:   "text-gray-500 hover:bg-amber-100",
    grip:        "text-amber-300",
    pin:         "text-amber-500",
    badge:       "bg-amber-100 text-amber-700",
    badgeNow:    "bg-green-100 text-green-700",
  },
  day: {
    card:        "bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200",
    dark:        false,
    alias:       "text-sky-700",
    editBorder:  "border-sky-400 text-sky-700",
    subText:     "text-gray-500",
    timeText:    "text-gray-900",
    weatherText: "text-gray-700",
    feelsLike:   "text-gray-400",
    removeBtn:   "text-gray-600 hover:bg-gray-200",
    grip:        "text-gray-400",
    pin:         "text-sky-500",
    badge:       "bg-sky-100 text-sky-700",
    badgeNow:    "bg-green-100 text-green-700",
  },
  evening: {
    card:        "bg-gradient-to-br from-blue-800 to-indigo-950 border-blue-700",
    dark:        true,
    alias:       "text-blue-300",
    editBorder:  "border-blue-400 text-blue-300",
    subText:     "text-blue-300/60",
    timeText:    "text-white",
    weatherText: "text-blue-100",
    feelsLike:   "text-blue-400",
    removeBtn:   "text-blue-200 hover:bg-blue-700",
    grip:        "text-blue-400",
    pin:         "text-blue-300",
    badge:       "bg-blue-700 text-blue-200",
    badgeNow:    "bg-green-900 text-green-300",
  },
} satisfies Record<TimePeriod, object>

// ─── CityCard ────────────────────────────────────────────────────────────────

interface CityCardProps {
  city: SavedCity
  weather: WeatherData | undefined
  displayTime: Date
  onRemove: () => void
  onUpdateAlias: (alias: string) => void
  draggable: boolean
  isDragOver: boolean
  onDragStart: (e: DragEvent) => void
  onDragOver: (e: DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: DragEvent) => void
}

function CityCard({
  city,
  weather,
  displayTime,
  onRemove,
  onUpdateAlias,
  draggable,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: CityCardProps) {
  const { time, dayDate, hour } = formatCityTime(city.timezone, displayTime)
  const s = PERIOD[getTimePeriod(hour)]
  const offsetLabel = getOffsetLabel(city.timezone)
  const wInfo = weather ? weatherInfo(weather.weatherCode) : null

  const [editingAlias, setEditingAlias] = useState(false)
  const [aliasInput, setAliasInput] = useState(city.alias)
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setAliasInput(city.alias)
    setEditingAlias(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function commitEdit() {
    if (aliasInput.trim()) onUpdateAlias(aliasInput.trim())
    setEditingAlias(false)
  }

  function onAliasKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") commitEdit()
    if (e.key === "Escape") { setAliasInput(city.alias); setEditingAlias(false) }
  }

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={clsx(
        "relative rounded-xl p-4 border select-none transition-all min-h-[150px]",
        s.card,
        isDragOver && "ring-2 ring-sky-400 ring-offset-1",
        draggable && "cursor-grab active:cursor-grabbing"
      )}
    >
      {/* Drag handle (non-pinned only) */}
      {draggable && (
        <div
          className={clsx(
            "absolute top-2 left-2 opacity-30 hover:opacity-70 transition-opacity",
            s.grip
          )}
        >
          <GripVertical size={13} />
        </div>
      )}

      {/* Pin indicator (current location) */}
      {city.isPinned && (
        <div
          className={clsx("absolute top-2 left-2", s.pin)}
          title="Current location"
        >
          <MapPin size={11} />
        </div>
      )}

      {/* Remove button (non-pinned only) */}
      {!city.isPinned && (
        <button
          onClick={onRemove}
          className={clsx(
            "absolute top-2 right-2 p-0.5 rounded-full opacity-40 hover:opacity-100 transition-opacity",
            s.removeBtn
          )}
          title="Remove"
        >
          <X size={12} />
        </button>
      )}

      {/* Alias — editable */}
      <div className={clsx("text-xs font-semibold uppercase tracking-wide mb-0.5 pr-5 pl-4 flex items-center gap-1 group", s.alias)}>
        {editingAlias ? (
          <div className="flex items-center gap-1 w-full">
            <input
              ref={inputRef}
              value={aliasInput}
              onChange={(e) => setAliasInput(e.target.value)}
              onKeyDown={onAliasKey}
              onBlur={commitEdit}
              className={clsx(
                "flex-1 min-w-0 bg-transparent border-b outline-none text-xs font-semibold uppercase tracking-wide",
                s.editBorder
              )}
            />
            <button onClick={commitEdit} className="shrink-0">
              <Check size={11} />
            </button>
          </div>
        ) : (
          <>
            <span className="truncate">{city.alias}</span>
            <button
              onClick={startEdit}
              className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity shrink-0"
              title="Edit alias"
            >
              <Pencil size={10} />
            </button>
          </>
        )}
      </div>

      {/* City, country */}
      {city.city && (
        <div className={clsx("text-xs mb-3 pl-4", s.subText)}>
          {city.city}{city.country ? `, ${city.country}` : ""}
        </div>
      )}
      {!city.city && (
        <div className="text-xs mb-3 pl-4 text-gray-400 italic">Detecting location…</div>
      )}

      {/* Time */}
      <div className={clsx("text-3xl font-bold tabular-nums leading-none mb-0.5", s.timeText)}>
        {time}
      </div>

      {/* Day + date */}
      <div className={clsx("text-xs mb-3", s.subText)}>
        {dayDate}
      </div>

      {/* Weather + offset */}
      <div className="flex items-center justify-between gap-1">
        <span className={clsx("text-sm", s.weatherText)}>
          {wInfo ? (
            <>{wInfo.icon} {weather!.temp}°C</>
          ) : (
            <span className="text-gray-400 text-xs">Loading…</span>
          )}
        </span>
        <span
          className={clsx(
            "text-[11px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap",
            offsetLabel === "Your time" ? s.badgeNow : s.badge
          )}
        >
          {offsetLabel}
        </span>
      </div>

      {weather && (
        <div className={clsx("text-[10px] mt-1", s.feelsLike)}>
          Feels like {weather.feelsLike}°C · {wInfo?.label}
        </div>
      )}
    </div>
  )
}

// ─── CityAutocomplete ─────────────────────────────────────────────────────────

interface GeoSuggestion extends ResolvedCity {
  admin1?: string
}

interface CityAutocompleteProps {
  value: string
  onChange: (v: string) => void
  onSelect: (s: GeoSuggestion) => void
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
}

function CityAutocomplete({ value, onChange, onSelect, onKeyDown }: CityAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value.length < 3) { setSuggestions([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(value)}&count=7&language=en&format=json`
        )
        const data = await res.json()
        // Open-Meteo returns `name` — map to `city` to match ResolvedCity
        const mapped: GeoSuggestion[] = (data.results ?? []).map((r: Record<string, unknown>) => ({
          city: r.name,
          country: r.country,
          timezone: r.timezone,
          latitude: r.latitude,
          longitude: r.longitude,
          admin1: r.admin1,
        }))
        setSuggestions(mapped)
        setActiveIdx(-1)
      } catch {
        setSuggestions([])
      } finally {
        setSearching(false)
      }
    }, 280)
    return () => clearTimeout(timer)
  }, [value])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setSuggestions([])
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1)); return }
      if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); return }
      if (e.key === "Enter" && activeIdx >= 0) {
        e.preventDefault()
        onSelect(suggestions[activeIdx])
        setSuggestions([])
        return
      }
      if (e.key === "Escape") { setSuggestions([]); setActiveIdx(-1) }
    }
    onKeyDown(e)
  }

  const open = suggestions.length > 0 || searching

  return (
    <div ref={containerRef} className="relative">
      <input
        autoFocus
        placeholder="City name (e.g. Tokyo)"
        value={value}
        onChange={(e) => { onChange(e.target.value); setActiveIdx(-1) }}
        onKeyDown={handleKey}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400 w-56"
      />
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-72 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {searching && !suggestions.length && (
            <div className="px-3 py-2 text-xs text-gray-400 flex items-center gap-1.5">
              <Loader2 size={11} className="animate-spin" /> Searching…
            </div>
          )}
          {suggestions.map((s, i) => (
            <button
              key={`${s.city}-${s.latitude}`}
              onMouseDown={(e) => { e.preventDefault(); onSelect(s); setSuggestions([]) }}
              className={clsx(
                "w-full text-left px-3 py-2 text-sm transition-colors border-b border-gray-50 last:border-0",
                activeIdx === i ? "bg-sky-50" : "hover:bg-gray-50"
              )}
            >
              <span className="font-medium text-gray-800">{s.city}</span>
              {s.admin1 && s.admin1 !== s.city && (
                <span className="text-gray-400 text-xs ml-1">{s.admin1},</span>
              )}
              <span className="text-gray-400 text-xs ml-1">{s.country}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── AddCityForm ─────────────────────────────────────────────────────────────

interface AddCityFormProps {
  onAdd: (query: string, alias: string, resolved?: ResolvedCity) => Promise<string | null>
  onCancel: () => void
}

function AddCityForm({ onAdd, onCancel }: AddCityFormProps) {
  const [query, setQuery] = useState("")
  const [alias, setAlias] = useState("")
  const [resolved, setResolved] = useState<GeoSuggestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function handleSelect(s: GeoSuggestion) {
    setQuery(s.city)
    setResolved(s)
    if (!alias) setAlias(s.city)
  }

  function handleQueryChange(v: string) {
    setQuery(v)
    setResolved(null) // clear resolved if user edits manually
  }

  async function submit() {
    if (!query.trim()) return
    setLoading(true)
    setError("")
    const err = await onAdd(query.trim(), alias.trim(), resolved ?? undefined)
    setLoading(false)
    if (err) setError(err)
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") submit()
    if (e.key === "Escape") onCancel()
  }

  return (
    <div className="mb-4 flex flex-wrap items-start gap-2">
      <CityAutocomplete value={query} onChange={handleQueryChange} onSelect={handleSelect} onKeyDown={onKey} />
      <input
        placeholder="Alias (e.g. Office)"
        value={alias}
        onChange={(e) => setAlias(e.target.value)}
        onKeyDown={onKey}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400 w-36"
      />
      <button
        onClick={submit}
        disabled={loading || !query.trim()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sky-600 text-white text-sm hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        Add
      </button>
      <button
        onClick={onCancel}
        className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 text-sm hover:bg-gray-100 transition-colors"
      >
        Cancel
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </div>
  )
}

// ─── TimeSlider ───────────────────────────────────────────────────────────────

interface TimeSliderProps {
  timeMinutes: number
  isNow: boolean
  onChange: (v: number) => void
  onReset: () => void
}

function TimeSlider({ timeMinutes, isNow, onChange, onReset }: TimeSliderProps) {
  return (
    <div className="flex items-center gap-3 mb-4 px-1">
      <span className="text-xs text-gray-500 shrink-0">00:00</span>
      <input
        type="range"
        min={0}
        max={1425}
        step={15}
        value={timeMinutes}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 accent-sky-500 cursor-pointer"
      />
      <span className="text-xs text-gray-500 shrink-0">23:45</span>
      <span
        className={clsx(
          "text-xs font-semibold tabular-nums min-w-[3rem] text-center px-2 py-0.5 rounded-full",
          isNow ? "bg-gray-100 text-gray-500" : "bg-sky-100 text-sky-700"
        )}
      >
        {formatMinutes(timeMinutes)}
      </span>
      {!isNow && (
        <button
          onClick={onReset}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Reset to now"
        >
          <RotateCcw size={13} />
        </button>
      )}
    </div>
  )
}

// ─── TimezoneConverter ───────────────────────────────────────────────────────

export default function TimezoneConverter() {
  const { cities, weather, now, addCity, removeCity, updateAlias, reorderCities } = useTimezones()
  const [showForm, setShowForm] = useState(false)
  const [timeMinutes, setTimeMinutes] = useState(() => getCurrentTimeMinutes(new Date()))
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const currentTimeMinutes = getCurrentTimeMinutes(now)
  const isNow = timeMinutes === currentTimeMinutes

  // Use real now when slider is at current time, snapped time only when user moved it
  const displayTime = useMemo(() => {
    if (isNow) return now
    const d = new Date()
    d.setHours(Math.floor(timeMinutes / 60), timeMinutes % 60, 0, 0)
    return d
  }, [isNow, timeMinutes, now])

  async function handleAdd(query: string, alias: string, resolved?: ResolvedCity) {
    const err = await addCity(query, alias, resolved)
    if (!err) setShowForm(false)
    return err
  }

  function handleDragStart(e: DragEvent, id: string) {
    setDragId(id)
    e.dataTransfer.effectAllowed = "move"
  }

  function handleDragOver(e: DragEvent, id: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverId(id)
  }

  function handleDrop(e: DragEvent, targetId: string) {
    e.preventDefault()
    if (dragId && dragId !== targetId) {
      reorderCities(dragId, targetId)
    }
    setDragId(null)
    setDragOverId(null)
  }

  function handleDragEnd() {
    setDragId(null)
    setDragOverId(null)
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Clock size={18} className="text-gray-500" />
          Time Zones
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 text-sm hover:bg-gray-100 transition-colors"
          >
            <Plus size={14} />
            Add city
          </button>
        )}
      </div>

      {showForm && <AddCityForm onAdd={handleAdd} onCancel={() => setShowForm(false)} />}

      {cities.length === 0 && !showForm ? (
        <p className="text-gray-400 text-sm">
          No cities added yet.{" "}
          <button onClick={() => setShowForm(true)} className="text-sky-600 hover:underline">
            Add one
          </button>{" "}
          to see the local time and weather.
        </p>
      ) : (
        <>
          {cities.length > 0 && (
            <TimeSlider
              timeMinutes={timeMinutes}
              isNow={isNow}
              onChange={setTimeMinutes}
              onReset={() => setTimeMinutes(currentTimeMinutes)}
            />
          )}
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(225px, 1fr))" }}
            onDragEnd={handleDragEnd}
          >
            {cities.map((city) => (
              <CityCard
                key={city.id}
                city={city}
                weather={weather[city.id]}
                displayTime={displayTime}
                onRemove={() => removeCity(city.id)}
                onUpdateAlias={(alias) => updateAlias(city.id, alias)}
                draggable={!city.isPinned}
                isDragOver={dragOverId === city.id}
                onDragStart={(e) => handleDragStart(e, city.id)}
                onDragOver={(e) => handleDragOver(e, city.id)}
                onDragLeave={() => setDragOverId(null)}
                onDrop={(e) => handleDrop(e, city.id)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
