// ============================================================
// TodosPage — Section/subsection accordion view of all todos.
// Ref: docs/build-guide.md FE-9
// ============================================================

import { useEffect, useMemo, useState, type KeyboardEvent } from "react"
import {
  FolderOpen,
  Inbox,
  ListTodo,
  Plus,
} from "lucide-react"
import { useSectionStore } from "@/stores/sectionStore"
import { useTodoStore } from "@/stores/todoStore"
import { useUIStore } from "@/stores/uiStore"
import type { Section, Subsection, Todo } from "@/types/todo"

import { CreateTodoDialog } from "@/components/todo/CreateTodoDialog"
import { TodoCard } from "@/components/todo/TodoCard"
import { TodoDetailPopup } from "@/components/todo/TodoDetailPopup"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

// ─── Component ──────────────────────────────────────────

export default function TodosPage() {
  // Stores
  const todos = useTodoStore((s) => s.todos)
  const isLoading = useTodoStore((s) => s.isLoading)
  const fetchTodos = useTodoStore((s) => s.fetchTodos)

  const sections = useSectionStore((s) => s.sections)
  const fetchSections = useSectionStore((s) => s.fetchSections)
  const createSection = useSectionStore((s) => s.createSection)
  const createSubsection = useSectionStore((s) => s.createSubsection)

  const openCreateDialog = useUIStore((s) => s.openCreateDialog)

  // Local state for inline create inputs
  const [newSectionName, setNewSectionName] = useState("")
  const [isAddingSection, setIsAddingSection] = useState(false)
  const [addingSubsectionForId, setAddingSubsectionForId] = useState<
    string | null
  >(null)
  const [newSubsectionName, setNewSubsectionName] = useState("")

  // Fetch data on mount
  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  useEffect(() => {
    if (sections.length === 0) fetchSections()
  }, [sections.length, fetchSections])

  // Derive all incomplete todos as an array
  const allTodos = useMemo(
    () => Array.from(todos.values()).filter((t) => !t.is_completed),
    [todos],
  )

  // Unsorted todos: no section_id
  const unsortedTodos = useMemo(
    () => allTodos.filter((t) => t.section_id === null),
    [allTodos],
  )

  // Group todos by section → subsection
  const todosBySectionId = useMemo(() => {
    const map = new Map<string, Todo[]>()
    for (const todo of allTodos) {
      if (todo.section_id) {
        const existing = map.get(todo.section_id) ?? []
        existing.push(todo)
        map.set(todo.section_id, existing)
      }
    }
    return map
  }, [allTodos])

  // Total count
  const totalCount = allTodos.length

  // ─── Inline section creation ──────────────────────────

  function handleCreateSection() {
    const trimmed = newSectionName.trim()
    if (!trimmed) return
    createSection(trimmed)
    setNewSectionName("")
    setIsAddingSection(false)
  }

  function handleSectionKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleCreateSection()
    if (e.key === "Escape") {
      setNewSectionName("")
      setIsAddingSection(false)
    }
  }

  // ─── Inline subsection creation ───────────────────────

  function handleCreateSubsection(sectionId: string) {
    const trimmed = newSubsectionName.trim()
    if (!trimmed) return
    createSubsection(sectionId, trimmed)
    setNewSubsectionName("")
    setAddingSubsectionForId(null)
  }

  function handleSubsectionKeyDown(
    e: KeyboardEvent<HTMLInputElement>,
    sectionId: string,
  ) {
    if (e.key === "Enter") handleCreateSubsection(sectionId)
    if (e.key === "Escape") {
      setNewSubsectionName("")
      setAddingSubsectionForId(null)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <div className="shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <ListTodo className="size-5 text-primary" />
          <h1 className="text-xl font-semibold">Todos</h1>
          <span className="text-sm text-muted-foreground">
            {totalCount} todo{totalCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <ScrollArea className="flex-1">
        <div className="mx-auto w-full max-w-2xl space-y-4 p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <p className="text-sm">Loading todos...</p>
            </div>
          ) : allTodos.length === 0 && sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
              <ListTodo className="size-10 opacity-40" />
              <p className="text-sm">No todos yet. Create a section to get started.</p>
              <Button size="sm" onClick={() => setIsAddingSection(true)}>
                <Plus className="size-4" />
                Create a section
              </Button>
            </div>
          ) : (
            <>
              {/* ── Unsorted group ── */}
              {unsortedTodos.length > 0 && (
                <UnsortedGroup
                  todos={unsortedTodos}
                  onCreateTodo={() => openCreateDialog()}
                />
              )}

              {/* ── Section accordions ── */}
              <Accordion type="multiple" defaultValue={sections.map((s) => s.id)}>
                {sections.map((section) => (
                  <SectionAccordion
                    key={section.id}
                    section={section}
                    todos={todosBySectionId.get(section.id) ?? []}
                    onCreateTodo={() =>
                      openCreateDialog({ section_id: section.id })
                    }
                    addingSubsectionForId={addingSubsectionForId}
                    setAddingSubsectionForId={setAddingSubsectionForId}
                    newSubsectionName={newSubsectionName}
                    setNewSubsectionName={setNewSubsectionName}
                    onCreateSubsection={handleCreateSubsection}
                    onSubsectionKeyDown={handleSubsectionKeyDown}
                  />
                ))}
              </Accordion>

              {/* ── Add section ── */}
              <div className="pt-2">
                {isAddingSection ? (
                  <div className="flex items-center gap-2">
                    <Input
                      autoFocus
                      placeholder="Section name"
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      onKeyDown={handleSectionKeyDown}
                      onBlur={() => {
                        if (!newSectionName.trim()) {
                          setIsAddingSection(false)
                        }
                      }}
                      className="h-9 max-w-xs"
                    />
                    <Button
                      size="sm"
                      onClick={handleCreateSection}
                      disabled={!newSectionName.trim()}
                    >
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setNewSectionName("")
                        setIsAddingSection(false)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground"
                    onClick={() => setIsAddingSection(true)}
                  >
                    <Plus className="size-4" />
                    Add section
                  </Button>
                )}
              </div>
            </>
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

// ─── Unsorted group ─────────────────────────────────────

function UnsortedGroup({
  todos,
  onCreateTodo,
}: {
  todos: Todo[]
  onCreateTodo: () => void
}) {
  return (
    <Accordion type="multiple" defaultValue={["unsorted"]}>
      <AccordionItem value="unsorted">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <Inbox className="size-4 text-muted-foreground" />
            <span className="font-semibold">Unsorted</span>
            <span className="text-xs text-muted-foreground">
              ({todos.length})
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            {todos.map((todo) => (
              <TodoCard key={todo.id} todo={todo} />
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 gap-1.5 text-muted-foreground"
              onClick={onCreateTodo}
            >
              <Plus className="size-3.5" />
              Add todo
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

// ─── Section accordion ──────────────────────────────────

function SectionAccordion({
  section,
  todos,
  onCreateTodo,
  addingSubsectionForId,
  setAddingSubsectionForId,
  newSubsectionName,
  setNewSubsectionName,
  onCreateSubsection,
  onSubsectionKeyDown,
}: {
  section: Section
  todos: Todo[]
  onCreateTodo: () => void
  addingSubsectionForId: string | null
  setAddingSubsectionForId: (id: string | null) => void
  newSubsectionName: string
  setNewSubsectionName: (name: string) => void
  onCreateSubsection: (sectionId: string) => void
  onSubsectionKeyDown: (
    e: KeyboardEvent<HTMLInputElement>,
    sectionId: string,
  ) => void
}) {
  // Todos directly under section (no subsection)
  const sectionLevelTodos = useMemo(
    () => todos.filter((t) => t.subsection_id === null),
    [todos],
  )

  // Group todos by subsection
  const todosBySubsectionId = useMemo(() => {
    const map = new Map<string, Todo[]>()
    for (const todo of todos) {
      if (todo.subsection_id) {
        const existing = map.get(todo.subsection_id) ?? []
        existing.push(todo)
        map.set(todo.subsection_id, existing)
      }
    }
    return map
  }, [todos])

  const isAddingSub = addingSubsectionForId === section.id

  return (
    <AccordionItem value={section.id}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-2">
          <FolderOpen className="size-4 text-primary" />
          <span className="font-semibold">{section.name}</span>
          <span className="text-xs text-muted-foreground">
            ({todos.length})
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3">
          {/* Todos directly under section (no subsection) */}
          {sectionLevelTodos.length > 0 && (
            <div className="space-y-2">
              {sectionLevelTodos.map((todo) => (
                <TodoCard key={todo.id} todo={todo} />
              ))}
            </div>
          )}

          {/* Subsection accordions */}
          {section.subsections.length > 0 && (
            <Accordion
              type="multiple"
              defaultValue={section.subsections.map((sub) => sub.id)}
            >
              {section.subsections.map((subsection) => (
                <SubsectionAccordion
                  key={subsection.id}
                  subsection={subsection}
                  todos={todosBySubsectionId.get(subsection.id) ?? []}
                  sectionId={section.id}
                />
              ))}
            </Accordion>
          )}

          {/* Actions: add todo + add subsection */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={onCreateTodo}
            >
              <Plus className="size-3.5" />
              Add todo
            </Button>

            {isAddingSub ? (
              <div className="flex items-center gap-2">
                <Input
                  autoFocus
                  placeholder="Subsection name"
                  value={newSubsectionName}
                  onChange={(e) => setNewSubsectionName(e.target.value)}
                  onKeyDown={(e) => onSubsectionKeyDown(e, section.id)}
                  onBlur={() => {
                    if (!newSubsectionName.trim()) {
                      setAddingSubsectionForId(null)
                    }
                  }}
                  className="h-8 max-w-[180px]"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => onCreateSubsection(section.id)}
                  disabled={!newSubsectionName.trim()}
                >
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  onClick={() => {
                    setNewSubsectionName("")
                    setAddingSubsectionForId(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => {
                  setNewSubsectionName("")
                  setAddingSubsectionForId(section.id)
                }}
              >
                <Plus className="size-3.5" />
                Add subsection
              </Button>
            )}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

// ─── Subsection accordion ───────────────────────────────

function SubsectionAccordion({
  subsection,
  todos,
  sectionId,
}: {
  subsection: Subsection
  todos: Todo[]
  sectionId: string
}) {
  const openCreateDialog = useUIStore((s) => s.openCreateDialog)

  return (
    <AccordionItem value={subsection.id} className="border-b-0">
      <AccordionTrigger className="py-2 hover:no-underline">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{subsection.name}</span>
          <span className="text-xs text-muted-foreground">
            ({todos.length})
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pl-6">
        <div className="space-y-2">
          {todos.length > 0 ? (
            todos.map((todo) => <TodoCard key={todo.id} todo={todo} />)
          ) : (
            <p className="text-xs italic text-muted-foreground">
              No todos in this subsection
            </p>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 gap-1.5 text-muted-foreground"
            onClick={() =>
              openCreateDialog({
                section_id: sectionId,
                subsection_id: subsection.id,
              })
            }
          >
            <Plus className="size-3.5" />
            Add todo
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
