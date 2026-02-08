// ============================================================
// MiniCalendar — Left-panel date picker for CalendarPage
// Uses shadcn Calendar (react-day-picker) to select a date,
// which navigates the main FullCalendar view.
// Ref: docs/build-guide.md FE-7
// ============================================================

import { Calendar } from "@/components/ui/calendar"

interface MiniCalendarProps {
  /** Currently selected / focused date */
  selectedDate: Date
  /** Called when the user clicks a date in the mini calendar */
  onDateSelect: (date: Date) => void
}

export function MiniCalendar({ selectedDate, onDateSelect }: MiniCalendarProps) {
  return (
    <div className="flex flex-col items-center">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => {
          if (date) onDateSelect(date)
        }}
        className="rounded-lg border border-border bg-card p-3"
      />
    </div>
  )
}
