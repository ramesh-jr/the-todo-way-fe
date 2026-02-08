// ============================================================
// CreateTodoDialog — Modal form to create a new todo.
// Uses React Hook Form + Zod for validation.
// Ref: docs/lld-frontend.md §4 (CreateTodoDialog)
// ============================================================

import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Bell,
  CalendarIcon,
  Clock,
  Flag,
  FolderOpen,
  MapPin,
  Tags,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useSectionStore } from "@/stores/sectionStore"
import { useTodoStore } from "@/stores/todoStore"
import { useUIStore } from "@/stores/uiStore"
import type { ReminderType } from "@/types/todo"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label as FormLabel } from "@/components/ui/label"
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
import { Textarea } from "@/components/ui/textarea"

// ─── Zod validation schema ─────────────────────────────

const createTodoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  priority: z.enum(["p1", "p2", "p3", "p4"]),
  section_id: z.string(),
  subsection_id: z.string(),
  location: z.string(),
  duration_minutes: z.string(),
  reminder_type: z.string(),
})

type FormValues = z.infer<typeof createTodoSchema>

// ─── Constants ──────────────────────────────────────────

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

const PRIORITY_OPTIONS = [
  { value: "p1", label: "P1 — Critical", dotClass: "bg-red-500" },
  { value: "p2", label: "P2 — High", dotClass: "bg-orange-500" },
  { value: "p3", label: "P3 — Medium", dotClass: "bg-blue-500" },
  { value: "p4", label: "P4 — Low", dotClass: "bg-slate-400" },
] as const

const REMINDER_OPTIONS = [
  { value: "before_5min", label: "5 minutes before" },
  { value: "before_15min", label: "15 minutes before" },
  { value: "before_30min", label: "30 minutes before" },
  { value: "before_1hr", label: "1 hour before" },
] as const

// ─── Helpers ────────────────────────────────────────────

function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// ─── Component ──────────────────────────────────────────

export function CreateTodoDialog() {
  const isOpen = useUIStore((s) => s.isCreateDialogOpen)
  const defaults = useUIStore((s) => s.createDialogDefaults)
  const closeDialog = useUIStore((s) => s.closeCreateDialog)
  const createTodo = useTodoStore((s) => s.createTodo)
  const sections = useSectionStore((s) => s.sections)
  const labels = useSectionStore((s) => s.labels)

  // Complex fields managed outside RHF
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>()
  const [scheduledTime, setScheduledTime] = useState("")
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>()
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createTodoSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "p4",
      section_id: "",
      subsection_id: "",
      location: "",
      duration_minutes: "",
      reminder_type: "",
    },
  })

  const watchedSectionId = watch("section_id")

  const subsections = useMemo(() => {
    if (!watchedSectionId) return []
    const section = sections.find((s) => s.id === watchedSectionId)
    return section?.subsections ?? []
  }, [watchedSectionId, sections])

  // Apply defaults when dialog opens
  useEffect(() => {
    if (!isOpen) return

    reset({
      title: defaults?.title ?? "",
      description: defaults?.description ?? "",
      priority: defaults?.priority ?? "p4",
      section_id: defaults?.section_id ?? "",
      subsection_id: defaults?.subsection_id ?? "",
      location: defaults?.location ?? "",
      duration_minutes: defaults?.duration_minutes?.toString() ?? "",
      reminder_type: "",
    })

    if (defaults?.scheduled_date) {
      const d = new Date(defaults.scheduled_date)
      setScheduledDate(d)
      setScheduledTime(
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
      )
    } else {
      setScheduledDate(undefined)
      setScheduledTime("")
    }

    setDeadlineDate(
      defaults?.deadline_date ? new Date(defaults.deadline_date) : undefined,
    )

    setSelectedLabelIds(defaults?.labels?.map((l) => l.id) ?? [])
  }, [isOpen, defaults, reset])

  function onSubmit(data: FormValues) {
    // Build scheduled_date ISO string
    let scheduled_date: string | null = null
    if (scheduledDate) {
      const d = new Date(scheduledDate)
      if (scheduledTime) {
        const [h, m] = scheduledTime.split(":").map(Number)
        d.setHours(h, m, 0, 0)
      }
      scheduled_date = d.toISOString()
    }

    // Build deadline ISO string
    const deadline_date = deadlineDate ? deadlineDate.toISOString() : null

    // Resolve label objects from IDs
    const selectedLabels = labels.filter((l) =>
      selectedLabelIds.includes(l.id),
    )

    createTodo({
      title: data.title,
      description: data.description || null,
      scheduled_date,
      deadline_date,
      duration_minutes: data.duration_minutes
        ? parseInt(data.duration_minutes, 10)
        : null,
      priority: data.priority,
      section_id: data.section_id || null,
      subsection_id: data.subsection_id || null,
      labels: selectedLabels,
      location: data.location || null,
      reminders: data.reminder_type
        ? [
            {
              id: `rem-${Date.now()}`,
              remind_at: scheduled_date ?? "",
              type: data.reminder_type as ReminderType,
            },
          ]
        : [],
    })

    closeDialog()
  }

  function toggleLabel(labelId: string) {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId],
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Todo</DialogTitle>
          <DialogDescription>Add a new todo item to your list.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1"
        >
          {/* Title */}
          <div className="space-y-2">
            <FormLabel htmlFor="create-title">Title *</FormLabel>
            <Input
              id="create-title"
              placeholder="What do you need to do?"
              autoFocus
              {...register("title")}
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <FormLabel htmlFor="create-desc">Description</FormLabel>
            <Textarea
              id="create-desc"
              placeholder="Add more details…"
              rows={2}
              {...register("description")}
            />
          </div>

          {/* Scheduled date + time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <FormLabel>Scheduled Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !scheduledDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="size-4" />
                    {scheduledDate
                      ? formatDateDisplay(scheduledDate)
                      : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <FormLabel htmlFor="create-time">Time</FormLabel>
              <Input
                id="create-time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <FormLabel>Deadline</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deadlineDate && "text-muted-foreground",
                  )}
                >
                  <Flag className="size-4" />
                  {deadlineDate
                    ? formatDateDisplay(deadlineDate)
                    : "Set deadline"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadlineDate}
                  onSelect={setDeadlineDate}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Duration + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <FormLabel>Duration</FormLabel>
              <Select
                value={watch("duration_minutes") || undefined}
                onValueChange={(v) => setValue("duration_minutes", v)}
              >
                <SelectTrigger className="w-full">
                  <Clock className="size-4 text-muted-foreground" />
                  <SelectValue placeholder="Duration" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FormLabel>Priority</FormLabel>
              <Select
                value={watch("priority")}
                onValueChange={(v) =>
                  setValue("priority", v as FormValues["priority"])
                }
              >
                <SelectTrigger className="w-full">
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
            </div>
          </div>

          {/* Section + Subsection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <FormLabel>Section</FormLabel>
              <Select
                value={watch("section_id") || undefined}
                onValueChange={(v) => {
                  setValue("section_id", v)
                  setValue("subsection_id", "")
                }}
              >
                <SelectTrigger className="w-full">
                  <FolderOpen className="size-4 text-muted-foreground" />
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FormLabel>Subsection</FormLabel>
              <Select
                value={watch("subsection_id") || undefined}
                onValueChange={(v) => setValue("subsection_id", v)}
                disabled={subsections.length === 0}
              >
                <SelectTrigger className="w-full">
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
            </div>
          </div>

          {/* Labels */}
          <div className="space-y-2">
            <FormLabel>Labels</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    selectedLabelIds.length === 0 && "text-muted-foreground",
                  )}
                >
                  <Tags className="size-4" />
                  {selectedLabelIds.length > 0
                    ? `${selectedLabelIds.length} label${selectedLabelIds.length > 1 ? "s" : ""} selected`
                    : "Select labels"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="space-y-1">
                  {labels.map((label) => (
                    <div
                      key={label.id}
                      className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-accent"
                      onClick={() => toggleLabel(label.id)}
                    >
                      <Checkbox
                        checked={selectedLabelIds.includes(label.id)}
                        onCheckedChange={() => toggleLabel(label.id)}
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
            {selectedLabelIds.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {labels
                  .filter((l) => selectedLabelIds.includes(l.id))
                  .map((label) => (
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

          {/* Location */}
          <div className="space-y-2">
            <FormLabel htmlFor="create-location">Location</FormLabel>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="create-location"
                placeholder="Add location"
                className="pl-9"
                {...register("location")}
              />
            </div>
          </div>

          {/* Reminder */}
          <div className="space-y-2">
            <FormLabel>Reminder</FormLabel>
            <Select
              value={watch("reminder_type") || undefined}
              onValueChange={(v) => setValue("reminder_type", v)}
            >
              <SelectTrigger className="w-full">
                <Bell className="size-4 text-muted-foreground" />
                <SelectValue placeholder="Set reminder" />
              </SelectTrigger>
              <SelectContent>
                {REMINDER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button type="submit">Create Todo</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
