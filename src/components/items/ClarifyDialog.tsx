// ============================================================
// ClarifyDialog — the "clarify" step: turn an inbox capture into a filed action.
// Pick a domain, optionally a priority + energy/context + a time. Or drop / someday.
// ============================================================

import { useEffect, useState } from "react"
import { CalendarClock, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useDomainStore } from "@/stores/domainStore"
import { useItemStore } from "@/stores/itemStore"
import { useUIStore } from "@/stores/uiStore"
import type { Energy } from "@/types"

import { ContextTags, EnergySelect } from "./EnergyContext"

const NONE = "__none__"

export function ClarifyDialog() {
  const itemId = useUIStore((s) => s.clarifyItemId)
  const close = useUIStore((s) => s.closeClarify)

  const items = useItemStore((s) => s.items)
  const clarifyItem = useItemStore((s) => s.clarifyItem)
  const removeItem = useItemStore((s) => s.removeItem)
  const markSomeday = useItemStore((s) => s.markSomeday)

  const domains = useDomainStore((s) => s.domains)
  const priorities = useDomainStore((s) => s.priorities)

  const item = items.find((i) => i.id === itemId) ?? null

  const [domainId, setDomainId] = useState<string>(NONE)
  const [priorityId, setPriorityId] = useState<string>(NONE)
  const [energy, setEnergy] = useState<Energy | null>(null)
  const [context, setContext] = useState<string[]>([])
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")

  // Sync the form to the item being clarified when the dialog opens.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (item) {
      setDomainId(item.domain_id ?? NONE)
      setPriorityId(item.priority_id ?? NONE)
      setEnergy(item.energy)
      setContext(item.context)
      setDate(item.scheduled_at ? item.scheduled_at.slice(0, 10) : "")
      setTime(item.scheduled_at ? new Date(item.scheduled_at).toTimeString().slice(0, 5) : "")
    }
  }, [item])
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!item) return null

  const domainPriorities = priorities.filter(
    (p) => domainId === NONE || p.domain_id === domainId || p.domain_id === null,
  )

  async function handleSave() {
    let scheduledAt: string | null | undefined
    if (date) {
      const d = new Date(date)
      if (time) {
        const [h, m] = time.split(":").map(Number)
        d.setHours(h, m, 0, 0)
      } else {
        d.setHours(9, 0, 0, 0)
      }
      scheduledAt = d.toISOString()
    }
    await clarifyItem(item!.id, {
      domain_id: domainId === NONE ? null : domainId,
      priority_id: priorityId === NONE ? null : priorityId,
      energy,
      context,
      scheduled_at: scheduledAt,
    })
    close()
  }

  return (
    <Dialog open={!!itemId} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Clarify</DialogTitle>
          <DialogDescription className="truncate">{item.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Domain</Label>
            <Select value={domainId} onValueChange={setDomainId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Which part of life?" />
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
            <Label>This week's priority (optional)</Label>
            <Select value={priorityId} onValueChange={setPriorityId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tie to a priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {domainPriorities.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Energy</Label>
            <EnergySelect value={energy} onChange={setEnergy} />
          </div>

          <div className="space-y-1.5">
            <Label>Context</Label>
            <ContextTags value={context} onChange={setContext} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="clarify-date">Schedule (optional)</Label>
              <Input
                id="clarify-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clarify-time">Time</Label>
              <Input
                id="clarify-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void removeItem(item.id).then(close)}
            >
              <Trash2 className="size-4" />
              Drop
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void markSomeday(item.id).then(close)}
            >
              <CalendarClock className="size-4" />
              Someday
            </Button>
          </div>
          <Button type="button" onClick={() => void handleSave()}>
            Save &amp; file
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
