// ============================================================
// Natural-language quick-add parsing.
// Best-effort, optional sugar on top of plain capture — e.g.
//   "gym tomorrow 7am ~30m !focus"  ->  scheduled task with energy/context hints.
// Capture never *requires* this; it only enriches when patterns are present.
// ============================================================

import type { CreateItemInput, Energy } from "@/types"

interface ParsedQuickAdd {
  input: CreateItemInput
  /** Human-readable summary of what was detected, for a subtle confirmation hint. */
  hints: string[]
}

const ENERGY_WORDS: Record<string, Energy> = {
  low: "low",
  med: "medium",
  medium: "medium",
  high: "high",
}

function nextDateFor(base: Date, word: string): Date | null {
  const d = new Date(base)
  d.setSeconds(0, 0)
  if (word === "today") return d
  if (word === "tomorrow") {
    d.setDate(d.getDate() + 1)
    return d
  }
  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
  const idx = weekdays.indexOf(word)
  if (idx >= 0) {
    const diff = (idx - d.getDay() + 7) % 7 || 7
    d.setDate(d.getDate() + diff)
    return d
  }
  return null
}

export function parseQuickAdd(raw: string): ParsedQuickAdd {
  let text = raw.trim()
  const hints: string[] = []
  const input: CreateItemInput = { title: raw.trim(), context: [] }
  let date: Date | null = null
  let time: { h: number; m: number } | null = null

  // Duration: ~30m, ~2h
  const dur = text.match(/~\s*(\d+)\s*(m|min|h|hr)/i)
  if (dur) {
    const n = parseInt(dur[1], 10)
    const mins = /h/i.test(dur[2]) ? n * 60 : n
    input.duration_minutes = mins
    hints.push(`${mins}m`)
    text = text.replace(dur[0], "").trim()
  }

  // Energy: !low / !high / !medium
  const en = text.match(/!(low|med|medium|high)\b/i)
  if (en) {
    input.energy = ENERGY_WORDS[en[1].toLowerCase()]
    hints.push(`energy ${input.energy}`)
    text = text.replace(en[0], "").trim()
  }

  // Context: @focus, @errand, ...
  const ctx = [...text.matchAll(/(@\w+)/g)].map((m) => m[1].toLowerCase())
  if (ctx.length) {
    input.context = ctx
    hints.push(ctx.join(" "))
    for (const c of ctx) text = text.replace(c, "").trim()
  }

  // Time: 7am, 7:30pm, 14:00
  const tm = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i)
  if (tm && (tm[3] || tm[2])) {
    let h = parseInt(tm[1], 10)
    const m = tm[2] ? parseInt(tm[2], 10) : 0
    const mer = tm[3]?.toLowerCase()
    if (mer === "pm" && h < 12) h += 12
    if (mer === "am" && h === 12) h = 0
    if (h >= 0 && h <= 23) {
      time = { h, m }
      hints.push(`${tm[0].trim()}`)
      text = text.replace(tm[0], "").trim()
    }
  }

  // Day words
  const dayMatch = text.match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i)
  if (dayMatch) {
    date = nextDateFor(new Date(), dayMatch[1].toLowerCase())
    hints.push(dayMatch[1].toLowerCase())
    text = text.replace(dayMatch[0], "").trim()
  }

  if (date || time) {
    const when = date ?? new Date()
    if (time) when.setHours(time.h, time.m, 0, 0)
    else when.setHours(9, 0, 0, 0)
    input.scheduled_at = when.toISOString()
    input.status = "scheduled"
  }

  // Clean leftover title (collapse whitespace, strip trailing prepositions).
  const cleaned = text.replace(/\s{2,}/g, " ").replace(/\b(at|on|by)\s*$/i, "").trim()
  input.title = cleaned || raw.trim()

  return { input, hints }
}
