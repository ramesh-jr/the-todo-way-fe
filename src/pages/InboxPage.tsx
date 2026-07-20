// ============================================================
// InboxPage — the clarify surface. Calm, age-aware, never a guilt counter.
// ============================================================

import { useEffect, useMemo } from "react"
import { Inbox, Plus } from "lucide-react"

import { ItemCard } from "@/components/items/ItemCard"
import { Button } from "@/components/ui/button"
import { useItemStore } from "@/stores/itemStore"
import { useUIStore } from "@/stores/uiStore"

export default function InboxPage() {
  const items = useItemStore((s) => s.items)
  const fetchItems = useItemStore((s) => s.fetchItems)
  const openClarify = useUIStore((s) => s.openClarify)
  const openCapture = useUIStore((s) => s.openCapture)

  useEffect(() => {
    void fetchItems()
  }, [fetchItems])

  const inboxItems = useMemo(
    () =>
      items
        .filter((i) => i.status === "inbox")
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [items],
  )

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-4 pb-8 sm:p-6">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Inbox className="size-5 shrink-0 text-primary" />
        <h1 className="text-lg font-semibold sm:text-xl">Inbox</h1>
        <span className="text-sm text-muted-foreground">
          {inboxItems.length} waiting
        </span>
        <div className="flex-1" />
        <Button size="sm" onClick={openCapture} className="hidden sm:inline-flex">
          <Plus className="size-4" />
          Capture
        </Button>
      </header>

      {inboxItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted-foreground">
          <Inbox className="size-10 opacity-40" />
          <p className="text-sm">Inbox zero — your head is clear.</p>
          <Button size="sm" variant="outline" onClick={openCapture}>
            Capture something
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Tap an item to clarify it — pick a domain, set energy, or schedule it.
          </p>
          {inboxItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              showAge
              onClick={(it) => openClarify(it.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
