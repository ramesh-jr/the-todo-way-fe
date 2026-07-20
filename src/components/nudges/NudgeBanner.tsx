// ============================================================
// NudgeBanner — at most one calm, dismissible nudge. Never guilt, never streaks.
// Honors rate-limiting (uiStore.dismissedNudges) and links to the relevant surface.
// ============================================================

import { useEffect } from "react"
import { useNavigate } from "react-router"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useReviewStore } from "@/stores/reviewStore"
import { useUIStore } from "@/stores/uiStore"
import type { NudgeKind } from "@/types"

const NUDGE_TARGET: Record<NudgeKind, string> = {
  weekly_review: "/review",
  unclarified_inbox: "/inbox",
  overcommitment: "/calendar",
  someday_decay: "/inbox",
}

export function NudgeBanner() {
  const nudges = useReviewStore((s) => s.nudges)
  const fetchNudges = useReviewStore((s) => s.fetchNudges)
  const dismissNudge = useUIStore((s) => s.dismissNudge)
  const isNudgeDismissed = useUIStore((s) => s.isNudgeDismissed)
  const navigate = useNavigate()

  useEffect(() => {
    void fetchNudges()
  }, [fetchNudges])

  const primary = nudges?.primary
  if (!primary || isNudgeDismissed(primary.kind)) return null

  return (
    <div
      className={cn(
        "mx-auto mb-4 flex max-w-3xl items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-3 sm:items-center sm:gap-3 sm:px-4",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{primary.title}</p>
        <p className="text-xs text-muted-foreground">{primary.message}</p>
        <Button
          size="sm"
          variant="outline"
          className="mt-2 sm:hidden"
          onClick={() => navigate(NUDGE_TARGET[primary.kind])}
        >
          Take a look
        </Button>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="hidden shrink-0 sm:inline-flex"
        onClick={() => navigate(NUDGE_TARGET[primary.kind])}
      >
        Take a look
      </Button>
      <button
        type="button"
        className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-accent"
        onClick={() => dismissNudge(primary.kind)}
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
