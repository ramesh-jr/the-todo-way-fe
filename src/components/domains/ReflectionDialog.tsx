import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useDomainStore } from "@/stores/domainStore"

interface ReflectionDialogProps {
  domainId: string
  domainName: string
  standardId?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const RATINGS = [1, 2, 3, 4, 5] as const

export function ReflectionDialog({
  domainId,
  domainName,
  standardId,
  open,
  onOpenChange,
}: ReflectionDialogProps) {
  const addReflection = useDomainStore((s) => s.addReflection)

  const [rating, setRating] = useState<number | null>(null)
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setRating(null)
      setNote("")
      setSaving(false)
    }
  }, [open])

  const handleSave = async () => {
    setSaving(true)
    try {
      await addReflection(domainId, {
        standard_id: standardId ?? null,
        rating,
        note: note.trim() ? note.trim() : null,
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reflect on {domainName}</DialogTitle>
          <DialogDescription>
            How did this feel this week? No right answer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>A gentle rating</Label>
            <div className="flex gap-2">
              {RATINGS.map((value) => {
                const active = rating === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    aria-pressed={active}
                    aria-label={`Rate ${value} out of 5`}
                    className={cn(
                      "size-9 rounded-md border text-sm transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    {value}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reflection-note">A note (optional)</Label>
            <Textarea
              id="reflection-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything worth remembering…"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Not now
          </Button>
          <Button
            onClick={() => {
              void handleSave()
            }}
            disabled={saving || rating === null}
          >
            Save reflection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
