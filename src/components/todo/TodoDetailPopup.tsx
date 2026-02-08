// ============================================================
// TodoDetailPopup — Detail view/edit dialog for a single todo.
// Triggered by uiStore.selectedTodoId.
// Ref: docs/lld-frontend.md §4 (TodoDetailPopup)
// ============================================================

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  CalendarIcon,
  CheckCircle2,
  Circle,
  Clock,
  Flag,
  FolderOpen,
  MapPin,
  Pencil,
  Tags,
  Trash2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useSectionStore } from "@/stores/sectionStore"
import { useTodoStore } from "@/stores/todoStore"
import { useUIStore } from "@/stores/uiStore"
import type { Priority } from "@/types/todo"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

// ─── Constants ──────────────────────────────────────────

const PRIORITY_ICON_COLOR: Record<string, string> = {
  p1: "text-red-500",
  p2: "text-orange-500",
  p3: "text-blue-500",
  p4: "text-slate-400",
}

const PRIORITY_OPTIONS = [
  { value: "p1", label: "P1 — Critical", dotClass: "bg-red-500" },
  { value: "p2", label: "P2 — High", dotClass: "bg-orange-500" },
  { value: "p3", label: "P3 — Medium", dotClass: "bg-blue-500" },
  { value: "p4", label: "P4 — Low", dotClass: "bg-slate-400" },
] as const

const DURATION_OPTIONS = [
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
  { value: "180", label: "3 hours" },
  { value: "240", label: "4 hours" },
] as const

// ─── Formatting helpers ─────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

// Duration formatting moved to @/lib/calendarUtils.ts

// Which field is in inline-edit mode
type EditingField =
  | "title"
  | "description"
  | "scheduled_date"
  | "deadline_date"
  | "location"
  | null

// ─── Component ──────────────────────────────────────────

export function TodoDetailPopup() {
  const selectedTodoId = useUIStore((s) => s.selectedTodoId)
  const closeTodoDetail = useUIStore((s) => s.closeTodoDetail)
  const todos = useTodoStore((s) => s.todos)
  const updateTodo = useTodoStore((s) => s.updateTodo)
  const deleteTodo = useTodoStore((s) => s.deleteTodo)
  const toggleComplete = useTodoStore((s) => s.toggleComplete)
  const sections = useSectionStore((s) => s.sections)
  const allLabels = useSectionStore((s) => s.labels)

  const todo = selectedTodoId ? todos.get(selectedTodoId) : undefined
  const isOpen = !!todo

  // Inline-editing state
  const [editingField, setEditingField] = useState<EditingField>(null)
  const [editValue, setEditValue] = useState("")
  const [editDate, setEditDate] = useState<Date | undefined>()
  const [editTime, setEditTime] = useState("")

  // Reset editing when dialog opens/closes
  useEffect(() => {
    setEditingField(null)
  }, [selectedTodoId])

  // Derived: current section & subsections
  const section = useMemo(() => {
    if (!todo?.section_id) return null
    return sections.find((s) => s.id === todo.section_id) ?? null
  }, [todo?.section_id, sections])

  const subsections = useMemo(() => section?.subsections ?? [], [section])

  // ─── Edit handlers ────────────────────────────────────

  function startEdit(field: EditingField) {
    if (!todo) return
    setEditingField(field)
    switch (field) {
      case "title":
        setEditValue(todo.title)
        break
      case "description":
        setEditValue(todo.description ?? "")
        break
      case "location":
        setEditValue(todo.location ?? "")
        break
      case "scheduled_date":
        setEditDate(
          todo.scheduled_date ? new Date(todo.scheduled_date) : undefined,
        )
        if (todo.scheduled_date) {
          const d = new Date(todo.scheduled_date)
          setEditTime(
            `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
          )
        } else {
          setEditTime("")
        }
        break
      case "deadline_date":
        setEditDate(
          todo.deadline_date ? new Date(todo.deadline_date) : undefined,
        )
        break
    }
  }

  function saveEdit() {
    if (!todo || !editingField) return
    switch (editingField) {
      case "title":
        if (editValue.trim()) updateTodo(todo.id, { title: editValue.trim() })
        break
      case "description":
        updateTodo(todo.id, { description: editValue || null })
        break
      case "location":
        updateTodo(todo.id, { location: editValue || null })
        break
      case "scheduled_date": {
        if (!editDate) {
          updateTodo(todo.id, { scheduled_date: null })
        } else {
          const d = new Date(editDate)
          if (editTime) {
            const [h, m] = editTime.split(":").map(Number)
            d.setHours(h, m, 0, 0)
          }
          updateTodo(todo.id, { scheduled_date: d.toISOString() })
        }
        break
      }
      case "deadline_date":
        updateTodo(todo.id, {
          deadline_date: editDate ? editDate.toISOString() : null,
        })
        break
    }
    setEditingField(null)
  }

  function cancelEdit() {
    setEditingField(null)
  }

  function handleDelete() {
    if (!todo) return
    deleteTodo(todo.id)
    closeTodoDetail()
  }

  function handleLabelToggle(labelId: string) {
    if (!todo) return
    const currentIds = todo.labels.map((l) => l.id)
    const newLabels = currentIds.includes(labelId)
      ? todo.labels.filter((l) => l.id !== labelId)
      : [...todo.labels, ...allLabels.filter((l) => l.id === labelId)]
    updateTodo(todo.id, { labels: newLabels })
  }

  if (!todo) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeTodoDetail()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col gap-0">
        {/* ── Header: toggle + title ── */}
        <DialogHeader className="pb-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              className="mt-1 shrink-0"
              onClick={() => toggleComplete(todo.id)}
              aria-label={
                todo.is_completed ? "Mark incomplete" : "Mark complete"
              }
            >
              {todo.is_completed ? (
                <CheckCircle2 className="size-5 text-primary" />
              ) : (
                <Circle
                  className={cn(
                    "size-5",
                    PRIORITY_ICON_COLOR[todo.priority],
                  )}
                />
              )}
            </button>

            <div className="min-w-0 flex-1">
              {editingField === "title" ? (
                <Input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit()
                    if (e.key === "Escape") cancelEdit()
                  }}
                  className="text-lg font-semibold"
                />
              ) : (
                <DialogTitle
                  className={cn(
                    "cursor-pointer transition-colors hover:text-primary",
                    todo.is_completed &&
                      "text-muted-foreground line-through",
                  )}
                  onClick={() => startEdit("title")}
                >
                  {todo.title}
                </DialogTitle>
              )}
            </div>
          </div>
          <DialogDescription className="sr-only">
            View and edit todo details
          </DialogDescription>
        </DialogHeader>

        {/* ── Body ── */}
        <div className="flex-1 space-y-1 overflow-y-auto pr-1">
          {/* Description */}
          <DetailRow
            icon={<Pencil className="size-4" />}
            label="Description"
            onClick={
              editingField !== "description"
                ? () => startEdit("description")
                : undefined
            }
          >
            {editingField === "description" ? (
              <div className="space-y-2">
                <Textarea
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="xs" onClick={saveEdit}>
                    Save
                  </Button>
                  <Button size="xs" variant="ghost" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <span
                className={cn(
                  "text-sm",
                  !todo.description && "italic text-muted-foreground",
                )}
              >
                {todo.description ?? "No description"}
              </span>
            )}
          </DetailRow>

          <Separator />

          {/* Scheduled Date */}
          <DetailRow
            icon={<CalendarIcon className="size-4" />}
            label="Scheduled"
            onClick={
              editingField !== "scheduled_date"
                ? () => startEdit("scheduled_date")
                : undefined
            }
          >
            {editingField === "scheduled_date" ? (
              <div className="space-y-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                    >
                      {editDate
                        ? formatDate(editDate.toISOString())
                        : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editDate}
                      onSelect={setEditDate}
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button size="xs" onClick={saveEdit}>
                    Save
                  </Button>
                  <Button size="xs" variant="ghost" onClick={cancelEdit}>
                    Cancel
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      setEditDate(undefined)
                      setEditTime("")
                      updateTodo(todo.id, { scheduled_date: null })
                      setEditingField(null)
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            ) : (
              <span
                className={cn(
                  "text-sm",
                  !todo.scheduled_date && "italic text-muted-foreground",
                )}
              >
                {todo.scheduled_date
                  ? formatDateTime(todo.scheduled_date)
                  : "Not scheduled"}
              </span>
            )}
          </DetailRow>

          {/* Deadline */}
          <DetailRow
            icon={<Flag className="size-4" />}
            label="Deadline"
            onClick={
              editingField !== "deadline_date"
                ? () => startEdit("deadline_date")
                : undefined
            }
          >
            {editingField === "deadline_date" ? (
              <div className="space-y-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                    >
                      {editDate
                        ? formatDate(editDate.toISOString())
                        : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editDate}
                      onSelect={setEditDate}
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex gap-2">
                  <Button size="xs" onClick={saveEdit}>
                    Save
                  </Button>
                  <Button size="xs" variant="ghost" onClick={cancelEdit}>
                    Cancel
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      setEditDate(undefined)
                      updateTodo(todo.id, { deadline_date: null })
                      setEditingField(null)
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            ) : (
              <span
                className={cn(
                  "text-sm",
                  !todo.deadline_date && "italic text-muted-foreground",
                )}
              >
                {todo.deadline_date
                  ? formatDate(todo.deadline_date)
                  : "No deadline"}
              </span>
            )}
          </DetailRow>

          <Separator />

          {/* Duration — inline select */}
          <DetailRow icon={<Clock className="size-4" />} label="Duration">
            <Select
              value={todo.duration_minutes?.toString() ?? undefined}
              onValueChange={(v) =>
                updateTodo(todo.id, { duration_minutes: parseInt(v, 10) })
              }
            >
              <SelectTrigger className="h-8 w-auto">
                <SelectValue placeholder="Set duration" />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DetailRow>

          {/* Priority — inline select */}
          <DetailRow
            icon={
              <span
                className={cn(
                  "inline-block size-3 rounded-full",
                  PRIORITY_OPTIONS.find((p) => p.value === todo.priority)
                    ?.dotClass,
                )}
              />
            }
            label="Priority"
          >
            <Select
              value={todo.priority}
              onValueChange={(v) =>
                updateTodo(todo.id, { priority: v as Priority })
              }
            >
              <SelectTrigger className="h-8 w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      <span
                        className={cn("size-2 rounded-full", opt.dotClass)}
                      />
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DetailRow>

          <Separator />

          {/* Section + Subsection — inline selects */}
          <DetailRow icon={<FolderOpen className="size-4" />} label="Section">
            <div className="flex items-center gap-2">
              <Select
                value={todo.section_id ?? undefined}
                onValueChange={(v) => {
                  updateTodo(todo.id, { section_id: v, subsection_id: null })
                }}
              >
                <SelectTrigger className="h-8 w-auto">
                  <SelectValue placeholder="No section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {subsections.length > 0 && (
                <>
                  <span className="text-muted-foreground">/</span>
                  <Select
                    value={todo.subsection_id ?? undefined}
                    onValueChange={(v) =>
                      updateTodo(todo.id, { subsection_id: v })
                    }
                  >
                    <SelectTrigger className="h-8 w-auto">
                      <SelectValue placeholder="Subsection" />
                    </SelectTrigger>
                    <SelectContent>
                      {subsections.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </DetailRow>

          {/* Labels — multi-select popover */}
          <DetailRow icon={<Tags className="size-4" />} label="Labels">
            <div className="space-y-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start font-normal",
                      todo.labels.length === 0 && "text-muted-foreground",
                    )}
                  >
                    {todo.labels.length > 0
                      ? `${todo.labels.length} label${todo.labels.length > 1 ? "s" : ""}`
                      : "Add labels"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="space-y-1">
                    {allLabels.map((label) => (
                      <div
                        key={label.id}
                        className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-accent"
                        onClick={() => handleLabelToggle(label.id)}
                      >
                        <Checkbox
                          checked={todo.labels.some(
                            (l) => l.id === label.id,
                          )}
                          onCheckedChange={() =>
                            handleLabelToggle(label.id)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        <span className="text-sm">{label.name}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {todo.labels.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {todo.labels.map((label) => (
                    <span
                      key={label.id}
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${label.color}20`,
                        color: label.color,
                      }}
                    >
                      {label.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </DetailRow>

          {/* Location */}
          <DetailRow
            icon={<MapPin className="size-4" />}
            label="Location"
            onClick={
              editingField !== "location"
                ? () => startEdit("location")
                : undefined
            }
          >
            {editingField === "location" ? (
              <div className="space-y-2">
                <Input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit()
                    if (e.key === "Escape") cancelEdit()
                  }}
                  placeholder="Add location"
                />
                <div className="flex gap-2">
                  <Button size="xs" onClick={saveEdit}>
                    Save
                  </Button>
                  <Button size="xs" variant="ghost" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <span
                className={cn(
                  "text-sm",
                  !todo.location && "italic text-muted-foreground",
                )}
              >
                {todo.location ?? "No location"}
              </span>
            )}
          </DetailRow>
        </div>

        {/* ── Footer ── */}
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="size-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete todo?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &quot;{todo.title}&quot;. This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={handleDelete}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <span className="text-xs text-muted-foreground">
            Created {formatDate(todo.created_at)}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Reusable detail field row ──────────────────────────

function DetailRow({
  icon,
  label,
  children,
  onClick,
}: {
  icon: ReactNode
  label: string
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <div
      className={cn(
        "-mx-2 flex items-start gap-3 rounded-md p-2",
        onClick && "cursor-pointer transition-colors hover:bg-accent/50",
      )}
      onClick={onClick}
    >
      <div className="mt-0.5 shrink-0 text-muted-foreground">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 text-xs font-medium text-muted-foreground">
          {label}
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}
