import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router"

import { ReflectionDialog } from "@/components/domains/ReflectionDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useDomainStore } from "@/stores/domainStore"
import { useItemStore } from "@/stores/itemStore"
import { useReviewStore } from "@/stores/reviewStore"

type Confirmation = "completed" | "deferred" | null

interface ReflectionTarget {
  open: boolean
  domainId: string | null
  domainName: string
  standardId: string | null
}

const INITIAL_REFLECTION: ReflectionTarget = {
  open: false,
  domainId: null,
  domainName: "",
  standardId: null,
}

export default function ReviewPage() {
  const status = useReviewStore((s) => s.status)
  const fetchStatus = useReviewStore((s) => s.fetchStatus)
  const completeReview = useReviewStore((s) => s.completeReview)
  const deferReview = useReviewStore((s) => s.deferReview)

  const domains = useDomainStore((s) => s.domains)
  const priorities = useDomainStore((s) => s.priorities)
  const fetchDomains = useDomainStore((s) => s.fetchDomains)
  const fetchPriorities = useDomainStore((s) => s.fetchPriorities)
  const createPriority = useDomainStore((s) => s.createPriority)
  const setPriorityStatus = useDomainStore((s) => s.setPriorityStatus)

  const items = useItemStore((s) => s.items)
  const fetchItems = useItemStore((s) => s.fetchItems)

  const [reflection, setReflection] = useState<ReflectionTarget>(INITIAL_REFLECTION)
  const [newPriority, setNewPriority] = useState("")
  const [deferReason, setDeferReason] = useState("")
  const [confirmation, setConfirmation] = useState<Confirmation>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void fetchStatus()
    void fetchDomains()
    void fetchPriorities()
    void fetchItems()
  }, [fetchStatus, fetchDomains, fetchPriorities, fetchItems])

  const inboxCount = useMemo(
    () => items.filter((i) => i.status === "inbox").length,
    [items],
  )

  const reflectableDomains = useMemo(
    () =>
      domains.filter(
        (d) =>
          d.season !== "paused" &&
          (d.reflection_only ||
            d.standards.some((s) => s.kind === "reflection" && s.active)),
      ),
    [domains],
  )

  const activePriorities = useMemo(
    () => priorities.filter((p) => p.status === "active"),
    [priorities],
  )

  const openReflectionFor = (domainId: string, domainName: string) => {
    const dom = domains.find((d) => d.id === domainId)
    const reflStandard = dom?.standards.find(
      (s) => s.kind === "reflection" && s.active,
    )
    setReflection({
      open: true,
      domainId,
      domainName,
      standardId: reflStandard?.id ?? null,
    })
  }

  const handleReflectionOpenChange = (open: boolean) => {
    setReflection((prev) =>
      open ? { ...prev, open: true } : { ...INITIAL_REFLECTION },
    )
  }

  const handleComplete = async () => {
    setSubmitting(true)
    try {
      await completeReview("weekly")
      setConfirmation("completed")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDefer = async () => {
    setSubmitting(true)
    try {
      await deferReview(
        "weekly",
        deferReason.trim() ? deferReason.trim() : undefined,
      )
      setConfirmation("deferred")
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddPriority = async () => {
    const title = newPriority.trim()
    if (!title) return
    await createPriority({ title })
    setNewPriority("")
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Weekly review</h1>
        <p className="text-muted-foreground text-sm">
          A few quiet minutes to notice what mattered. Skip what you like.
        </p>
      </header>

      {status?.long_gap && (
        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              It's been a little while. Try a gentle 2-minute reset — no
              pressure to do all the steps.
            </p>
          </CardContent>
        </Card>
      )}

      {status?.deferred_reason && (
        <p className="text-muted-foreground text-sm">
          You deferred last time: “{status.deferred_reason}”
        </p>
      )}

      <ol className="space-y-6">
        <li className="space-y-2">
          <h3 className="font-medium">1. Clear the inbox</h3>
          {inboxCount > 0 ? (
            <p className="text-sm">
              {inboxCount} item{inboxCount === 1 ? "" : "s"} waiting —{" "}
              <Link
                to="/inbox"
                className="text-primary underline-offset-4 hover:underline"
              >
                open the inbox
              </Link>
              .
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              Inbox is clear. Lovely.
            </p>
          )}
        </li>

        <li className="space-y-2">
          <h3 className="font-medium">2. Reflect on your domains</h3>
          {reflectableDomains.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nothing waiting right now.
            </p>
          ) : (
            <ul className="space-y-2">
              {reflectableDomains.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-block size-2.5 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    {d.name}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openReflectionFor(d.id, d.name)}
                  >
                    Reflect
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </li>

        <li className="space-y-3">
          <h3 className="font-medium">3. Set this week's priorities</h3>
          {activePriorities.length > 0 ? (
            <ul className="space-y-2">
              {activePriorities.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span>{p.title}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      void setPriorityStatus(p.id, "done")
                    }}
                  >
                    Mark done
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">
              No priorities yet. Pick one or two that feel right.
            </p>
          )}
          <div className="flex gap-2">
            <Input
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              placeholder="One thing that matters this week…"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  void handleAddPriority()
                }
              }}
            />
            <Button
              variant="outline"
              onClick={() => {
                void handleAddPriority()
              }}
              disabled={!newPriority.trim()}
            >
              Add
            </Button>
          </div>
        </li>
      </ol>

      <div className="space-y-4 border-t pt-6">
        <Button
          onClick={() => {
            void handleComplete()
          }}
          disabled={submitting}
        >
          Complete review
        </Button>

        <div className="space-y-2">
          <Label
            htmlFor="defer-reason"
            className="text-muted-foreground font-normal"
          >
            Not now? That's okay — leave a note for future you.
          </Label>
          <Textarea
            id="defer-reason"
            value={deferReason}
            onChange={(e) => setDeferReason(e.target.value)}
            placeholder="Optional reason"
            rows={2}
          />
          <Button
            variant="ghost"
            onClick={() => {
              void handleDefer()
            }}
            disabled={submitting}
          >
            Defer
          </Button>
        </div>

        {confirmation === "completed" && (
          <p className="text-sm text-emerald-600">
            Saved. Thanks for taking a moment.
          </p>
        )}
        {confirmation === "deferred" && (
          <p className="text-muted-foreground text-sm">
            Got it — we'll check back another time.
          </p>
        )}
      </div>

      {reflection.domainId && (
        <ReflectionDialog
          domainId={reflection.domainId}
          domainName={reflection.domainName}
          standardId={reflection.standardId}
          open={reflection.open}
          onOpenChange={handleReflectionOpenChange}
        />
      )}
    </div>
  )
}
