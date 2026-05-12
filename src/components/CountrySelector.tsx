"use client"

import { useState, useEffect, useRef } from "react"
import { Globe, ChevronDown, X } from "lucide-react"
import { clsx } from "clsx"

interface Country {
  code: string
  name: string
  flag: string
}

const COUNTRIES: Country[] = [
  { code: "AM", name: "Armenia", flag: "🇦🇲" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "HR", name: "Croatia", flag: "🇭🇷" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "GR", name: "Greece", flag: "🇬🇷" },
  { code: "HU", name: "Hungary", flag: "🇭🇺" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "RO", name: "Romania", flag: "🇷🇴" },
  { code: "RU", name: "Russia", flag: "🇷🇺" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "US", name: "United States", flag: "🇺🇸" },
]

const STORAGE_KEY = "dashboard.selectedCountries"

interface CountrySelectorProps {
  selected: string[]
  onChange: (countries: string[]) => void
}

export default function CountrySelector({ selected, onChange }: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function toggle(code: string) {
    const next = selected.includes(code)
      ? selected.filter((c) => c !== code)
      : [...selected, code]
    onChange(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function remove(code: string, e: React.MouseEvent) {
    e.stopPropagation()
    const next = selected.filter((c) => c !== code)
    onChange(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Globe size={14} className="text-gray-500" />
        <span>
          {selected.length === 0
            ? "Holidays"
            : selected.length === 1
            ? COUNTRIES.find((c) => c.code === selected[0])?.name ?? selected[0]
            : `${selected.length} countries`}
        </span>
        <ChevronDown size={12} className="text-gray-400" />
      </button>

      {/* Selected country chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {selected.map((code) => {
            const country = COUNTRIES.find((c) => c.code === code)
            return (
              <span
                key={code}
                className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs"
              >
                {country?.flag} {country?.name ?? code}
                <button onClick={(e) => remove(code, e)} className="ml-0.5 hover:text-green-900">
                  <X size={10} />
                </button>
              </span>
            )
          })}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 w-64 bg-white border border-gray-200 rounded-lg shadow-lg overflow-y-auto max-h-72">
          {COUNTRIES.map((country) => {
            const isSelected = selected.includes(country.code)
            return (
              <button
                key={country.code}
                onClick={() => toggle(country.code)}
                className={clsx(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors",
                  isSelected && "bg-green-50 text-green-800"
                )}
              >
                <span className="text-base">{country.flag}</span>
                <span className="flex-1">{country.name}</span>
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center text-white text-[10px]">
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export { STORAGE_KEY }
