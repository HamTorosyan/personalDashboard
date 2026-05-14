"use client"

import { useState } from "react"
import { Globe, Plus, X, Pencil } from "lucide-react"
import { clsx } from "clsx"
import type { EventColor } from "@/lib/types"
import { ColorPicker } from "@/components/ColorPicker"

interface Country {
  code: string
  name: string
}

// All countries supported by Nager.Date public holidays API, alphabetical
const COUNTRIES: Country[] = [
  { code: "AD", name: "Andorra" },
  { code: "AL", name: "Albania" },
  { code: "AM", name: "Armenia" },
  { code: "AO", name: "Angola" },
  { code: "AR", name: "Argentina" },
  { code: "AT", name: "Austria" },
  { code: "AU", name: "Australia" },
  { code: "AX", name: "Åland Islands" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "BB", name: "Barbados" },
  { code: "BE", name: "Belgium" },
  { code: "BG", name: "Bulgaria" },
  { code: "BJ", name: "Benin" },
  { code: "BO", name: "Bolivia" },
  { code: "BR", name: "Brazil" },
  { code: "BS", name: "Bahamas" },
  { code: "BW", name: "Botswana" },
  { code: "BY", name: "Belarus" },
  { code: "BZ", name: "Belize" },
  { code: "CA", name: "Canada" },
  { code: "CH", name: "Switzerland" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "CR", name: "Costa Rica" },
  { code: "CU", name: "Cuba" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DE", name: "Germany" },
  { code: "DJ", name: "Djibouti" },
  { code: "DK", name: "Denmark" },
  { code: "DO", name: "Dominican Republic" },
  { code: "EC", name: "Ecuador" },
  { code: "EE", name: "Estonia" },
  { code: "EG", name: "Egypt" },
  { code: "ES", name: "Spain" },
  { code: "ET", name: "Ethiopia" },
  { code: "FI", name: "Finland" },
  { code: "FJ", name: "Fiji" },
  { code: "FO", name: "Faroe Islands" },
  { code: "FR", name: "France" },
  { code: "GA", name: "Gabon" },
  { code: "GB", name: "United Kingdom" },
  { code: "GD", name: "Grenada" },
  { code: "GE", name: "Georgia" },
  { code: "GG", name: "Guernsey" },
  { code: "GI", name: "Gibraltar" },
  { code: "GL", name: "Greenland" },
  { code: "GM", name: "Gambia" },
  { code: "GR", name: "Greece" },
  { code: "GT", name: "Guatemala" },
  { code: "GY", name: "Guyana" },
  { code: "HK", name: "Hong Kong" },
  { code: "HN", name: "Honduras" },
  { code: "HR", name: "Croatia" },
  { code: "HT", name: "Haiti" },
  { code: "HU", name: "Hungary" },
  { code: "ID", name: "Indonesia" },
  { code: "IE", name: "Ireland" },
  { code: "IM", name: "Isle of Man" },
  { code: "IN", name: "India" },
  { code: "IS", name: "Iceland" },
  { code: "IT", name: "Italy" },
  { code: "JE", name: "Jersey" },
  { code: "JM", name: "Jamaica" },
  { code: "JO", name: "Jordan" },
  { code: "JP", name: "Japan" },
  { code: "KE", name: "Kenya" },
  { code: "KG", name: "Kyrgyzstan" },
  { code: "KR", name: "South Korea" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "LA", name: "Laos" },
  { code: "LC", name: "Saint Lucia" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LK", name: "Sri Lanka" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "LV", name: "Latvia" },
  { code: "MA", name: "Morocco" },
  { code: "MC", name: "Monaco" },
  { code: "MD", name: "Moldova" },
  { code: "ME", name: "Montenegro" },
  { code: "MG", name: "Madagascar" },
  { code: "MK", name: "North Macedonia" },
  { code: "MM", name: "Myanmar" },
  { code: "MN", name: "Mongolia" },
  { code: "MO", name: "Macau" },
  { code: "MS", name: "Montserrat" },
  { code: "MT", name: "Malta" },
  { code: "MX", name: "Mexico" },
  { code: "MY", name: "Malaysia" },
  { code: "MZ", name: "Mozambique" },
  { code: "NA", name: "Namibia" },
  { code: "NE", name: "Niger" },
  { code: "NG", name: "Nigeria" },
  { code: "NI", name: "Nicaragua" },
  { code: "NL", name: "Netherlands" },
  { code: "NO", name: "Norway" },
  { code: "NZ", name: "New Zealand" },
  { code: "PA", name: "Panama" },
  { code: "PE", name: "Peru" },
  { code: "PG", name: "Papua New Guinea" },
  { code: "PH", name: "Philippines" },
  { code: "PK", name: "Pakistan" },
  { code: "PL", name: "Poland" },
  { code: "PR", name: "Puerto Rico" },
  { code: "PT", name: "Portugal" },
  { code: "PY", name: "Paraguay" },
  { code: "RO", name: "Romania" },
  { code: "RS", name: "Serbia" },
  { code: "RU", name: "Russia" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SB", name: "Solomon Islands" },
  { code: "SC", name: "Seychelles" },
  { code: "SE", name: "Sweden" },
  { code: "SG", name: "Singapore" },
  { code: "SI", name: "Slovenia" },
  { code: "SK", name: "Slovakia" },
  { code: "SL", name: "Sierra Leone" },
  { code: "SM", name: "San Marino" },
  { code: "SR", name: "Suriname" },
  { code: "ST", name: "São Tomé and Príncipe" },
  { code: "SV", name: "El Salvador" },
  { code: "SZ", name: "Eswatini" },
  { code: "TC", name: "Turks and Caicos Islands" },
  { code: "TN", name: "Tunisia" },
  { code: "TO", name: "Tonga" },
  { code: "TR", name: "Turkey" },
  { code: "TT", name: "Trinidad and Tobago" },
  { code: "TW", name: "Taiwan" },
  { code: "TZ", name: "Tanzania" },
  { code: "UA", name: "Ukraine" },
  { code: "UG", name: "Uganda" },
  { code: "US", name: "United States" },
  { code: "UY", name: "Uruguay" },
  { code: "VA", name: "Vatican City" },
  { code: "VC", name: "Saint Vincent and the Grenadines" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Vietnam" },
  { code: "WS", name: "Samoa" },
  { code: "ZA", name: "South Africa" },
  { code: "ZW", name: "Zimbabwe" },
]

export const DEFAULT_HOLIDAY_COLOR = "#16a34a"

export function CountryFlag({ code, size = 20 }: { code: string; size?: number }) {
  return (
    <img
      src={`https://flagcdn.com/w${size}/${code.toLowerCase()}.png`}
      width={size}
      height={Math.round(size * 0.75)}
      alt={code}
      className="inline-block shrink-0 rounded-sm object-cover"
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
    />
  )
}

interface HolidayManagerProps {
  selected: string[]
  hiddenCountries: string[]
  countryColors: Record<string, string>
  onAdd: (code: string, color: EventColor) => void
  onRemove: (code: string) => void
  onUpdateColor: (code: string, color: EventColor) => void
  onToggleVisibility: (code: string) => void
}

// ─── CountryChip ─────────────────────────────────────────────────────────────

function CountryChip({
  code,
  name,
  hidden,
  color,
  onRemove,
  onEdit,
  onToggleVisibility,
}: {
  code: string
  name: string
  hidden: boolean
  color: string
  onRemove: () => void
  onEdit: () => void
  onToggleVisibility: () => void
}) {
  return (
    <label
      className={clsx(
        "relative flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 cursor-pointer select-none transition-opacity border-gray-200 dark:border-gray-600",
        hidden && "opacity-45"
      )}
    >
      <input
        type="checkbox"
        checked={!hidden}
        onChange={onToggleVisibility}
        className="w-3 h-3 rounded accent-blue-500 cursor-pointer shrink-0"
      />
      <span
        style={{ backgroundColor: color }}
        className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
      />
      <CountryFlag code={code} size={14} />
      {name}
      <button
        onClick={(e) => { e.preventDefault(); onEdit() }}
        className="ml-0.5 text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
        title="Edit color"
      >
        <Pencil size={10} />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); onRemove() }}
        className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        title="Remove country"
      >
        <X size={11} />
      </button>
    </label>
  )
}

// ─── EditCountryForm ──────────────────────────────────────────────────────────

function EditCountryForm({
  code,
  name,
  currentColor,
  onSave,
  onCancel,
}: {
  code: string
  name: string
  currentColor: string
  onSave: (color: EventColor) => void
  onCancel: () => void
}) {
  const [color, setColor] = useState<EventColor>(currentColor)
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
      <div className="flex items-center gap-2">
        <CountryFlag code={code} size={16} />
        <span className="text-sm text-gray-700 dark:text-gray-200 font-medium flex-1">{name}</span>
        <button
          type="button"
          onClick={() => setShowPicker((v) => !v)}
          title="Pick color"
          style={{ backgroundColor: color }}
          className="w-7 h-7 rounded-full border-2 border-white dark:border-black shadow ring-1 ring-gray-300 hover:ring-gray-400 transition-all shrink-0"
        />
      </div>
      {showPicker && (
        <ColorPicker
          current={color}
          onChange={(c) => { setColor(c); setShowPicker(false) }}
          onClose={() => setShowPicker(false)}
          inline
        />
      )}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(color)}
          className="flex-1 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  )
}

// ─── AddCountryForm ───────────────────────────────────────────────────────────

function AddCountryForm({
  selected,
  onAdd,
  onCancel,
}: {
  selected: string[]
  onAdd: (code: string, color: EventColor) => void
  onCancel: () => void
}) {
  const [search, setSearch] = useState("")
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [color, setColor] = useState<EventColor>(DEFAULT_HOLIDAY_COLOR)
  const [showPicker, setShowPicker] = useState(false)

  const available = COUNTRIES.filter((c) => !selected.includes(c.code))
  const filtered = search.trim()
    ? available.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase())
      )
    : available

  const selectedCountry = COUNTRIES.find((c) => c.code === selectedCode)

  function selectCountry(code: string) {
    setSelectedCode(code)
    setSearch(COUNTRIES.find((c) => c.code === code)?.name ?? "")
  }

  function submit() {
    if (!selectedCode) return
    onAdd(selectedCode, color)
  }

  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      {/* Country search + Color row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          {selectedCountry && (
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <CountryFlag code={selectedCountry.code} size={14} />
            </span>
          )}
          <input
            autoFocus
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedCode(null) }}
            placeholder="Search country…"
            className={`w-full py-1.5 pr-3 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 ${selectedCountry ? "pl-8" : "pl-3"}`}
          />
        </div>
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

      {/* Filtered country list */}
      {!selectedCode && (
        <div className="max-h-44 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">No results</p>
          )}
          {filtered.map((country) => (
            <button
              key={country.code}
              onClick={() => selectCountry(country.code)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <CountryFlag code={country.code} size={16} />
              <span>{country.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!selectedCode}
          className="flex items-center justify-center gap-1.5 flex-1 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={14} />
          Add
        </button>
      </div>
    </div>
  )
}

// ─── HolidayManager ──────────────────────────────────────────────────────────

export default function HolidayManager({
  selected,
  hiddenCountries,
  countryColors,
  onAdd,
  onRemove,
  onUpdateColor,
  onToggleVisibility,
}: HolidayManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCode, setEditingCode] = useState<string | null>(null)

  function handleAdd(code: string, color: EventColor) {
    onAdd(code, color)
    setShowAddForm(false)
  }

  function startEdit(code: string) {
    setShowAddForm(false)
    setEditingCode(code)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 font-medium">
          <Globe size={14} className="text-gray-400 dark:text-gray-500" />
          Holidays
        </span>

        {selected.map((code) => {
          const country = COUNTRIES.find((c) => c.code === code)
          return (
            <CountryChip
              key={code}
              code={code}
              name={country?.name ?? code}
              hidden={hiddenCountries.includes(code)}
              color={countryColors[code] ?? DEFAULT_HOLIDAY_COLOR}
              onRemove={() => onRemove(code)}
              onEdit={() => startEdit(code)}
              onToggleVisibility={() => onToggleVisibility(code)}
            />
          )
        })}

        {!showAddForm && !editingCode && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-gray-300 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <Plus size={11} />
            Add Country
          </button>
        )}
      </div>

      {editingCode && (() => {
        const country = COUNTRIES.find((c) => c.code === editingCode)
        return country ? (
          <EditCountryForm
            code={editingCode}
            name={country.name}
            currentColor={countryColors[editingCode] ?? DEFAULT_HOLIDAY_COLOR}
            onSave={(color) => { onUpdateColor(editingCode, color); setEditingCode(null) }}
            onCancel={() => setEditingCode(null)}
          />
        ) : null
      })()}

      {showAddForm && (
        <AddCountryForm
          selected={selected}
          onAdd={handleAdd}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  )
}
