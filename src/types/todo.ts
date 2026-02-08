// ============================================================
// The Todo Way — Core Type Definitions
// Ref: docs/lld.md §2
// ============================================================

/** Priority levels: p1 (critical) → p4 (low) */
export type Priority = "p1" | "p2" | "p3" | "p4"

/** FullCalendar view identifiers */
export type CalendarView =
  | "timeGridDay"
  | "timeGridThreeDay"
  | "timeGridWorkWeek"
  | "timeGridWeek"
  | "dayGridMonth"

/** Fields available for sorting todos */
export type SortField =
  | "scheduled_date"
  | "priority"
  | "created_at"
  | "deadline_date"

/** Reminder preset types */
export type ReminderType =
  | "before_5min"
  | "before_15min"
  | "before_30min"
  | "before_1hr"
  | "custom"

// ------------------------------------------------------------
// Domain Models
// ------------------------------------------------------------

export interface Reminder {
  id: string
  remind_at: string
  type: ReminderType
}

export interface Label {
  id: string
  name: string
  color: string // hex, e.g. "#3B82F6"
}

export interface Subsection {
  id: string
  name: string
  sort_order: number
  section_id: string
}

export interface Section {
  id: string
  name: string
  sort_order: number
  subsections: Subsection[]
}

export interface Todo {
  id: string
  title: string
  description: string | null
  scheduled_date: string | null // ISO 8601
  deadline_date: string | null
  duration_minutes: number | null // 5–480
  priority: Priority
  location: string | null
  is_completed: boolean
  completed_at: string | null
  section_id: string | null
  subsection_id: string | null
  labels: Label[]
  reminders: Reminder[]
  created_at: string
  updated_at: string
}

// ------------------------------------------------------------
// Input types (for create / update operations)
// ------------------------------------------------------------

/** Fields required/optional when creating a new todo */
export interface CreateTodoInput {
  title: string
  description?: string | null
  scheduled_date?: string | null
  deadline_date?: string | null
  duration_minutes?: number | null
  priority?: Priority
  location?: string | null
  section_id?: string | null
  subsection_id?: string | null
  labels?: Label[]
  reminders?: Reminder[]
}

// ------------------------------------------------------------
// Filter / UI types
// ------------------------------------------------------------

export interface TodoFilters {
  sectionId: string | null
  labelIds: string[]
  priority: Priority | null
  showCompleted: boolean
}

export interface TodoCardDisplayFields {
  showDate: boolean
  showDeadline: boolean
  showDuration: boolean
  showPriority: boolean
  showLabels: boolean
  showSection: boolean
}
