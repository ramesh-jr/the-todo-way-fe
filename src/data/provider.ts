// ============================================================
// Data Provider — the single swap point.
//
// Stores ALWAYS go through this provider, never importing data directly.
// When VITE_API_URL is set, the real API client is used; otherwise the static
// in-memory provider (seeded from JSON) keeps the whole app working offline.
// ============================================================

import type {
  CalendarConnection,
  CaptureInput,
  ClarifyInput,
  CreateItemInput,
  Dashboard,
  Domain,
  Energy,
  Item,
  ItemStatus,
  NudgeList,
  Priority,
  PriorityStatus,
  ReflectionEntry,
  ReviewStatus,
  ReviewType,
  Routine,
  Season,
  Standard,
  StandardKind,
  TrendPoint,
  UpdateItemInput,
} from "@/types"

// -- provider-specific input shapes -----------------------------------------

export interface ItemListFilters {
  status?: ItemStatus
  domain_id?: string
  priority_id?: string
  energy?: Energy
  context?: string
  kind?: "task" | "event"
}

export interface DomainCreateInput {
  name: string
  color?: string
  icon?: string
  reflection_only?: boolean
}

export interface StandardCreateInput {
  text: string
  kind: StandardKind
  cadence?: "daily" | "weekly" | "monthly" | null
  target?: number | null
}

export interface PriorityCreateInput {
  title: string
  domain_id?: string | null
}

export interface RoutineCreateInput {
  title: string
  rrule: string
  domain_id?: string | null
  standard_id?: string | null
  default_energy?: Energy | null
  default_context?: string[]
  default_duration_minutes?: number | null
}

export interface ReflectionCreateInput {
  standard_id?: string | null
  rating?: number | null
  note?: string | null
}

export interface GenerateResult {
  generated: number
  skipped_missed: number
}

export interface SyncResult {
  imported: number
  updated: number
  deleted: number
  connections_synced: number
}

// -- the provider contract ---------------------------------------------------

export interface DataProvider {
  items: {
    list(filters?: ItemListFilters): Promise<Item[]>
    get(id: string): Promise<Item | undefined>
    capture(input: CaptureInput): Promise<Item>
    create(input: CreateItemInput): Promise<Item>
    update(id: string, patch: UpdateItemInput): Promise<Item>
    remove(id: string): Promise<void>
    clarify(id: string, input: ClarifyInput): Promise<Item>
    toggleComplete(id: string): Promise<Item>
    schedule(id: string, scheduledAt: string, durationMinutes: number): Promise<Item>
    markSomeday(id: string): Promise<Item>
  }
  domains: {
    list(): Promise<Domain[]>
    create(input: DomainCreateInput): Promise<Domain>
    update(id: string, patch: Partial<DomainCreateInput>): Promise<Domain>
    remove(id: string): Promise<void>
    setSeason(id: string, season: Season, note?: string | null): Promise<Domain>
    addStandard(domainId: string, input: StandardCreateInput): Promise<Standard>
    updateStandard(id: string, patch: Partial<StandardCreateInput> & { active?: boolean }): Promise<Standard>
    removeStandard(id: string): Promise<void>
    addReflection(domainId: string, input: ReflectionCreateInput): Promise<ReflectionEntry>
    trend(domainId: string): Promise<TrendPoint[]>
    dashboard(): Promise<Dashboard>
  }
  priorities: {
    list(currentOnly?: boolean): Promise<Priority[]>
    create(input: PriorityCreateInput): Promise<Priority>
    update(id: string, patch: Partial<PriorityCreateInput>): Promise<Priority>
    setStatus(id: string, status: PriorityStatus): Promise<Priority>
    remove(id: string): Promise<void>
  }
  routines: {
    list(): Promise<Routine[]>
    create(input: RoutineCreateInput): Promise<Routine>
    update(id: string, patch: Partial<RoutineCreateInput> & { active?: boolean }): Promise<Routine>
    remove(id: string): Promise<void>
    generate(): Promise<GenerateResult>
  }
  review: {
    status(): Promise<ReviewStatus>
    complete(type: ReviewType): Promise<void>
    defer(type: ReviewType, reason?: string, until?: string): Promise<void>
  }
  nudges: {
    list(): Promise<NudgeList>
  }
  data: {
    exportJson(): Promise<unknown>
  }
  calendar: {
    connections(): Promise<CalendarConnection[]>
    connect(provider: "google" | "outlook"): Promise<{ authorization_url: string }>
    disconnect(id: string): Promise<void>
    sync(): Promise<SyncResult>
  }
}

const API_URL = import.meta.env.VITE_API_URL as string | undefined

// Lazily choose the implementation so the unused one can be tree-shaken.
let provider: DataProvider
if (API_URL) {
  const { createApiProvider } = await import("./apiProvider")
  provider = createApiProvider(API_URL)
} else {
  const { createStaticProvider } = await import("./staticProvider")
  provider = createStaticProvider()
}

export const dataProvider: DataProvider = provider
