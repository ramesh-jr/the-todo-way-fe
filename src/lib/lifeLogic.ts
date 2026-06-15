// ============================================================
// Life logic — calm signals, dashboard, nudges, energy/context.
//
// This is the heart of the "conscious attention, not failure" design. It mirrors the
// backend's nudge/signal service so the app behaves identically offline (static data)
// and online (API). Reflection standards and reflection-only domains are NEVER measured.
// ============================================================

import { startOfWeek } from "@/lib/dates"
import type {
  Dashboard,
  Domain,
  DomainCard,
  DomainSignal,
  Energy,
  Item,
  Nudge,
  NudgeList,
  Priority,
  ReflectionEntry,
  StandardSignal,
} from "@/types"

// Tunables (calm by design).
export const UNCLARIFIED_COUNT_THRESHOLD = 5
export const UNCLARIFIED_AGE_DAYS = 3
export const OVERCOMMIT_MINUTES = 10 * 60
export const SOMEDAY_DECAY_DAYS = 30

const CADENCE_DAYS: Record<string, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
}

const ENERGY_RANK: Record<Energy, number> = { low: 1, medium: 2, high: 3 }

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

// ------------------------------------------------------------
// Signals (countable standards only)
// ------------------------------------------------------------

export function standardSignal(recent: number, target: number | null): DomainSignal {
  if (target === null) return "none"
  return recent >= target ? "on_track" : "needs_attention"
}

function recentCompletedForStandard(items: Item[], standardId: string, cadence: string | null): number {
  const since = daysAgo(CADENCE_DAYS[cadence ?? "weekly"] ?? 7).getTime()
  return items.filter(
    (i) =>
      i.standard_id === standardId &&
      i.status === "done" &&
      i.completed_at !== null &&
      new Date(i.completed_at).getTime() >= since,
  ).length
}

export function computeDomainCard(
  domain: Domain,
  items: Item[],
  reflections: ReflectionEntry[],
): DomainCard {
  const isPaused = domain.season === "paused"

  const standardSignals: StandardSignal[] = domain.standards
    .filter((s) => s.kind === "countable" && s.active)
    .map((s) => {
      const recent = isPaused ? 0 : recentCompletedForStandard(items, s.id, s.cadence)
      return {
        standard_id: s.id,
        text: s.text,
        signal: isPaused ? ("paused" as const) : standardSignal(recent, s.target),
        recent_count: recent,
        target: s.target,
        cadence: s.cadence,
      }
    })

  const wins = items.filter(
    (i) =>
      i.domain_id === domain.id &&
      i.status === "done" &&
      i.completed_at !== null &&
      new Date(i.completed_at).getTime() >= daysAgo(7).getTime(),
  ).length

  const hasReflectionStandard =
    domain.reflection_only || domain.standards.some((s) => s.kind === "reflection")
  const weekStart = startOfWeek().toISOString().slice(0, 10)
  const reflectedThisWeek = reflections.some(
    (r) => r.domain_id === domain.id && r.period_start === weekStart,
  )

  let signal: DomainSignal
  if (isPaused) signal = "paused"
  else if (domain.reflection_only || standardSignals.length === 0) signal = "none"
  else if (standardSignals.some((s) => s.signal === "needs_attention"))
    signal = "needs_attention"
  else signal = "on_track"

  return {
    domain,
    signal,
    standard_signals: standardSignals,
    needs_reflection: !isPaused && hasReflectionStandard && !reflectedThisWeek,
    recent_wins: wins,
  }
}

export function computeDashboard(
  domains: Domain[],
  items: Item[],
  priorities: Priority[],
  reflections: ReflectionEntry[],
): Dashboard {
  const weekStart = startOfWeek().toISOString().slice(0, 10)
  const cards = domains.map((d) => computeDomainCard(d, items, reflections))
  return {
    focus_priorities: priorities
      .filter((p) => p.status === "active" && p.period_start >= weekStart)
      .map((p) => p.id),
    recent_wins: cards.reduce((sum, c) => sum + c.recent_wins, 0),
    maintenance_domains: domains.filter((d) => d.season === "maintenance").map((d) => d.id),
    paused_domains: domains.filter((d) => d.season === "paused").map((d) => d.id),
    domains: cards,
  }
}

// ------------------------------------------------------------
// Energy & context
// ------------------------------------------------------------

export function fitsEnergyContext(
  item: Item,
  filter: { energy: Energy | null; context: string | null; maxMinutes: number | null },
): boolean {
  if (filter.energy && item.energy && ENERGY_RANK[item.energy] > ENERGY_RANK[filter.energy]) {
    return false
  }
  if (filter.context && !item.context.includes(filter.context)) return false
  if (filter.maxMinutes !== null && item.duration_minutes && item.duration_minutes > filter.maxMinutes) {
    return false
  }
  return true
}

// ------------------------------------------------------------
// Overcommitment (per-day scheduled load)
// ------------------------------------------------------------

export function scheduledMinutesByDay(items: Item[]): Map<string, number> {
  const byDay = new Map<string, number>()
  for (const item of items) {
    if (item.status === "scheduled" && item.scheduled_at) {
      const day = item.scheduled_at.slice(0, 10)
      byDay.set(day, (byDay.get(day) ?? 0) + (item.duration_minutes ?? 30))
    }
  }
  return byDay
}

export function isOvercommitted(items: Item[], day: string): boolean {
  return (scheduledMinutesByDay(items).get(day) ?? 0) > OVERCOMMIT_MINUTES
}

// ------------------------------------------------------------
// Nudges (calm, at most one prominent; paused domains excluded by construction)
// ------------------------------------------------------------

export function computeNudges(
  items: Item[],
  reviewIsDue: boolean,
  longGap: boolean,
): NudgeList {
  const candidates: Nudge[] = []

  if (reviewIsDue) {
    candidates.push(
      longGap
        ? {
            kind: "weekly_review",
            title: "Welcome back",
            message: "It's been a while. Want a gentle 2-minute reset?",
            count: null,
            on_date: null,
          }
        : {
            kind: "weekly_review",
            title: "Weekly review",
            message: "A quiet moment to look at the week ahead?",
            count: null,
            on_date: null,
          },
    )
  }

  const unclarified = items.filter(
    (i) =>
      i.status === "inbox" &&
      new Date(i.created_at).getTime() <= daysAgo(UNCLARIFIED_AGE_DAYS).getTime(),
  ).length
  if (unclarified >= UNCLARIFIED_COUNT_THRESHOLD) {
    candidates.push({
      kind: "unclarified_inbox",
      title: "A few things are waiting",
      message: "Some captures have been sitting a while — a 2-minute sort?",
      count: unclarified,
      on_date: null,
    })
  }

  const byDay = scheduledMinutesByDay(items)
  const over = [...byDay.entries()].sort().find(([, m]) => m > OVERCOMMIT_MINUTES)
  if (over) {
    candidates.push({
      kind: "overcommitment",
      title: "That day looks full",
      message: "One day is packed tighter than it may feel doable. Want to move something?",
      count: over[1],
      on_date: over[0],
    })
  }

  const decaying = items.filter(
    (i) =>
      i.status === "someday" &&
      i.someday_reviewed_at !== null &&
      new Date(i.someday_reviewed_at).getTime() <= daysAgo(SOMEDAY_DECAY_DAYS).getTime(),
  ).length
  if (decaying > 0) {
    candidates.push({
      kind: "someday_decay",
      title: "Still relevant?",
      message: "A few 'someday' items have rested a while. Keep or let go?",
      count: decaying,
      on_date: null,
    })
  }

  return { primary: candidates[0] ?? null, others: candidates.slice(1) }
}
