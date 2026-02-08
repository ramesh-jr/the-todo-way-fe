// ============================================================
// Calendar Utilities
// Ref: docs/lld-frontend.md §5 (FullCalendar Event Mapping)
// ============================================================

import type { EventInput } from "@fullcalendar/core"

import type { Priority, Todo } from "@/types/todo"

// ─── Priority → Color mapping ─────────────────────────────

export const priorityColors: Record<Priority, string> = {
  p1: "#EF4444", // red-500
  p2: "#F97316", // orange-500
  p3: "#3B82F6", // blue-500
  p4: "#94A3B8", // slate-400
}

// ─── Todo → FullCalendar Event ────────────────────────────

/**
 * Maps a Todo to a FullCalendar EventInput.
 * Only scheduled todos produce meaningful events.
 */
export function todoToFCEvent(todo: Todo): EventInput {
  const start = todo.scheduled_date ?? undefined
  let end: string | undefined

  if (todo.scheduled_date && todo.duration_minutes) {
    const startDate = new Date(todo.scheduled_date)
    end = new Date(
      startDate.getTime() + todo.duration_minutes * 60 * 1000,
    ).toISOString()
  }

  return {
    id: todo.id,
    title: todo.title,
    start,
    end,
    allDay: false,
    backgroundColor: priorityColors[todo.priority],
    borderColor: priorityColors[todo.priority],
    extendedProps: {
      todoId: todo.id,
      priority: todo.priority,
      durationMinutes: todo.duration_minutes,
    },
  }
}

// ─── Duration formatting ──────────────────────────────────

/**
 * Formats minutes into a human-readable string, e.g. 90 → "1h 30m"
 */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/**
 * Calculates the difference in minutes between two dates.
 */
export function diffInMinutes(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (60 * 1000))
}
