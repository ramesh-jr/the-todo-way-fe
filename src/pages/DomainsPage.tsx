import { useEffect, useMemo } from "react"

import { DomainCard } from "@/components/domains/DomainCard"
import { useDomainStore } from "@/stores/domainStore"
import { useItemStore } from "@/stores/itemStore"
import type { Domain, Priority } from "@/types"

export default function DomainsPage() {
  const dashboard = useDomainStore((s) => s.dashboard)
  const domains = useDomainStore((s) => s.domains)
  const priorities = useDomainStore((s) => s.priorities)
  const fetchDashboard = useDomainStore((s) => s.fetchDashboard)
  const fetchDomains = useDomainStore((s) => s.fetchDomains)
  const fetchPriorities = useDomainStore((s) => s.fetchPriorities)
  const fetchItems = useItemStore((s) => s.fetchItems)

  useEffect(() => {
    void fetchDashboard()
    void fetchDomains()
    void fetchPriorities()
    void fetchItems()
  }, [fetchDashboard, fetchDomains, fetchPriorities, fetchItems])

  const domainById = useMemo(() => {
    const map = new Map<string, Domain>()
    for (const d of domains) map.set(d.id, d)
    return map
  }, [domains])

  const focusPriorities = useMemo<Priority[]>(() => {
    if (!dashboard) return []
    return dashboard.focus_priorities
      .map((id) => priorities.find((p) => p.id === id))
      .filter((p): p is Priority => Boolean(p))
  }, [dashboard, priorities])

  const maintenanceDomains = useMemo<Domain[]>(() => {
    if (!dashboard) return []
    return dashboard.maintenance_domains
      .map((id) => domainById.get(id))
      .filter((d): d is Domain => Boolean(d))
  }, [dashboard, domainById])

  const pausedDomains = useMemo<Domain[]>(() => {
    if (!dashboard) return []
    return dashboard.paused_domains
      .map((id) => domainById.get(id))
      .filter((d): d is Domain => Boolean(d))
  }, [dashboard, domainById])

  if (!dashboard) {
    return (
      <div className="mx-auto max-w-5xl p-4 sm:p-6">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    )
  }

  const hasIntentional =
    maintenanceDomains.length > 0 || pausedDomains.length > 0

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-6 overflow-x-hidden p-4 pb-8 sm:space-y-8 sm:p-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Domains</h1>
        <p className="text-muted-foreground text-sm">
          A calm read on your life — not a scorecard.
        </p>
      </header>

      <section className="min-w-0 space-y-3">
        <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          What you chose to focus on
        </h2>
        <p className="text-base break-words">
          {dashboard.recent_wins > 0
            ? `${dashboard.recent_wins} ${
                dashboard.recent_wins === 1 ? "win" : "wins"
              } this week — well done.`
            : "A quiet week so far. Small steps count."}
        </p>
        {focusPriorities.length > 0 ? (
          <ul className="space-y-2">
            {focusPriorities.map((priority) => {
              const dom = priority.domain_id
                ? domainById.get(priority.domain_id)
                : undefined
              return (
                <li
                  key={priority.id}
                  className="flex min-w-0 items-start gap-2 text-sm"
                >
                  {dom && (
                    <span
                      aria-hidden
                      className="mt-1.5 inline-block size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: dom.color }}
                    />
                  )}
                  <span className="min-w-0 break-words">{priority.title}</span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            No priorities picked yet. Pick one or two when it feels right.
          </p>
        )}
      </section>

      {hasIntentional && (
        <section className="min-w-0 space-y-3">
          <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Intentional choices
          </h2>
          <ul className="space-y-2 text-sm">
            {maintenanceDomains.map((d) => (
              <li key={d.id} className="flex min-w-0 items-start gap-2">
                <span
                  aria-hidden
                  className="mt-1.5 inline-block size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                <span className="min-w-0 break-words">
                  <span className="font-medium">{d.name}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    — on maintenance, a conscious choice.
                  </span>
                </span>
              </li>
            ))}
            {pausedDomains.map((d) => (
              <li key={d.id} className="flex min-w-0 items-start gap-2">
                <span
                  aria-hidden
                  className="mt-1.5 inline-block size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                <span className="min-w-0 break-words">
                  <span className="font-medium">{d.name}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    — paused, a conscious choice.
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="min-w-0 space-y-3">
        <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Your domains
        </h2>
        {dashboard.domains.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Add a domain when you're ready.
          </p>
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            {dashboard.domains.map((card) => (
              <div key={card.domain.id} className="min-w-0">
                <DomainCard card={card} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
