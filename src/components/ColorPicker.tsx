"use client"

import { useState, useRef, useEffect } from "react"
import type { EventColor } from "@/lib/types"

// 10 hue columns × 8 rows: grayscale on top, then spectrum light→dark
export const SPECTRUM_GRID: string[][] = [
  ["#000000","#434343","#666666","#999999","#b7b7b7","#cccccc","#d9d9d9","#efefef","#f3f3f3","#ffffff"],
  ["#ffcdd2","#ffe0b2","#fff9c4","#dcedc8","#c8e6c9","#b2ebf2","#bbdefb","#c5cae9","#e1bee7","#efebe9"],
  ["#ef9a9a","#ffcc80","#fff59d","#c5e1a5","#a5d6a7","#80deea","#90caf9","#9fa8da","#ce93d8","#d7ccc8"],
  ["#e57373","#ffa726","#ffee58","#aed581","#81c784","#4dd0e1","#64b5f6","#7986cb","#ba68c8","#a1887f"],
  ["#f44336","#ff9800","#ffeb3b","#8bc34a","#4caf50","#00bcd4","#2196f3","#3f51b5","#9c27b0","#795548"],
  ["#e53935","#fb8c00","#fdd835","#7cb342","#43a047","#00acc1","#1e88e5","#3949ab","#8e24aa","#6d4c41"],
  ["#c62828","#e65100","#f9a825","#558b2f","#2e7d32","#00838f","#1565c0","#283593","#6a1b9a","#4e342e"],
  ["#b71c1c","#bf360c","#f57f17","#33691e","#1b5e20","#006064","#0d47a1","#1a237e","#4a148c","#3e2723"],
]

export function Swatch({ hex, selected, onClick }: { hex: string; selected: boolean; onClick: () => void }) {
  const [over, setOver] = useState(false)
  return (
    <button
      type="button"
      title={hex}
      style={{
        backgroundColor: hex,
        boxShadow: selected
          ? "inset 0 0 0 2px rgba(0,0,0,0.85), inset 0 0 0 4px white"
          : over
          ? "inset 0 0 0 2px rgba(0,0,0,0.45)"
          : undefined,
      }}
      className="w-[15px] h-[15px] shrink-0 block"
      onMouseEnter={() => setOver(true)}
      onMouseLeave={() => setOver(false)}
      onClick={onClick}
    />
  )
}

export function ColorPicker({
  current,
  onChange,
  onClose,
  inline = false,
}: {
  current: EventColor
  onChange: (c: EventColor) => void
  onClose: () => void
  inline?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (inline) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [onClose, inline])

  function pick(hex: string) { onChange(hex); onClose() }

  return (
    <div
      ref={ref}
      className={`${inline ? "mt-1" : "absolute top-full left-0 mt-1 z-50"} w-fit bg-white dark:bg-gray-800 border-2 border-blue-400 rounded shadow-lg p-2`}
    >
      <div className="grid grid-cols-10 gap-px">
        {SPECTRUM_GRID.flat().map((hex, i) => (
          <Swatch key={i} hex={hex} selected={current === hex} onClick={() => pick(hex)} />
        ))}
      </div>
    </div>
  )
}
