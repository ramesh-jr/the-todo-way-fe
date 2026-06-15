// ============================================================
// The Todo Way — Life Command Center types (v3)
// Mirrors the backend API (snake_case fields).
// ============================================================

export type Season = "active" | "maintenance" | "paused"
export type StandardKind = "countable" | "reflection"
export type Cadence = "daily" | "weekly" | "monthly"
export type ItemStatus = "inbox" | "active" | "scheduled" | "done" | "someday"
export type ItemKind = "task" | "event"
export type Energy = "low" | "medium" | "high"
export type Urgency = "low" | "normal" | "high"
export type Source = "manual" | "google" | "outlook"
export type PriorityStatus = "active" | "done" | "dropped"
export type ReviewType = "daily" | "weekly"
export type DomainSignal = "on_track" | "needs_attention" | "paused" | "none"
export type CalendarProvider = "google" | "outlook"

// Common context tags (free-form, but these are the suggested set).
export const CONTEXT_TAGS = [
  "@focus",
  "@errand",
  "@phone",
  "@home",
  "@out",
  "@computer",
] as const

// ------------------------------------------------------------
// Core entities
// ------------------------------------------------------------

export interface Standard {
  id: string
  domain_id: string
  text: string
  kind: StandardKind
  cadence: Cadence | null
  target: number | null
  active: boolean
  sort_order: number
}

export interface Domain {
  id: string
  name: string
  slug: string
  color: string
  icon: string
  sort_order: number
  season: Season
  season_note: string | null
  season_changed_at: string | null
  reflection_only: boolean
  standards: Standard[]
}

export interface ReflectionEntry {
  id: string
  domain_id: string
  standard_id: string | null
  rating: number | null
  note: string | null
  period_start: string
  created_at: string
}

export interface TrendPoint {
  period_start: string
  rating: number | null
  note: string | null
}

export interface Priority {
  id: string
  domain_id: string | null
  title: string
  horizon: string
  status: PriorityStatus
  period_start: string
  sort_order: number
}

export interface Routine {
  id: string
  domain_id: string | null
  standard_id: string | null
  title: string
  rrule: string
  default_energy: Energy | null
  default_context: string[]
  default_duration_minutes: number | null
  active: boolean
  last_generated_date: string | null
}

export interface Label {
  id: string
  name: string
  color: string
}

export interface Reminder {
  id: string
  remind_at: string
  offset_type: string
}

export interface Item {
  id: string
  title: string
  notes: string | null
  status: ItemStatus
  kind: ItemKind
  domain_id: string | null
  priority_id: string | null
  routine_id: string | null
  standard_id: string | null
  energy: Energy | null
  context: string[]
  scheduled_at: string | null
  duration_minutes: number | null
  deadline_at: string | null
  urgency: Urgency
  rrule: string | null
  source: Source
  external_id: string | null
  external_calendar_id: string | null
  someday_reviewed_at: string | null
  completed_at: string | null
  labels: Label[]
  reminders: Reminder[]
  created_at: string
  updated_at: string
}

// ------------------------------------------------------------
// Dashboard / signals
// ------------------------------------------------------------

export interface StandardSignal {
  standard_id: string
  text: string
  signal: DomainSignal
  recent_count: number
  target: number | null
  cadence: Cadence | null
}

export interface DomainCard {
  domain: Domain
  signal: DomainSignal
  standard_signals: StandardSignal[]
  needs_reflection: boolean
  recent_wins: number
}

export interface Dashboard {
  focus_priorities: string[]
  recent_wins: number
  maintenance_domains: string[]
  paused_domains: string[]
  domains: DomainCard[]
}

// ------------------------------------------------------------
// Review + nudges
// ------------------------------------------------------------

export interface ReviewStatus {
  is_due: boolean
  last_completed_at: string | null
  days_since_last: number | null
  deferred_reason: string | null
  deferred_until: string | null
  long_gap: boolean
}

export type NudgeKind =
  | "weekly_review"
  | "unclarified_inbox"
  | "overcommitment"
  | "someday_decay"

export interface Nudge {
  kind: NudgeKind
  title: string
  message: string
  count: number | null
  on_date: string | null
}

export interface NudgeList {
  primary: Nudge | null
  others: Nudge[]
}

export interface CalendarConnection {
  id: string
  provider: CalendarProvider
  account_email: string | null
  calendar_id: string | null
  status: string
  last_synced_at: string | null
}

// ------------------------------------------------------------
// Input types
// ------------------------------------------------------------

export interface CaptureInput {
  title: string
  notes?: string | null
}

export interface CreateItemInput {
  title: string
  notes?: string | null
  status?: ItemStatus
  kind?: ItemKind
  domain_id?: string | null
  priority_id?: string | null
  energy?: Energy | null
  context?: string[]
  scheduled_at?: string | null
  duration_minutes?: number | null
  deadline_at?: string | null
  urgency?: Urgency
}

export interface ClarifyInput {
  domain_id?: string | null
  priority_id?: string | null
  energy?: Energy | null
  context?: string[]
  scheduled_at?: string | null
  duration_minutes?: number | null
  urgency?: Urgency
  target_status?: ItemStatus
}

export type UpdateItemInput = Partial<CreateItemInput>

export interface EnergyContextFilter {
  energy: Energy | null
  context: string | null
  maxMinutes: number | null
}
