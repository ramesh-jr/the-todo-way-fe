// ============================================================
// InboxPage — Full-width inbox showing all incomplete todos
// with sort, filter, and card display settings.
// Ref: docs/build-guide.md FE-6
// ============================================================

import { useEffect, useMemo } from "react"
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Filter,
  Inbox,
  Plus,
  Settings,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useSectionStore } from "@/stores/sectionStore"
import { getFilteredTodos, useTodoStore } from "@/stores/todoStore"
import { useUIStore } from "@/stores/uiStore"
import type { Priority, SortField, TodoCardDisplayFields } from "@/types/todo"

import { CreateTodoDialog } from "@/components/todo/CreateTodoDialog"
import { TodoCard } from "@/components/todo/TodoCard"
import { TodoDetailPopup } from "@/components/todo/TodoDetailPopup"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

// ─── Constants ──────────────────────────────────────────

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "scheduled_date", label: "Date" },
  { value: "priority", label: "Priority" },
  { value: "created_at", label: "Created" },
  { value: "deadline_date", label: "Deadline" },
]

const PRIORITY_OPTIONS: { value: Priority; label: string; dotClass: string }[] = [
  { value: "p1", label: "P1 — Critical", dotClass: "bg-red-500" },
  { value: "p2", label: "P2 — High", dotClass: "bg-orange-500" },
  { value: "p3", label: "P3 — Medium", dotClass: "bg-blue-500" },
  { value: "p4", label: "P4 — Low", dotClass: "bg-slate-400" },
]

const DISPLAY_FIELD_LABELS: Record<keyof TodoCardDisplayFields, string> = {
  showDate: "Scheduled date",
  showDeadline: "Deadline",
  showDuration: "Duration",
  showPriority: "Priority indicator",
  showLabels: "Labels",
  showSection: "Section",
}

// ─── Component ──────────────────────────────────────────

export default function InboxPage() {
  // Stores
  const todos = useTodoStore((s) => s.todos)
  const isLoading = useTodoStore((s) => s.isLoading)
  const sortBy = useTodoStore((s) => s.sortBy)
  const sortOrder = useTodoStore((s) => s.sortOrder)
  const filters = useTodoStore((s) => s.filters)
  const fetchTodos = useTodoStore((s) => s.fetchTodos)
  const setSortBy = useTodoStore((s) => s.setSortBy)
  const setSortOrder = useTodoStore((s) => s.setSortOrder)
  const setFilters = useTodoStore((s) => s.setFilters)

  const sections = useSectionStore((s) => s.sections)
  const labels = useSectionStore((s) => s.labels)
  const fetchSections = useSectionStore((s) => s.fetchSections)
  const fetchLabels = useSectionStore((s) => s.fetchLabels)

  const openCreateDialog = useUIStore((s) => s.openCreateDialog)
  const todoCardDisplayFields = useUIStore((s) => s.todoCardDisplayFields)
  const toggleCardDisplayField = useUIStore((s) => s.toggleCardDisplayField)

  // Fetch data on mount
  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  useEffect(() => {
    if (sections.length === 0) fetchSections()
  }, [sections.length, fetchSections])

  useEffect(() => {
    if (labels.length === 0) fetchLabels()
  }, [labels.length, fetchLabels])

  // Derive filtered & sorted todos
  const filteredTodos = useMemo(
    () => getFilteredTodos({ todos, filters, sortBy, sortOrder }),
    [todos, filters, sortBy, sortOrder],
  )

  // Active filter count (for badge)
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.sectionId) count++
    if (filters.priority) count++
    if (filters.labelIds.length > 0) count++
    return count
  }, [filters])

  // ─── Label toggle handler ────────────────────────────
  function toggleLabelFilter(labelId: string) {
    const current = filters.labelIds
    const next = current.includes(labelId)
      ? current.filter((id) => id !== labelId)
      : [...current, labelId]
    setFilters({ labelIds: next })
  }

  function clearFilters() {
    setFilters({ sectionId: null, labelIds: [], priority: null })
  }

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <div className="shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <Inbox className="size-5 text-primary" />
          <h1 className="text-xl font-semibold">Inbox</h1>
          <span className="text-sm text-muted-foreground">
            {filteredTodos.length} todo{filteredTodos.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── Toolbar ── */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* Sort */}
          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as SortField)}
          >
            <SelectTrigger className="h-8 w-[130px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort order toggle */}
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() =>
              setSortOrder(sortOrder === "asc" ? "desc" : "asc")
            }
            aria-label={`Sort ${sortOrder === "asc" ? "ascending" : "descending"}`}
          >
            {sortOrder === "asc" ? (
              <ArrowUpAZ className="size-4" />
            ) : (
              <ArrowDownAZ className="size-4" />
            )}
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* ── Filters ── */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <Filter className="size-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 size-5 justify-center rounded-full px-0 text-[10px]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 space-y-4" align="start">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Filters</span>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="h-6 text-xs text-muted-foreground"
                    onClick={clearFilters}
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {/* Section filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Section
                </label>
                <Select
                  value={filters.sectionId ?? "__all__"}
                  onValueChange={(v) =>
                    setFilters({ sectionId: v === "__all__" ? null : v })
                  }
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue placeholder="All sections" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All sections</SelectItem>
                    {sections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Priority
                </label>
                <Select
                  value={filters.priority ?? "__all__"}
                  onValueChange={(v) =>
                    setFilters({
                      priority: v === "__all__" ? null : (v as Priority),
                    })
                  }
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All priorities</SelectItem>
                    {PRIORITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              opt.dotClass,
                            )}
                          />
                          {opt.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Labels filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Labels
                </label>
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {labels.map((label) => (
                    <div
                      key={label.id}
                      className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-accent"
                      onClick={() => toggleLabelFilter(label.id)}
                    >
                      <Checkbox
                        checked={filters.labelIds.includes(label.id)}
                        onCheckedChange={() => toggleLabelFilter(label.id)}
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
              </div>
            </PopoverContent>
          </Popover>

          {/* Active filter tags */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {filters.sectionId && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  {sections.find((s) => s.id === filters.sectionId)?.name}
                  <button
                    type="button"
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                    onClick={() => setFilters({ sectionId: null })}
                    aria-label="Remove section filter"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              )}
              {filters.priority && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  {PRIORITY_OPTIONS.find((p) => p.value === filters.priority)
                    ?.label}
                  <button
                    type="button"
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                    onClick={() => setFilters({ priority: null })}
                    aria-label="Remove priority filter"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              )}
              {filters.labelIds.length > 0 && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  {filters.labelIds.length} label
                  {filters.labelIds.length > 1 ? "s" : ""}
                  <button
                    type="button"
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                    onClick={() => setFilters({ labelIds: [] })}
                    aria-label="Remove label filters"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* ── Settings gear ── */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Card display settings"
              >
                <Settings className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 space-y-1" align="end">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Show on cards
              </p>
              {(
                Object.keys(DISPLAY_FIELD_LABELS) as Array<
                  keyof TodoCardDisplayFields
                >
              ).map((field) => (
                <div
                  key={field}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-accent"
                  onClick={() => toggleCardDisplayField(field)}
                >
                  <Checkbox
                    checked={todoCardDisplayFields[field]}
                    onCheckedChange={() => toggleCardDisplayField(field)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-sm">
                    {DISPLAY_FIELD_LABELS[field]}
                  </span>
                </div>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* ── Todo list ── */}
      <ScrollArea className="flex-1">
        <div className="mx-auto w-full max-w-2xl space-y-2 p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <p className="text-sm">Loading todos...</p>
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
              <Inbox className="size-10 opacity-40" />
              <p className="text-sm">
                {activeFilterCount > 0
                  ? "No todos match your filters."
                  : "You're all caught up! No todos yet."}
              </p>
              {activeFilterCount > 0 ? (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button size="sm" onClick={() => openCreateDialog()}>
                  <Plus className="size-4" />
                  Create your first todo
                </Button>
              )}
            </div>
          ) : (
            filteredTodos.map((todo) => (
              <TodoCard key={todo.id} todo={todo} />
            ))
          )}
        </div>
      </ScrollArea>

      {/* ── Floating + button ── */}
      <Button
        size="icon"
        className="fixed bottom-6 right-6 size-14 rounded-full shadow-lg"
        onClick={() => openCreateDialog()}
        aria-label="Create new todo"
      >
        <Plus className="size-6" />
      </Button>

      {/* ── Dialogs ── */}
      <CreateTodoDialog />
      <TodoDetailPopup />
    </div>
  )
}
