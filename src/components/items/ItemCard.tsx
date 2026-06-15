// ============================================================
// ItemCard — one item across all surfaces.
// Tasks (mine) get a complete toggle; events (commitments) render distinctly.
// ============================================================

import { useMemo } from "react"
import { Calendar, CalendarClock, CheckCircle2, Circle, Clock } from "lucide-react"

import { formatAge, formatShortDate, formatTime } from "@/lib/dates"
import { cn } from "@/lib/utils"
import { useDomainStore } from "@/stores/domainStore"
import { useItemStore } from "@/stores/itemStore"
import { useUIStore } from "@/stores/uiStore"
import type { Item } from "@/types"

import { EnergyDot } from "./EnergyContext"

interface ItemCardProps {
  item: Item
  /** Make the card draggable onto FullCalendar (Today / Inbox panels). */
  draggable?: boolean
  /** Show the inbox age chip (Inbox surface). */
  showAge?: boolean
  onClick?: (item: Item) => void
}

export function ItemCard({ item, draggable = false, showAge = false, onClick }: ItemCardProps) {
  const domains = useDomainStore((s) => s.domains)
  const toggleComplete = useItemStore((s) => s.toggleComplete)
  const openItemDetail = useUIStore((s) => s.openItemDetail)

  const domain = domains.find((d) => d.id === item.domain_id) ?? null
  const isEvent = item.kind === "event"
  const isDone = item.status === "done"

  const dragAttrs = useMemo(() => {
    if (!draggable) return {}
    const dur = item.duration_minutes ?? 30
    const hh = String(Math.floor(dur / 60)).padStart(2, "0")
    const mm = String(dur % 60).padStart(2, "0")
    return {
      "data-event": JSON.stringify({ title: item.title, duration: `${hh}:${mm}` }),
      "data-item-id": item.id,
    }
  }, [draggable, item.id, item.title, item.duration_minutes])

  return (
    <div
      className={cn(
        "ttw-item-card group relative flex items-start gap-3 rounded-lg border bg-card p-3 shadow-xs transition-colors hover:bg-accent/50 cursor-pointer",
        isEvent ? "border-l-[3px] border-l-sky-500" : "border-l-[3px]",
        !isEvent && {
          "border-l-indigo-500": item.urgency === "high",
          "border-l-slate-400": item.urgency === "normal",
          "border-l-slate-300": item.urgency === "low",
        },
        isDone && "opacity-60",
      )}
      style={
        domain && !isEvent && item.urgency !== "high"
          ? { borderLeftColor: domain.color }
          : undefined
      }
      onClick={() => (onClick ? onClick(item) : openItemDetail(item.id))}
      {...dragAttrs}
    >
      {isEvent ? (
        <CalendarClock className="mt-0.5 size-[18px] shrink-0 text-sky-500" />
      ) : (
        <button
          type="button"
          className="mt-0.5 shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            void toggleComplete(item.id)
          }}
          aria-label={isDone ? "Mark not done" : "Mark done"}
        >
          {isDone ? (
            <CheckCircle2 className="size-[18px] text-primary" />
          ) : (
            <Circle className="size-[18px] text-muted-foreground hover:text-primary" />
          )}
        </button>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span
          className={cn(
            "truncate text-sm font-medium leading-tight",
            isDone && "text-muted-foreground line-through",
          )}
        >
          {item.title}
        </span>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {domain && (
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full" style={{ backgroundColor: domain.color }} />
              {domain.name}
            </span>
          )}
          {item.scheduled_at && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3" />
              {isEvent ? formatTime(item.scheduled_at) : formatShortDate(item.scheduled_at)}
            </span>
          )}
          {item.duration_minutes != null && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {item.duration_minutes}m
            </span>
          )}
          <EnergyDot energy={item.energy} />
          {item.context.map((tag) => (
            <span key={tag} className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px]">
              {tag}
            </span>
          ))}
          {showAge && item.status === "inbox" && (
            <span className="ml-auto text-[11px] text-muted-foreground/80">
              {formatAge(item.created_at)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
