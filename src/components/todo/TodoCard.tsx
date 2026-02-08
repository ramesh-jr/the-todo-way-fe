// ============================================================
// TodoCard — Displays a single todo with priority indicator,
// completion toggle, and conditional meta fields.
// Ref: docs/lld-frontend.md §4 (TodoCard)
// ============================================================

import { useMemo } from "react"
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Flag,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useTodoStore } from "@/stores/todoStore"
import { useUIStore } from "@/stores/uiStore"
import type { Todo } from "@/types/todo"

// Priority → left-border color (LLD §5)
const PRIORITY_BORDER: Record<string, string> = {
  p1: "border-l-red-500",
  p2: "border-l-orange-500",
  p3: "border-l-blue-500",
  p4: "border-l-slate-400",
}

const PRIORITY_ICON_COLOR: Record<string, string> = {
  p1: "text-red-500",
  p2: "text-orange-500",
  p3: "text-blue-500",
  p4: "text-slate-400",
}

// ─── Formatting helpers ─────────────────────────────────

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// ─── Component ───────────────────────────────────────────

interface TodoCardProps {
  todo: Todo
  draggable?: boolean
}

export function TodoCard({ todo, draggable = false }: TodoCardProps) {
  const displayFields = useUIStore((s) => s.todoCardDisplayFields)
  const openTodoDetail = useUIStore((s) => s.openTodoDetail)
  const toggleComplete = useTodoStore((s) => s.toggleComplete)

  // FullCalendar Draggable data-* attributes (LLD §4)
  const dragAttrs = useMemo(() => {
    if (!draggable) return {}
    const dur = todo.duration_minutes ?? 30
    const hh = String(Math.floor(dur / 60)).padStart(2, "0")
    const mm = String(dur % 60).padStart(2, "0")
    return {
      "data-event": JSON.stringify({
        title: todo.title,
        duration: `${hh}:${mm}`,
      }),
      "data-todo-id": todo.id,
    }
  }, [draggable, todo.id, todo.title, todo.duration_minutes])

  const hasMeta =
    (displayFields.showDate && todo.scheduled_date) ||
    (displayFields.showDeadline && todo.deadline_date) ||
    (displayFields.showDuration && todo.duration_minutes != null) ||
    (displayFields.showLabels && todo.labels.length > 0)

  return (
    <div
      className={cn(
        "todo-card group relative flex items-start gap-3 rounded-lg border border-l-[3px] bg-card p-3 shadow-xs transition-colors hover:bg-accent/50 cursor-pointer",
        PRIORITY_BORDER[todo.priority],
        todo.is_completed && "opacity-60",
      )}
      onClick={() => openTodoDetail(todo.id)}
      {...dragAttrs}
    >
      {/* Completion toggle */}
      <button
        type="button"
        className="mt-0.5 shrink-0"
        onClick={(e) => {
          e.stopPropagation()
          toggleComplete(todo.id)
        }}
        aria-label={todo.is_completed ? "Mark incomplete" : "Mark complete"}
      >
        {todo.is_completed ? (
          <CheckCircle2 className="size-[18px] text-primary" />
        ) : (
          <Circle
            className={cn("size-[18px]", PRIORITY_ICON_COLOR[todo.priority])}
          />
        )}
      </button>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span
          className={cn(
            "text-sm font-medium leading-tight truncate",
            todo.is_completed && "line-through text-muted-foreground",
          )}
        >
          {todo.title}
        </span>

        {hasMeta && (
          <div className="flex flex-wrap items-center gap-2">
            {displayFields.showDate && todo.scheduled_date && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="size-3" />
                {formatShortDate(todo.scheduled_date)}
              </span>
            )}

            {displayFields.showDeadline && todo.deadline_date && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Flag className="size-3" />
                {formatShortDate(todo.deadline_date)}
              </span>
            )}

            {displayFields.showDuration && todo.duration_minutes != null && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3" />
                {formatDuration(todo.duration_minutes)}
              </span>
            )}

            {displayFields.showLabels &&
              todo.labels.map((label) => (
                <span
                  key={label.id}
                  className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: `${label.color}20`,
                    color: label.color,
                  }}
                >
                  {label.name}
                </span>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
