"use client"

import { useState, KeyboardEvent } from "react"
import { CalendarDays, Plus, X, AlertTriangle, Pencil } from "lucide-react"
import { clsx } from "clsx"
import { FEED_COLORS, type IcsFeed } from "@/hooks/useIcsFeeds"
import type { EventColor } from "@/lib/types"
import { ColorPicker } from "@/components/ColorPicker"

interface IcsFeedManagerProps {
  feeds: IcsFeed[]
  feedErrors: Record<string, string>
  onAdd: (label: string, url: string, color: EventColor) => string | null
  onRemove: (id: string) => void
  onUpdate: (id: string, label: string, url: string, color: EventColor) => string | null
  onUpdateColor: (id: string, color: EventColor) => void
  onToggleVisibility: (id: string) => void
}

// ─── FeedChip ────────────────────────────────────────────────────────────────

function FeedChip({
  feed,
  error,
  onRemove,
  onEdit,
  onToggleVisibility,
}: {
  feed: IcsFeed
  error?: string
  onRemove: () => void
  onEdit: () => void
  onToggleVisibility: () => void
}) {
  return (
    <label
      className={clsx(
        "relative flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 cursor-pointer select-none transition-opacity",
        error ? "border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700" : "border-gray-200 dark:border-gray-600",
        !feed.visible && "opacity-45"
      )}
    >
      <input
        type="checkbox"
        checked={feed.visible}
        onChange={onToggleVisibility}
        className="w-3 h-3 rounded accent-blue-500 cursor-pointer shrink-0"
      />
      <span
        style={{ backgroundColor: feed.color }}
        className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
      />
      {feed.label}
      {error && (
        <span title={error} className="text-amber-500 cursor-help">
          <AlertTriangle size={11} />
        </span>
      )}
      <button
        onClick={(e) => { e.preventDefault(); onEdit() }}
        className="ml-0.5 text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
        title="Edit feed"
      >
        <Pencil size={10} />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); onRemove() }}
        className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        title="Remove feed"
      >
        <X size={11} />
      </button>
    </label>
  )
}

// ─── EditFeedForm ─────────────────────────────────────────────────────────────

function EditFeedForm({
  feed,
  onSave,
  onCancel,
}: {
  feed: IcsFeed
  onSave: (label: string, url: string, color: EventColor) => string | null
  onCancel: () => void
}) {
  const [label, setLabel] = useState(feed.label)
  const [url, setUrl] = useState(feed.url)
  const [color, setColor] = useState<EventColor>(feed.color)
  const [showPicker, setShowPicker] = useState(false)
  const [error, setError] = useState("")

  function submit() {
    const err = onSave(label, url, color)
    if (err) setError(err)
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === "Enter") submit()
    if (e.key === "Escape") onCancel()
  }

  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
      {/* Label + Color row */}
      <div className="flex items-center gap-2">
        <input
          autoFocus
          placeholder="Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={onKey}
          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="button"
          onClick={() => setShowPicker((v) => !v)}
          title="Pick color"
          style={{ backgroundColor: color }}
          className="w-7 h-7 rounded-full border-2 border-white dark:border-black shadow ring-1 ring-gray-300 hover:ring-gray-400 transition-all shrink-0"
        />
      </div>

      {/* Inline color picker */}
      {showPicker && (
        <ColorPicker
          current={color}
          onChange={(c) => { setColor(c); setShowPicker(false) }}
          onClose={() => setShowPicker(false)}
          inline
        />
      )}

      {/* URL row */}
      <input
        placeholder="ICS URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={onKey}
        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      <div className="flex gap-2 w-full">
        <button
          onClick={onCancel}
          className="flex-1 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!label.trim() || !url.trim()}
          className="flex-1 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Save
        </button>
      </div>
      {error && <p className="w-full text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
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
    <div className="flex flex-col gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      {/* Label + Color row */}
      <div className="flex items-center gap-2">
        <input
          autoFocus
          placeholder="Label (e.g. Acme Corp)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={onKey}
          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="button"
          onClick={() => setShowPicker((v) => !v)}
          title="Pick color"
          style={{ backgroundColor: color }}
          className="w-7 h-7 rounded-full border-2 border-white dark:border-black shadow ring-1 ring-gray-300 hover:ring-gray-400 transition-all shrink-0"
        />
      </div>

      {/* Inline color picker */}
      {showPicker && (
        <ColorPicker
          current={color}
          onChange={(c) => { setColor(c); setShowPicker(false) }}
          onClose={() => setShowPicker(false)}
          inline
        />
      )}

      {/* URL row */}
      <input
        placeholder="Paste ICS URL from Outlook"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={onKey}
        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      <div className="flex gap-2 w-full">
        <button
          onClick={onCancel}
          className="flex-1 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!label.trim() || !url.trim()}
          className="flex items-center justify-center gap-1.5 flex-1 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {error && <p className="w-full text-sm text-red-600">{error}</p>}
      <p className="w-full text-xs text-gray-400 dark:text-gray-500">
        <strong className="font-medium">Google Calendar:</strong> Settings → [Calendar] → Integrate calendar → <em>Secret address in iCal format</em> (not the public URL).<br />
        <strong className="font-medium">Outlook:</strong> Calendar → Settings → Shared calendars → Publish → copy ICS link.
      </p>
    </div>
  )
}

// ─── IcsFeedManager ──────────────────────────────────────────────────────────

export default function IcsFeedManager({ feeds, feedErrors, onAdd, onRemove, onUpdate, onUpdateColor, onToggleVisibility }: IcsFeedManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  function handleAdd(label: string, url: string, color: EventColor) {
    const err = onAdd(label, url, color)
    if (!err) setShowAddForm(false)
    return err
  }

  function handleEdit(id: string, label: string, url: string, color: EventColor) {
    const err = onUpdate(id, label, url, color)
    if (!err) setEditingId(null)
    return err
  }

  function startEdit(id: string) {
    setShowAddForm(false)
    setEditingId(id)
  }

  function startAdd() {
    setEditingId(null)
    setShowAddForm(true)
  }

  const feedsWithErrors = feeds.filter((f) => feedErrors[f.id])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 font-medium">
          <CalendarDays size={14} className="text-gray-400 dark:text-gray-500" />
          Calendars
        </span>

        {feeds.map((feed) => (
          <FeedChip
            key={feed.id}
            feed={feed}
            error={feedErrors[feed.id]}
            onRemove={() => onRemove(feed.id)}
            onEdit={() => startEdit(feed.id)}
            onToggleVisibility={() => onToggleVisibility(feed.id)}
          />
        ))}

        {!showAddForm && !editingId && (
          <button
            onClick={startAdd}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-gray-300 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <Plus size={11} />
            Add ICS feed
          </button>
        )}
      </div>

      {feedsWithErrors.map((feed) => (
        <div key={feed.id} className="flex items-start gap-1.5 px-2.5 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-500" />
          <span><strong>{feed.label}:</strong> {feedErrors[feed.id]}</span>
        </div>
      ))}

      {editingId && (() => {
        const feed = feeds.find((f) => f.id === editingId)
        return feed ? (
          <EditFeedForm
            feed={feed}
            onSave={(label, url, color) => handleEdit(editingId, label, url, color)}
            onCancel={() => setEditingId(null)}
          />
        ) : null
      })()}

      {showAddForm && (
        <AddFeedForm feeds={feeds} onAdd={handleAdd} onCancel={() => setShowAddForm(false)} />
      )}
    </div>
  )
}
