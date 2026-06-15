// ============================================================
// TodayPage — the calm default home.
// Leads with this week's focus, then "what fits right now", then today's agenda.
// ============================================================

import { useEffect, useMemo } from "react"

import { EnergyContextFilter } from "@/components/today/EnergyContextFilter"
import { ItemCard } from "@/components/items/ItemCard"
import { isToday } from "@/lib/dates"
import { fitsEnergyContext } from "@/lib/lifeLogic"
import { useDomainStore } from "@/stores/domainStore"
import { useItemStore } from "@/stores/itemStore"
import { useUIStore } from "@/stores/uiStore"

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
  )
}

export default function TodayPage() {
  const items = useItemStore((s) => s.items)
  const fetchItems = useItemStore((s) => s.fetchItems)
  const priorities = useDomainStore((s) => s.priorities)
  const domains = useDomainStore((s) => s.domains)
  const fetchPriorities = useDomainStore((s) => s.fetchPriorities)
  const energyFilter = useUIStore((s) => s.energyFilter)

  useEffect(() => {
    void fetchItems()
    void fetchPriorities()
  }, [fetchItems, fetchPriorities])

  const activePriorities = useMemo(
    () => priorities.filter((p) => p.status === "active"),
    [priorities],
  )

  const availableNow = useMemo(
    () =>
      items
        .filter((i) => i.status === "active")
        .filter((i) => fitsEnergyContext(i, energyFilter)),
    [items, energyFilter],
  )

  const todaysAgenda = useMemo(
    () =>
      items
        .filter((i) => i.status !== "done" && isToday(i.scheduled_at))
        .sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? "")),
    [items],
  )

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 p-6">
      <header>
        <h1 className="text-2xl font-bold">Today</h1>
        <p className="text-sm text-muted-foreground">{today}</p>
      </header>

      <section>
        <SectionLabel>This week&apos;s focus</SectionLabel>
        {activePriorities.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No priorities set yet — you can choose them during your weekly review.
          </p>
        ) : (
          <ul className="space-y-2">
            {activePriorities.map((p) => {
              const domain = domains.find((d) => d.id === p.domain_id)
              return (
                <li key={p.id} className="flex items-center gap-2 text-sm">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: domain?.color ?? "var(--muted-foreground)" }}
                  />
                  <span>{p.title}</span>
                  {domain && (
                    <span className="text-xs text-muted-foreground">· {domain.name}</span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section>
        <SectionLabel>What fits right now</SectionLabel>
        <EnergyContextFilter />
        <div className="mt-3 space-y-2">
          {availableNow.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing matches right now — enjoy the breather.
            </p>
          ) : (
            availableNow.map((item) => <ItemCard key={item.id} item={item} />)
          )}
        </div>
      </section>

      <section>
        <SectionLabel>On the calendar today</SectionLabel>
        <div className="space-y-2">
          {todaysAgenda.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your day is open.</p>
          ) : (
            todaysAgenda.map((item) => <ItemCard key={item.id} item={item} />)
          )}
        </div>
      </section>
    </div>
  )
}
