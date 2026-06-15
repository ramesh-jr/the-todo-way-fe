import { cn } from "@/lib/utils"
import type { DomainSignal } from "@/types"

interface SignalPillProps {
  signal: DomainSignal
}

const SIGNAL_STYLES: Record<
  Exclude<DomainSignal, "none">,
  { label: string; className: string }
> = {
  on_track: {
    label: "On track",
    className: "text-emerald-600 bg-emerald-500/10",
  },
  needs_attention: {
    label: "Could use attention",
    className: "text-amber-600 bg-amber-500/10",
  },
  paused: {
    label: "Paused",
    className: "text-muted-foreground bg-secondary",
  },
}

export function SignalPill({ signal }: SignalPillProps) {
  if (signal === "none") return null
  const { label, className } = SIGNAL_STYLES[signal]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        className,
      )}
    >
      {label}
    </span>
  )
}
