// ============================================================
// EnergyContextFilter — compact control row that drives uiStore.energyFilter.
// Lets the user narrow "Available now" by energy, time, and context.
// ============================================================

import { EnergySelect } from "@/components/items/EnergyContext"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/uiStore"
import { CONTEXT_TAGS } from "@/types"

const MINUTE_OPTIONS: { value: number | null; label: string }[] = [
  { value: 15, label: "15m" },
  { value: 30, label: "30m" },
  { value: 60, label: "1h" },
  { value: null, label: "Any" },
]

// A trimmed-down set keeps the row calm; the full set is still available via clarify.
const CONTEXT_CHOICES: readonly string[] = [
  CONTEXT_TAGS[0],
  CONTEXT_TAGS[1],
  CONTEXT_TAGS[2],
  CONTEXT_TAGS[5],
]

export function EnergyContextFilter() {
  const energyFilter = useUIStore((s) => s.energyFilter)
  const setEnergyFilter = useUIStore((s) => s.setEnergyFilter)
  const resetEnergyFilter = useUIStore((s) => s.resetEnergyFilter)

  const hasActive =
    energyFilter.energy !== null ||
    energyFilter.context !== null ||
    energyFilter.maxMinutes !== null

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-lg border border-border bg-card/50 px-3 py-3 sm:gap-x-5 sm:gap-y-3 sm:px-4">
      <span className="w-full text-sm text-muted-foreground sm:w-auto">
        What fits right now?
      </span>

      <div className="flex items-center gap-2">
        <EnergySelect
          value={energyFilter.energy}
          onChange={(energy) => setEnergyFilter({ energy })}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {MINUTE_OPTIONS.map((opt) => {
          const active = energyFilter.maxMinutes === opt.value
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => setEnergyFilter({ maxMinutes: opt.value })}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {CONTEXT_CHOICES.map((tag) => {
          const active = energyFilter.context === tag
          return (
            <button
              key={tag}
              type="button"
              onClick={() => setEnergyFilter({ context: active ? null : tag })}
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

      {hasActive && (
        <button
          type="button"
          onClick={resetEnergyFilter}
          className="ml-auto text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Clear
        </button>
      )}
    </div>
  )
}
