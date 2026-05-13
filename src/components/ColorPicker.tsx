"use client"

import { useState, useRef, useEffect } from "react"
import type { EventColor } from "@/lib/types"

// Excel Office Theme — 6 rows × 10 cols (one col per color family, light→dark)
export const EXCEL_THEME: string[][] = [
  ["#FFFFFF","#000000","#E7E6E6","#44546A","#4472C4","#ED7D31","#A5A5A5","#FFC000","#5B9BD5","#70AD47"],
  ["#F2F2F2","#7F7F7F","#AEAAAA","#D6DCE4","#D9E2F3","#FCE4D6","#EDEDED","#FFF2CC","#DEEAF1","#E2EFDA"],
  ["#D9D9D9","#595959","#757171","#ACB9CA","#B4C7E7","#F8CBAD","#DBDBDB","#FFE699","#BDD7EE","#C6EFCE"],
  ["#BFBFBF","#404040","#3B3838","#8496B0","#8FAADC","#F4B084","#BFBFBF","#FFD966","#9DC3E6","#A9D18E"],
  ["#A6A6A6","#262626","#171515","#323E4F","#2E75B6","#C55A11","#808080","#BF8F00","#2E75B6","#548235"],
  ["#808080","#0D0D0D","#0C0B0B","#222A35","#1F4E79","#843C0C","#595959","#7F6000","#1F4E79","#375623"],
]

// Excel Standard Colors row
export const EXCEL_STANDARD: string[] = [
  "#C00000","#FF0000","#FFC000","#FFFF00","#92D050",
  "#00B050","#00B0F0","#0070C0","#002060","#7030A0",
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
      className="w-[18px] h-[18px] shrink-0 block"
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
}: {
  current: EventColor
  onChange: (c: EventColor) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [onClose])

  function pick(hex: string) { onChange(hex); onClose() }

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-300 rounded shadow-lg p-2.5"
    >
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Theme Colors</p>
      <div className="grid grid-cols-10 w-fit">
        {EXCEL_THEME.flat().map((hex, i) => (
          <Swatch key={i} hex={hex} selected={current === hex} onClick={() => pick(hex)} />
        ))}
      </div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-2.5 mb-1">Standard Colors</p>
      <div className="flex w-fit">
        {EXCEL_STANDARD.map((hex) => (
          <Swatch key={hex} hex={hex} selected={current === hex} onClick={() => pick(hex)} />
        ))}
      </div>
    </div>
  )
}
