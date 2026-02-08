// ============================================================
// CalendarToolbar — View switcher + Today / Prev / Next
// Replaces FullCalendar's default header toolbar with a
// styled toolbar using shadcn/ui Button components.
// Ref: docs/build-guide.md FE-7
// ============================================================

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/uiStore"
import type { CalendarView } from "@/types/todo"

import { Button } from "@/components/ui/button"

// ─── View options ───────────────────────────────────────────

const VIEW_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: "timeGridDay", label: "Day" },
  { value: "timeGridThreeDay", label: "3-Day" },
  { value: "timeGridWorkWeek", label: "Work Week" },
  { value: "timeGridWeek", label: "Week" },
  { value: "dayGridMonth", label: "Month" },
]

// ─── Props ──────────────────────────────────────────────────

interface CalendarToolbarProps {
  /** Title shown in the toolbar, e.g. "February 2026" */
  title: string
  /** Navigate to today */
  onToday: () => void
  /** Navigate to previous period */
  onPrev: () => void
  /** Navigate to next period */
  onNext: () => void
}

// ─── Component ──────────────────────────────────────────────

export function CalendarToolbar({
  title,
  onToday,
  onPrev,
  onNext,
}: CalendarToolbarProps) {
  const calendarView = useUIStore((s) => s.calendarView)
  const setCalendarView = useUIStore((s) => s.setCalendarView)

  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-2">
      {/* Left: navigation */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onToday}>
          Today
        </Button>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onPrev}
            aria-label="Previous"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onNext}
            aria-label="Next"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>

      {/* Right: view switcher */}
      <div className="flex items-center rounded-lg border border-border bg-muted p-0.5">
        {VIEW_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 rounded-md px-3 text-xs font-medium transition-colors",
              calendarView === opt.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setCalendarView(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
