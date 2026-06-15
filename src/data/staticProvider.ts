// ============================================================
// Static (in-memory) data provider — seeded from JSON.
// Keeps the whole app fully functional with no backend. Mutations live in memory
// and reset on reload. Dashboard/nudges/signals are computed client-side via lifeLogic
// so behavior matches the API exactly.
// ============================================================

import { computeDashboard, computeNudges } from "@/lib/lifeLogic"
import type {
  CalendarConnection,
  CaptureInput,
  ClarifyInput,
  CreateItemInput,
  Domain,
  Item,
  Priority,
  ReflectionEntry,
  ReviewStatus,
  ReviewType,
  Routine,
  Season,
  Standard,
  TrendPoint,
  UpdateItemInput,
} from "@/types"

import domainsSeed from "./seed/domains.json"
import itemsSeed from "./seed/items.json"
import prioritiesSeed from "./seed/priorities.json"
import reflectionsSeed from "./seed/reflections.json"
import routinesSeed from "./seed/routines.json"
import type {
  DataProvider,
  DomainCreateInput,
  GenerateResult,
  ItemListFilters,
  PriorityCreateInput,
  ReflectionCreateInput,
  RoutineCreateInput,
  StandardCreateInput,
  SyncResult,
} from "./provider"

interface ReviewRecord {
  type: ReviewType
  status: "completed" | "deferred"
  reason: string | null
  until: string | null
  completed_at: string | null
  created_at: string
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function nowISO(): string {
  return new Date().toISOString()
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function currentWeekStartISO(): string {
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))
  return weekStart.toISOString().slice(0, 10)
}

export function createStaticProvider(): DataProvider {
  const items: Item[] = clone(itemsSeed as Item[])
  const domains: Domain[] = clone(domainsSeed as Domain[])
  // Normalize seed priorities to the current week so they always surface as
  // "this week's" priorities regardless of when the demo is opened.
  const priorities: Priority[] = clone(prioritiesSeed as Priority[]).map((p) => ({
    ...p,
    period_start: currentWeekStartISO(),
  }))
  const routines: Routine[] = clone(routinesSeed as Routine[])
  const reflections: ReflectionEntry[] = clone(reflectionsSeed as ReflectionEntry[])

  // Seed one completed review ~8 days ago so a gentle weekly nudge is due.
  const eightDaysAgo = new Date()
  eightDaysAgo.setDate(eightDaysAgo.getDate() - 8)
  const reviews: ReviewRecord[] = [
    {
      type: "weekly",
      status: "completed",
      reason: null,
      until: null,
      completed_at: eightDaysAgo.toISOString(),
      created_at: eightDaysAgo.toISOString(),
    },
  ]

  function findItem(id: string): Item {
    const item = items.find((i) => i.id === id)
    if (!item) throw new Error("Item not found")
    return item
  }

  function reviewStatus(): ReviewStatus {
    const completed = [...reviews]
      .filter((r) => r.status === "completed" && r.completed_at)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0]
    const deferred = [...reviews]
      .filter((r) => r.status === "deferred")
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0]
    const lastCompleted = completed?.completed_at ?? null
    const days = lastCompleted
      ? Math.floor((Date.now() - new Date(lastCompleted).getTime()) / 86_400_000)
      : null
    let isDue = days === null || days >= 7
    let deferredReason: string | null = null
    let deferredUntil: string | null = null
    if (deferred && (!completed || deferred.created_at > completed.created_at)) {
      deferredReason = deferred.reason
      deferredUntil = deferred.until
      if (deferred.until && new Date(deferred.until).getTime() > Date.now()) isDue = false
    }
    return {
      is_due: isDue,
      last_completed_at: lastCompleted,
      days_since_last: days,
      deferred_reason: deferredReason,
      deferred_until: deferredUntil,
      long_gap: days === null || days >= 14,
    }
  }

  function expandRrule(rrule: string, fromDays: number, toDays: number): Date[] {
    // Minimal expander: supports FREQ=DAILY and FREQ=WEEKLY;BYDAY=MO,WE,...
    const parts = Object.fromEntries(
      rrule.split(";").map((p) => p.split("=") as [string, string]),
    )
    const byday = (parts.BYDAY ?? "").split(",").filter(Boolean)
    const dayMap: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 }
    const out: Date[] = []
    for (let offset = fromDays; offset <= toDays; offset++) {
      const d = new Date()
      d.setHours(9, 0, 0, 0)
      d.setDate(d.getDate() + offset)
      if (parts.FREQ === "DAILY") out.push(new Date(d))
      else if (parts.FREQ === "WEEKLY" && byday.some((b) => dayMap[b] === d.getDay())) {
        out.push(new Date(d))
      }
    }
    return out
  }

  const provider: DataProvider = {
    items: {
      async list(filters?: ItemListFilters) {
        let result = [...items]
        if (filters?.status) result = result.filter((i) => i.status === filters.status)
        if (filters?.domain_id) result = result.filter((i) => i.domain_id === filters.domain_id)
        if (filters?.priority_id) result = result.filter((i) => i.priority_id === filters.priority_id)
        if (filters?.energy) result = result.filter((i) => i.energy === filters.energy)
        if (filters?.kind) result = result.filter((i) => i.kind === filters.kind)
        if (filters?.context) result = result.filter((i) => i.context.includes(filters.context!))
        return result.map(clone)
      },
      async get(id: string) {
        const item = items.find((i) => i.id === id)
        return item ? clone(item) : undefined
      },
      async capture(input: CaptureInput) {
        const item: Item = {
          id: uid("item"),
          title: input.title.trim(),
          notes: input.notes ?? null,
          status: "inbox",
          kind: "task",
          domain_id: null,
          priority_id: null,
          routine_id: null,
          standard_id: null,
          energy: null,
          context: [],
          scheduled_at: null,
          duration_minutes: null,
          deadline_at: null,
          urgency: "normal",
          rrule: null,
          source: "manual",
          external_id: null,
          external_calendar_id: null,
          someday_reviewed_at: null,
          completed_at: null,
          labels: [],
          reminders: [],
          created_at: nowISO(),
          updated_at: nowISO(),
        }
        items.unshift(item)
        return clone(item)
      },
      async create(input: CreateItemInput) {
        const item: Item = {
          id: uid("item"),
          title: input.title.trim(),
          notes: input.notes ?? null,
          status: input.status ?? (input.scheduled_at ? "scheduled" : "active"),
          kind: input.kind ?? "task",
          domain_id: input.domain_id ?? null,
          priority_id: input.priority_id ?? null,
          routine_id: null,
          standard_id: null,
          energy: input.energy ?? null,
          context: input.context ?? [],
          scheduled_at: input.scheduled_at ?? null,
          duration_minutes: input.duration_minutes ?? null,
          deadline_at: input.deadline_at ?? null,
          urgency: input.urgency ?? "normal",
          rrule: null,
          source: "manual",
          external_id: null,
          external_calendar_id: null,
          someday_reviewed_at: null,
          completed_at: null,
          labels: [],
          reminders: [],
          created_at: nowISO(),
          updated_at: nowISO(),
        }
        items.unshift(item)
        return clone(item)
      },
      async update(id: string, patch: UpdateItemInput) {
        const item = findItem(id)
        Object.assign(item, patch, { updated_at: nowISO() })
        return clone(item)
      },
      async remove(id: string) {
        const idx = items.findIndex((i) => i.id === id)
        if (idx >= 0) items.splice(idx, 1)
      },
      async clarify(id: string, input: ClarifyInput) {
        const item = findItem(id)
        if (input.domain_id !== undefined) item.domain_id = input.domain_id
        if (input.priority_id !== undefined) item.priority_id = input.priority_id
        if (input.energy !== undefined) item.energy = input.energy
        if (input.context !== undefined) item.context = input.context
        if (input.scheduled_at !== undefined) item.scheduled_at = input.scheduled_at
        if (input.duration_minutes !== undefined) item.duration_minutes = input.duration_minutes
        if (input.urgency !== undefined) item.urgency = input.urgency
        item.status = input.target_status ?? (item.scheduled_at ? "scheduled" : "active")
        item.updated_at = nowISO()
        return clone(item)
      },
      async toggleComplete(id: string) {
        const item = findItem(id)
        if (item.status === "done") {
          item.status = item.scheduled_at ? "scheduled" : "active"
          item.completed_at = null
        } else {
          item.status = "done"
          item.completed_at = nowISO()
        }
        item.updated_at = nowISO()
        return clone(item)
      },
      async schedule(id: string, scheduledAt: string, durationMinutes: number) {
        const item = findItem(id)
        item.scheduled_at = scheduledAt
        item.duration_minutes = durationMinutes
        if (item.status === "inbox" || item.status === "active") item.status = "scheduled"
        item.updated_at = nowISO()
        return clone(item)
      },
      async markSomeday(id: string) {
        const item = findItem(id)
        item.status = "someday"
        item.someday_reviewed_at = nowISO()
        item.updated_at = nowISO()
        return clone(item)
      },
    },

    domains: {
      async list() {
        return clone(domains)
      },
      async create(input: DomainCreateInput) {
        const domain: Domain = {
          id: uid("dom"),
          name: input.name.trim(),
          slug: input.name.toLowerCase().replace(/\s+/g, "-"),
          color: input.color ?? "#6366F1",
          icon: input.icon ?? "circle",
          sort_order: domains.length,
          season: "active",
          season_note: null,
          season_changed_at: null,
          reflection_only: input.reflection_only ?? false,
          standards: [],
        }
        domains.push(domain)
        return clone(domain)
      },
      async update(id: string, patch: Partial<DomainCreateInput>) {
        const domain = domains.find((d) => d.id === id)
        if (!domain) throw new Error("Domain not found")
        Object.assign(domain, patch)
        return clone(domain)
      },
      async remove(id: string) {
        const idx = domains.findIndex((d) => d.id === id)
        if (idx >= 0) domains.splice(idx, 1)
      },
      async setSeason(id: string, season: Season, note?: string | null) {
        const domain = domains.find((d) => d.id === id)
        if (!domain) throw new Error("Domain not found")
        domain.season = season
        domain.season_note = note ?? null
        domain.season_changed_at = nowISO()
        return clone(domain)
      },
      async addStandard(domainId: string, input: StandardCreateInput) {
        const domain = domains.find((d) => d.id === domainId)
        if (!domain) throw new Error("Domain not found")
        if (domain.reflection_only && input.kind === "countable") {
          throw new Error(
            "This domain is reflection-only; relationships are not measured by checkboxes.",
          )
        }
        const standard: Standard = {
          id: uid("std"),
          domain_id: domainId,
          text: input.text.trim(),
          kind: input.kind,
          cadence: input.kind === "countable" ? input.cadence ?? "weekly" : null,
          target: input.kind === "countable" ? input.target ?? 1 : null,
          active: true,
          sort_order: domain.standards.length,
        }
        domain.standards.push(standard)
        return clone(standard)
      },
      async updateStandard(id, patch) {
        for (const domain of domains) {
          const standard = domain.standards.find((s) => s.id === id)
          if (standard) {
            if (standard.kind === "reflection") {
              delete patch.cadence
              delete patch.target
            }
            Object.assign(standard, patch)
            return clone(standard)
          }
        }
        throw new Error("Standard not found")
      },
      async removeStandard(id: string) {
        for (const domain of domains) {
          const idx = domain.standards.findIndex((s) => s.id === id)
          if (idx >= 0) {
            domain.standards.splice(idx, 1)
            return
          }
        }
      },
      async addReflection(domainId: string, input: ReflectionCreateInput) {
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))
        const entry: ReflectionEntry = {
          id: uid("ref"),
          domain_id: domainId,
          standard_id: input.standard_id ?? null,
          rating: input.rating ?? null,
          note: input.note ?? null,
          period_start: weekStart.toISOString().slice(0, 10),
          created_at: nowISO(),
        }
        reflections.push(entry)
        return clone(entry)
      },
      async trend(domainId: string) {
        return reflections
          .filter((r) => r.domain_id === domainId)
          .sort((a, b) => (a.period_start < b.period_start ? -1 : 1))
          .slice(-12)
          .map<TrendPoint>((r) => ({
            period_start: r.period_start,
            rating: r.rating,
            note: r.note,
          }))
      },
      async dashboard() {
        return computeDashboard(domains, items, priorities, reflections)
      },
    },

    priorities: {
      async list(currentOnly = true) {
        const iso = currentWeekStartISO()
        return priorities
          .filter((p) => !currentOnly || p.period_start >= iso)
          .map(clone)
      },
      async create(input: PriorityCreateInput) {
        const priority: Priority = {
          id: uid("prio"),
          domain_id: input.domain_id ?? null,
          title: input.title.trim(),
          horizon: "week",
          status: "active",
          period_start: currentWeekStartISO(),
          sort_order: priorities.length,
        }
        priorities.push(priority)
        return clone(priority)
      },
      async update(id, patch) {
        const priority = priorities.find((p) => p.id === id)
        if (!priority) throw new Error("Priority not found")
        Object.assign(priority, patch)
        return clone(priority)
      },
      async setStatus(id, status) {
        const priority = priorities.find((p) => p.id === id)
        if (!priority) throw new Error("Priority not found")
        priority.status = status
        return clone(priority)
      },
      async remove(id) {
        const idx = priorities.findIndex((p) => p.id === id)
        if (idx >= 0) priorities.splice(idx, 1)
      },
    },

    routines: {
      async list() {
        return clone(routines)
      },
      async create(input: RoutineCreateInput) {
        const routine: Routine = {
          id: uid("rou"),
          domain_id: input.domain_id ?? null,
          standard_id: input.standard_id ?? null,
          title: input.title.trim(),
          rrule: input.rrule,
          default_energy: input.default_energy ?? null,
          default_context: input.default_context ?? [],
          default_duration_minutes: input.default_duration_minutes ?? null,
          active: true,
          last_generated_date: null,
        }
        routines.push(routine)
        return clone(routine)
      },
      async update(id, patch) {
        const routine = routines.find((r) => r.id === id)
        if (!routine) throw new Error("Routine not found")
        Object.assign(routine, patch)
        return clone(routine)
      },
      async remove(id) {
        const idx = routines.findIndex((r) => r.id === id)
        if (idx >= 0) routines.splice(idx, 1)
      },
      async generate() {
        let generated = 0
        for (const routine of routines) {
          if (!routine.active) continue
          // Grace: only fill forward (today .. +14), never backfill missed days.
          for (const occ of expandRrule(routine.rrule, 0, 14)) {
            const exists = items.some(
              (i) => i.routine_id === routine.id && i.scheduled_at === occ.toISOString(),
            )
            if (exists) continue
            items.push({
              id: uid("item"),
              title: routine.title,
              notes: null,
              status: "scheduled",
              kind: "task",
              domain_id: routine.domain_id,
              priority_id: null,
              routine_id: routine.id,
              standard_id: routine.standard_id,
              energy: routine.default_energy,
              context: [...routine.default_context],
              scheduled_at: occ.toISOString(),
              duration_minutes: routine.default_duration_minutes,
              deadline_at: null,
              urgency: "normal",
              rrule: null,
              source: "manual",
              external_id: null,
              external_calendar_id: null,
              someday_reviewed_at: null,
              completed_at: null,
              labels: [],
              reminders: [],
              created_at: nowISO(),
              updated_at: nowISO(),
            })
            generated++
          }
          routine.last_generated_date = new Date().toISOString().slice(0, 10)
        }
        const result: GenerateResult = { generated, skipped_missed: 0 }
        return result
      },
    },

    review: {
      async status() {
        return reviewStatus()
      },
      async complete(type: ReviewType) {
        reviews.push({
          type,
          status: "completed",
          reason: null,
          until: null,
          completed_at: nowISO(),
          created_at: nowISO(),
        })
      },
      async defer(type: ReviewType, reason?: string, until?: string) {
        reviews.push({
          type,
          status: "deferred",
          reason: reason ?? null,
          until: until ?? null,
          completed_at: null,
          created_at: nowISO(),
        })
      },
    },

    nudges: {
      async list() {
        const status = reviewStatus()
        return computeNudges(items, status.is_due, status.long_gap)
      },
    },

    data: {
      async exportJson() {
        return {
          exported_at: nowISO(),
          version: "v3",
          domains,
          items,
          priorities,
          routines,
          reflections,
        }
      },
    },

    calendar: {
      async connections(): Promise<CalendarConnection[]> {
        return []
      },
      async connect() {
        // No real OAuth in the static provider.
        return { authorization_url: "" }
      },
      async disconnect() {
        /* no-op */
      },
      async sync(): Promise<SyncResult> {
        return { imported: 0, updated: 0, deleted: 0, connections_synced: 0 }
      },
    },
  }

  return provider
}
