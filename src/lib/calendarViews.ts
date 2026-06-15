// ============================================================
// FullCalendar view identifiers + shared view config.
// ============================================================

export type CalendarView =
  | "timeGridDay"
  | "timeGridThreeDay"
  | "timeGridWorkWeek"
  | "timeGridWeek"
  | "dayGridMonth"

export const CALENDAR_VIEW_LABELS: Record<CalendarView, string> = {
  timeGridDay: "Day",
  timeGridThreeDay: "3 days",
  timeGridWorkWeek: "Work week",
  timeGridWeek: "Week",
  dayGridMonth: "Month",
}

export const CALENDAR_CUSTOM_VIEWS = {
  timeGridWorkWeek: {
    type: "timeGrid",
    duration: { weeks: 1 },
    weekends: false,
  },
  timeGridThreeDay: {
    type: "timeGrid",
    duration: { days: 3 },
  },
} as const
