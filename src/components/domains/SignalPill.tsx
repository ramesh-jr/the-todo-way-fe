import { cn } from "@/lib/utils"
import type { DomainSignal } from "@/types"

interface SignalPillProps {
  signal: DomainSignal
}

const SIGNAL_STYLES: Record<
  Exclude<DomainSignal, "none">,
  { short: string; label: string; className: string }
> = {
  on_track: {
    short: "On track",
    label: "On track",
    className: "text-emerald-600 bg-emerald-500/10",
  },
  needs_attention: {
    short: "Attention",
    label: "Could use attention",
    className: "text-amber-600 bg-amber-500/10",
  },
  paused: {
    short: "Paused",
    label: "Paused",
    className: "text-muted-foreground bg-secondary",
  },
}

export function SignalPill({ signal }: SignalPillProps) {
  if (signal === "none") return null
  const { short, label, className } = SIGNAL_STYLES[signal]
  return (
    <span
      className={cn(
        "inline-flex max-w-full shrink-0 items-center self-start rounded-full px-2 py-0.5 text-xs font-medium",
        className,
      )}
      title={label}
    >
      <span className="sm:hidden">{short}</span>
      <span className="hidden sm:inline">{label}</span>
    </span>
  )
}
