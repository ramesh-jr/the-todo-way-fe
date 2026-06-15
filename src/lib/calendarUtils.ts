// ============================================================
// Calendar utilities — map items to FullCalendar events.
// Tasks (mine, movable) render distinctly from events (commitments done to me).
// ============================================================

import type { EventInput } from "@fullcalendar/core"

import type { Item, Urgency } from "@/types"

export { diffInMinutes, formatDuration } from "@/lib/dates"

// Urgency tints for tasks (calm, not alarming). Events use a neutral, distinct style.
const URGENCY_COLORS: Record<Urgency, string> = {
  high: "#6366F1", // indigo (primary) — important, not "danger red"
  normal: "#64748B", // slate
  low: "#94A3B8", // muted slate
}

const EVENT_COLOR = "#0EA5E9" // sky — visually separates external/commitment events

export function itemToFCEvent(item: Item): EventInput {
  const start = item.scheduled_at ?? undefined
  let end: string | undefined
  if (item.scheduled_at && item.duration_minutes) {
    const s = new Date(item.scheduled_at)
    end = new Date(s.getTime() + item.duration_minutes * 60_000).toISOString()
  }

  const isEvent = item.kind === "event"
  const color = isEvent ? EVENT_COLOR : URGENCY_COLORS[item.urgency]

  return {
    id: item.id,
    title: item.title,
    start,
    end,
    allDay: false,
    backgroundColor: color,
    borderColor: color,
    // Events are commitments done to me: not draggable/resizable.
    editable: !isEvent,
    classNames: isEvent ? ["fc-item-event"] : ["fc-item-task"],
    extendedProps: {
      itemId: item.id,
      kind: item.kind,
      energy: item.energy,
      durationMinutes: item.duration_minutes,
    },
  }
}
