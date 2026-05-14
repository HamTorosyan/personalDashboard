"use client"

import { useState, useEffect } from "react"
import type { EventColor } from "@/lib/types"

export interface IcsFeed {
  id: string
  label: string
  url: string
  color: EventColor
  visible: boolean
}

const STORAGE_KEY = "dashboard.icsFeeds"

// Excel Office Theme palette (theme rows 0-5, then standard row) — 70 colors total.
// Follows the Office 2016 theme: White, Black, Bg2, Text2, Accent 1-6.
export const FEED_COLORS: string[] = [
  "#FFFFFF","#000000","#E7E6E6","#44546A","#4472C4","#ED7D31","#A5A5A5","#FFC000","#5B9BD5","#70AD47",
  "#F2F2F2","#7F7F7F","#AEAAAA","#D6DCE4","#D9E2F3","#FCE4D6","#EDEDED","#FFF2CC","#DEEAF1","#E2EFDA",
  "#D9D9D9","#595959","#757171","#ACB9CA","#B4C7E7","#F8CBAD","#DBDBDB","#FFE699","#BDD7EE","#C6EFCE",
  "#BFBFBF","#404040","#3B3838","#8496B0","#8FAADC","#F4B084","#BFBFBF","#FFD966","#9DC3E6","#A9D18E",
  "#A6A6A6","#262626","#171515","#323E4F","#2E75B6","#C55A11","#808080","#BF8F00","#2E75B6","#548235",
  "#808080","#0D0D0D","#0C0B0B","#222A35","#1F4E79","#843C0C","#595959","#7F6000","#1F4E79","#375623",
  "#C00000","#FF0000","#FFC000","#FFFF00","#92D050","#00B050","#00B0F0","#0070C0","#002060","#7030A0",
]

function saveToServer(feeds: IcsFeed[]) {
  fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ icsFeeds: feeds }),
  }).catch(() => {})
}

export function useIcsFeeds() {
  const [feeds, setFeeds] = useState<IcsFeed[]>([])

  useEffect(() => {
    let localFeeds: IcsFeed[] = []
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: IcsFeed[] = JSON.parse(stored)
        localFeeds = parsed.map((f) => ({ ...f, visible: f.visible ?? true }))
        setFeeds(localFeeds)
      }
    } catch {}

    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)))
      .then((data: { icsFeeds?: IcsFeed[] }) => {
        console.log("[IcsFeeds] server data:", JSON.stringify(data?.icsFeeds?.length), "feeds")
        if ("icsFeeds" in data && Array.isArray(data.icsFeeds)) {
          const serverFeeds = data.icsFeeds.map((f) => ({ ...f, visible: f.visible ?? true }))
          setFeeds(serverFeeds)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(serverFeeds))
        } else if (localFeeds.length > 0) {
          saveToServer(localFeeds)
        }
      })
      .catch((e) => { console.error("[IcsFeeds] settings fetch failed:", e) })
  }, [])

  function addFeed(label: string, url: string, color: EventColor): string | null {
    if (!label.trim()) return "Label is required"
    try { new URL(url) } catch { return "Invalid URL — paste the full ICS link" }

    const next: IcsFeed[] = [
      ...feeds,
      { id: Date.now().toString(), label: label.trim(), url: url.trim(), color: color as EventColor, visible: true },
    ]
    setFeeds(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    saveToServer(next)
    return null
  }

  function removeFeed(id: string) {
    const next = feeds.filter((f) => f.id !== id)
    setFeeds(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    saveToServer(next)
  }

  function updateFeedColor(id: string, color: EventColor) {
    const next = feeds.map((f) => (f.id === id ? { ...f, color } : f))
    setFeeds(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    saveToServer(next)
  }

  function toggleFeedVisibility(id: string) {
    const next = feeds.map((f) => (f.id === id ? { ...f, visible: !f.visible } : f))
    setFeeds(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    saveToServer(next)
  }

  function updateFeed(id: string, label: string, url: string, color: EventColor): string | null {
    if (!label.trim()) return "Label is required"
    try { new URL(url) } catch { return "Invalid URL — paste the full ICS link" }
    const next = feeds.map((f) => f.id === id ? { ...f, label: label.trim(), url: url.trim(), color } : f)
    setFeeds(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    saveToServer(next)
    return null
  }

  return { feeds, addFeed, removeFeed, updateFeed, updateFeedColor, toggleFeedVisibility }
}
