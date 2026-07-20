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
import type { CalendarView } from "@/lib/calendarViews"
import { useUIStore } from "@/stores/uiStore"

import { Button } from "@/components/ui/button"

// ─── View options ───────────────────────────────────────────

const VIEW_OPTIONS: { value: CalendarView; label: string; short: string; desktopOnly?: boolean }[] = [
  { value: "timeGridDay", label: "Day", short: "Day" },
  { value: "timeGridThreeDay", label: "3-Day", short: "3D" },
  { value: "timeGridWorkWeek", label: "Work Week", short: "Work", desktopOnly: true },
  { value: "timeGridWeek", label: "Week", short: "Week" },
  { value: "dayGridMonth", label: "Month", short: "Mo" },
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
    <div className="flex flex-col gap-2 border-b border-border px-3 py-2 sm:px-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onToday} className="shrink-0">
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
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold sm:text-base">
          {title}
        </h2>
      </div>

      <div className="flex items-center overflow-x-auto rounded-lg border border-border bg-muted p-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {VIEW_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 shrink-0 rounded-md px-2.5 text-xs font-medium transition-colors sm:px-3",
              opt.desktopOnly && "hidden sm:inline-flex",
              calendarView === opt.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setCalendarView(opt.value)}
          >
            <span className="sm:hidden">{opt.short}</span>
            <span className="hidden sm:inline">{opt.label}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
