// ============================================================
// Energy & context controls — reused in clarify, detail, and Today's filter.
// ============================================================

import { cn } from "@/lib/utils"
import { CONTEXT_TAGS, type Energy } from "@/types"

const ENERGY_OPTIONS: { value: Energy; label: string; dot: string }[] = [
  { value: "low", label: "Low", dot: "bg-emerald-500" },
  { value: "medium", label: "Medium", dot: "bg-amber-500" },
  { value: "high", label: "High", dot: "bg-rose-500" },
]

const ENERGY_DOT: Record<Energy, string> = {
  low: "bg-emerald-500",
  medium: "bg-amber-500",
  high: "bg-rose-500",
}

export function EnergyDot({ energy }: { energy: Energy | null }) {
  if (!energy) return null
  return (
    <span
      className={cn("inline-block size-2 rounded-full", ENERGY_DOT[energy])}
      title={`${energy} energy`}
    />
  )
}

export function EnergySelect({
  value,
  onChange,
  allowClear = true,
}: {
  value: Energy | null
  onChange: (energy: Energy | null) => void
  allowClear?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ENERGY_OPTIONS.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(allowClear && active ? null : opt.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
              active
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            <span className={cn("size-2 rounded-full", opt.dot)} />
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function ContextTags({
  value,
  onChange,
}: {
  value: string[]
  onChange: (tags: string[]) => void
}) {
  function toggle(tag: string) {
    onChange(value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag])
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {CONTEXT_TAGS.map((tag) => {
        const active = value.includes(tag)
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs transition-colors",
              active
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            {tag}
          </button>
        )
      })}
    </div>
  )
}
