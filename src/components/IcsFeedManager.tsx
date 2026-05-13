"use client"

import { useState, KeyboardEvent } from "react"
import { CalendarDays, Plus, X, AlertTriangle } from "lucide-react"
import { clsx } from "clsx"
import { FEED_COLORS, type IcsFeed } from "@/hooks/useIcsFeeds"
import type { EventColor } from "@/lib/types"
import { ColorPicker } from "@/components/ColorPicker"

interface IcsFeedManagerProps {
  feeds: IcsFeed[]
  feedErrors: Record<string, string>
  onAdd: (label: string, url: string, color: EventColor) => string | null
  onRemove: (id: string) => void
  onUpdateColor: (id: string, color: EventColor) => void
  onToggleVisibility: (id: string) => void
}

// ─── FeedChip ────────────────────────────────────────────────────────────────

function FeedChip({
  feed,
  error,
  onRemove,
  onUpdateColor,
  onToggleVisibility,
}: {
  feed: IcsFeed
  error?: string
  onRemove: () => void
  onUpdateColor: (c: EventColor) => void
  onToggleVisibility: () => void
}) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <label
      className={clsx(
        "relative flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium bg-white cursor-pointer select-none transition-opacity",
        error ? "border-amber-300 bg-amber-50" : "border-gray-200",
        !feed.visible && "opacity-45"
      )}
    >
      <input
        type="checkbox"
        checked={feed.visible}
        onChange={onToggleVisibility}
        className="w-3 h-3 rounded accent-blue-500 cursor-pointer shrink-0"
      />
      <button
        onClick={(e) => { e.preventDefault(); setShowPicker((v) => !v) }}
        title="Change color"
        style={{ backgroundColor: feed.color }}
        className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-transparent hover:ring-gray-400 transition-all border border-black/10"
      />
      {showPicker && (
        <ColorPicker
          current={feed.color}
          onChange={onUpdateColor}
          onClose={() => setShowPicker(false)}
        />
      )}
      {feed.label}
      {error && (
        <span title={error} className="text-amber-500 cursor-help">
          <AlertTriangle size={11} />
        </span>
      )}
      <button
        onClick={(e) => { e.preventDefault(); onRemove() }}
        className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors"
        title="Remove feed"
      >
        <X size={11} />
      </button>
    </label>
  )
}

// ─── AddFeedForm ─────────────────────────────────────────────────────────────

function AddFeedForm({
  feeds,
  onAdd,
  onCancel,
}: {
  feeds: IcsFeed[]
  onAdd: (label: string, url: string, color: EventColor) => string | null
  onCancel: () => void
}) {
  const usedColors = feeds.map((f) => f.color)
  // Prefer accent colors for new feeds; fall back to Excel Accent 1 blue
  const ACCENT_DEFAULTS = ["#4472C4","#ED7D31","#70AD47","#5B9BD5","#FFC000","#C00000","#7030A0","#00B050"]
  const defaultColor = ACCENT_DEFAULTS.find((c) => !usedColors.includes(c)) ?? "#4472C4"

  const [label, setLabel] = useState("")
  const [url, setUrl] = useState("")
  const [color, setColor] = useState<EventColor>(defaultColor)
  const [showPicker, setShowPicker] = useState(false)
  const [error, setError] = useState("")

  function submit() {
    const err = onAdd(label, url, color)
    if (err) setError(err)
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === "Enter") submit()
    if (e.key === "Escape") onCancel()
  }

  return (
    <div className="flex flex-wrap items-start gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50">
      <input
        autoFocus
        placeholder="Label (e.g. Acme Corp)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={onKey}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 w-44"
      />
      <input
        placeholder="Paste ICS URL from Outlook"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={onKey}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1 min-w-64"
      />

      {/* Color trigger + popover */}
      <div className="relative flex items-center py-1">
        <button
          type="button"
          onClick={() => setShowPicker((v) => !v)}
          title="Pick color"
          style={{ backgroundColor: color }}
          className="w-7 h-7 rounded-full border-2 border-white shadow ring-1 ring-gray-300 hover:ring-gray-400 transition-all"
        />
        {showPicker && (
          <ColorPicker
            current={color}
            onChange={(c) => { setColor(c); setShowPicker(false) }}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>

      <button
        onClick={submit}
        disabled={!label.trim() || !url.trim()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Plus size={14} />
        Add
      </button>
      <button
        onClick={onCancel}
        className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 text-sm hover:bg-gray-100 transition-colors"
      >
        Cancel
      </button>

      {error && <p className="w-full text-sm text-red-600">{error}</p>}
      <p className="w-full text-xs text-gray-400">
        In Outlook Web → Calendar → Settings → Shared calendars → Publish a calendar → copy the ICS link.
      </p>
    </div>
  )
}

// ─── IcsFeedManager ──────────────────────────────────────────────────────────

export default function IcsFeedManager({ feeds, feedErrors, onAdd, onRemove, onUpdateColor, onToggleVisibility }: IcsFeedManagerProps) {
  const [showForm, setShowForm] = useState(false)

  function handleAdd(label: string, url: string, color: EventColor) {
    const err = onAdd(label, url, color)
    if (!err) setShowForm(false)
    return err
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
          <CalendarDays size={14} className="text-gray-400" />
          Calendars
        </span>

        {feeds.map((feed) => (
          <FeedChip
            key={feed.id}
            feed={feed}
            error={feedErrors[feed.id]}
            onRemove={() => onRemove(feed.id)}
            onUpdateColor={(c) => onUpdateColor(feed.id, c)}
            onToggleVisibility={() => onToggleVisibility(feed.id)}
          />
        ))}

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-gray-300 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            <Plus size={11} />
            Add ICS feed
          </button>
        )}
      </div>

      {showForm && (
        <AddFeedForm feeds={feeds} onAdd={handleAdd} onCancel={() => setShowForm(false)} />
      )}
    </div>
  )
}
