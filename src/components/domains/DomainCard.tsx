import { useEffect, useState } from "react"

import { ReflectionDialog } from "@/components/domains/ReflectionDialog"
import { SeasonControl } from "@/components/domains/SeasonControl"
import { SignalPill } from "@/components/domains/SignalPill"
import { TrendSparkline } from "@/components/domains/TrendSparkline"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDomainStore } from "@/stores/domainStore"
import type {
  DomainCard as DomainCardData,
  DomainSignal,
  TrendPoint,
} from "@/types"

interface DomainCardProps {
  card: DomainCardData
}

interface ReflectionTarget {
  open: boolean
  standardId: string | null
}

export function DomainCard({ card }: DomainCardProps) {
  const { domain, standard_signals, needs_reflection, recent_wins } = card
  const getTrend = useDomainStore((s) => s.getTrend)

  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [reflection, setReflection] = useState<ReflectionTarget>({
    open: false,
    standardId: null,
  })

  const reflectionStandards = domain.standards.filter(
    (s) => s.kind === "reflection" && s.active,
  )
  const countableSignals = standard_signals.filter((sig) => {
    const standard = domain.standards.find((s) => s.id === sig.standard_id)
    return standard?.kind === "countable"
  })

  const showReflectionSection =
    domain.reflection_only || reflectionStandards.length > 0
  const showCountableSection =
    !domain.reflection_only && countableSignals.length > 0

  useEffect(() => {
    if (!showReflectionSection) return
    let cancelled = false
    void getTrend(domain.id).then((points) => {
      if (!cancelled) setTrend(points)
    })
    return () => {
      cancelled = true
    }
  }, [domain.id, showReflectionSection, getTrend])

  const openReflectionFor = (standardId: string | null) => {
    setReflection({ open: true, standardId })
  }

  const handleReflectionOpenChange = (open: boolean) => {
    setReflection((prev) =>
      open ? { ...prev, open: true } : { open: false, standardId: null },
    )
  }

  const pillSignal = (sig: DomainSignal): DomainSignal =>
    domain.season === "paused" ? "paused" : sig

  return (
    <>
      <Card className="min-w-0 gap-4 overflow-hidden py-4 sm:gap-6 sm:py-6">
        <CardHeader className="px-4 sm:px-6">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <CardTitle className="flex min-w-0 items-center gap-2 text-base">
              <span
                aria-hidden
                className="inline-block size-3 shrink-0 rounded-full"
                style={{ backgroundColor: domain.color }}
              />
              <span className="truncate">{domain.name}</span>
            </CardTitle>
            <SeasonControl domainId={domain.id} season={domain.season} />
          </div>
        </CardHeader>

        <CardContent className="space-y-5 px-4 sm:px-6">
          {recent_wins > 0 && (
            <p className="text-muted-foreground text-sm">
              {recent_wins} done this week — nicely paced.
            </p>
          )}

          {showReflectionSection && (
            <div className="space-y-3">
              <TrendSparkline points={trend} />
              <ul className="space-y-3">
                {reflectionStandards.length > 0
                  ? reflectionStandards.map((standard) => (
                      <li
                        key={standard.id}
                        className="flex min-w-0 flex-col gap-1.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                      >
                        <span className="text-foreground min-w-0 break-words">
                          {standard.text}
                        </span>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="self-start shrink-0"
                          onClick={() => openReflectionFor(standard.id)}
                        >
                          Reflect
                        </Button>
                      </li>
                    ))
                  : (
                      <li className="flex min-w-0 flex-col gap-1.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                        <span className="text-muted-foreground min-w-0 break-words">
                          How is this season feeling?
                        </span>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="self-start shrink-0"
                          onClick={() => openReflectionFor(null)}
                        >
                          Reflect
                        </Button>
                      </li>
                    )}
              </ul>
            </div>
          )}

          {showCountableSection && (
            <ul className="space-y-3">
              {countableSignals.map((sig) => (
                <li
                  key={sig.standard_id}
                  className="flex min-w-0 flex-col gap-1.5 text-sm sm:flex-row sm:items-start sm:justify-between sm:gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="break-words">{sig.text}</p>
                    {sig.target !== null && sig.cadence && (
                      <p className="text-muted-foreground text-xs">
                        {sig.recent_count}/{sig.target} this {sig.cadence
                          .replace("daily", "day")
                          .replace("weekly", "week")
                          .replace("monthly", "month")}
                      </p>
                    )}
                  </div>
                  <SignalPill signal={pillSignal(sig.signal)} />
                </li>
              ))}
            </ul>
          )}

          {needs_reflection && (
            <div className="flex min-w-0 flex-col gap-2 rounded-md border border-dashed px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <p className="text-muted-foreground min-w-0 text-sm break-words">
                A reflection is waiting when you have a moment.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="self-start shrink-0"
                onClick={() => openReflectionFor(null)}
              >
                Reflect
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ReflectionDialog
        domainId={domain.id}
        domainName={domain.name}
        standardId={reflection.standardId}
        open={reflection.open}
        onOpenChange={handleReflectionOpenChange}
      />
    </>
  )
}
