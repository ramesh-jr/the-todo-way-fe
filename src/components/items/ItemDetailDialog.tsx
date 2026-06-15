// ============================================================
// ItemDetailDialog — view & edit any item (driven by uiStore.selectedItemId).
// ============================================================

import { useEffect, useState } from "react"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useDomainStore } from "@/stores/domainStore"
import { useItemStore } from "@/stores/itemStore"
import { useUIStore } from "@/stores/uiStore"
import type { Energy, Urgency } from "@/types"

import { ContextTags, EnergySelect } from "./EnergyContext"

const NONE = "__none__"

export function ItemDetailDialog() {
  const itemId = useUIStore((s) => s.selectedItemId)
  const close = useUIStore((s) => s.closeItemDetail)

  const items = useItemStore((s) => s.items)
  const updateItem = useItemStore((s) => s.updateItem)
  const removeItem = useItemStore((s) => s.removeItem)
  const domains = useDomainStore((s) => s.domains)

  const item = items.find((i) => i.id === itemId) ?? null

  const [title, setTitle] = useState("")
  const [notes, setNotes] = useState("")
  const [domainId, setDomainId] = useState<string>(NONE)
  const [energy, setEnergy] = useState<Energy | null>(null)
  const [context, setContext] = useState<string[]>([])
  const [urgency, setUrgency] = useState<Urgency>("normal")

  // Sync the editable form to the selected item when the dialog opens.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (item) {
      setTitle(item.title)
      setNotes(item.notes ?? "")
      setDomainId(item.domain_id ?? NONE)
      setEnergy(item.energy)
      setContext(item.context)
      setUrgency(item.urgency)
    }
  }, [item])
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!item) return null

  const isEvent = item.kind === "event"

  async function handleSave() {
    await updateItem(item!.id, {
      title: title.trim() || item!.title,
      notes: notes || null,
      domain_id: domainId === NONE ? null : domainId,
      energy,
      context,
      urgency,
    })
    close()
  }

  return (
    <Dialog open={!!itemId} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEvent ? "Event" : "Item"}</DialogTitle>
        </DialogHeader>

        {isEvent && (
          <p className="rounded-md bg-sky-500/10 px-3 py-2 text-xs text-muted-foreground">
            This is a synced calendar event — a commitment, not a task. Edit it in its source
            calendar.
          </p>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="detail-title">Title</Label>
            <Input
              id="detail-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isEvent}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="detail-notes">Notes</Label>
            <Textarea
              id="detail-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isEvent}
            />
          </div>

          {!isEvent && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Domain</Label>
                  <Select value={domainId} onValueChange={setDomainId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Domain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>No domain</SelectItem>
                      {domains.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Urgency</Label>
                  <Select value={urgency} onValueChange={(v) => setUrgency(v as Urgency)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Energy</Label>
                <EnergySelect value={energy} onChange={setEnergy} />
              </div>

              <div className="space-y-1.5">
                <Label>Context</Label>
                <ContextTags value={context} onChange={setContext} />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void removeItem(item.id).then(close)}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
          {!isEvent && (
            <Button type="button" onClick={() => void handleSave()}>
              Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
