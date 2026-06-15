// ============================================================
// CaptureBar — global quick capture. One tap / the `c` key, available everywhere.
// Title-only by default (lands in Inbox); optional natural-language enrichment.
// ============================================================

import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { parseQuickAdd } from "@/lib/quickAdd"
import { useItemStore } from "@/stores/itemStore"
import { useUIStore } from "@/stores/uiStore"

export function CaptureBar() {
  const open = useUIStore((s) => s.captureOpen)
  const openCapture = useUIStore((s) => s.openCapture)
  const closeCapture = useUIStore((s) => s.closeCapture)
  const capture = useItemStore((s) => s.capture)
  const createItem = useItemStore((s) => s.createItem)

  const [text, setText] = useState("")

  // Global `c` shortcut to capture from anywhere (unless typing in a field).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      if (e.key === "c" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        openCapture()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [openCapture])

  const preview = useMemo(() => (text.trim() ? parseQuickAdd(text) : null), [text])

  async function submit() {
    const value = text.trim()
    if (!value) return
    const parsed = parseQuickAdd(value)
    if (parsed.hints.length > 0) {
      // Enriched capture (scheduled / energy / context detected).
      await createItem(parsed.input)
    } else {
      await capture({ title: value })
    }
    setText("")
    // Keep the dialog open so multiple items can be captured in a row.
    // Closing is intentional only — Escape or the close button.
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? openCapture() : closeCapture())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Capture</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
          className="space-y-3"
        >
          <Input
            autoFocus
            placeholder="What's on your mind?  (e.g. gym tomorrow 7am ~30m @out)"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {preview && preview.hints.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Detected: {preview.hints.join(" · ")}
            </p>
          )}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Goes to your Inbox — clarify it later.
            </p>
            <Button type="submit" disabled={!text.trim()}>
              Capture
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
