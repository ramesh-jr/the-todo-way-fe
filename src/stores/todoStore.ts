// ============================================================
// Todo Store — Zustand
// Ref: docs/lld.md §3 (todoStore)
//
// In-memory CRUD on top of data provider.
// Mutations are local-only; data resets on page reload.
// ============================================================

import { create } from "zustand"

import { dataProvider } from "@/data/provider"
import type {
  CreateTodoInput,
  Priority,
  SortField,
  Todo,
  TodoFilters,
} from "@/types/todo"

// ------------------------------------------------------------
// State shape
// ------------------------------------------------------------

interface TodoState {
  todos: Map<string, Todo>
  isLoading: boolean
  error: string | null
  sortBy: SortField
  sortOrder: "asc" | "desc"
  filters: TodoFilters

  // Actions
  fetchTodos: () => void
  createTodo: (data: CreateTodoInput) => Todo
  updateTodo: (id: string, data: Partial<Todo>) => void
  deleteTodo: (id: string) => void
  toggleComplete: (id: string) => void
  scheduleTodo: (id: string, date: Date, durationMinutes?: number) => void
  setSortBy: (field: SortField) => void
  setSortOrder: (order: "asc" | "desc") => void
  setFilters: (filters: Partial<TodoFilters>) => void
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

const PRIORITY_ORDER: Record<Priority, number> = {
  p1: 1,
  p2: 2,
  p3: 3,
  p4: 4,
}

function generateId(): string {
  return `todo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function nowISO(): string {
  return new Date().toISOString()
}

// ------------------------------------------------------------
// Store
// ------------------------------------------------------------

export const useTodoStore = create<TodoState>((set) => ({
  todos: new Map(),
  isLoading: false,
  error: null,
  sortBy: "created_at",
  sortOrder: "desc",
  filters: {
    sectionId: null,
    labelIds: [],
    priority: null,
    showCompleted: false,
  },

  fetchTodos: () => {
    set({ isLoading: true, error: null })
    try {
      const todos = dataProvider.todos.list()
      set({
        todos: new Map(todos.map((t) => [t.id, t])),
        isLoading: false,
      })
    } catch {
      set({ error: "Failed to fetch todos", isLoading: false })
    }
  },

  createTodo: (data: CreateTodoInput): Todo => {
    const now = nowISO()
    const todo: Todo = {
      id: generateId(),
      title: data.title,
      description: data.description ?? null,
      scheduled_date: data.scheduled_date ?? null,
      deadline_date: data.deadline_date ?? null,
      duration_minutes: data.duration_minutes ?? null,
      priority: data.priority ?? "p4",
      location: data.location ?? null,
      is_completed: false,
      completed_at: null,
      section_id: data.section_id ?? null,
      subsection_id: data.subsection_id ?? null,
      labels: data.labels ?? [],
      reminders: data.reminders ?? [],
      created_at: now,
      updated_at: now,
    }

    set((state) => {
      const next = new Map(state.todos)
      next.set(todo.id, todo)
      return { todos: next }
    })

    return todo
  },

  updateTodo: (id: string, data: Partial<Todo>) => {
    set((state) => {
      const existing = state.todos.get(id)
      if (!existing) return state

      const updated: Todo = {
        ...existing,
        ...data,
        id: existing.id, // prevent ID override
        updated_at: nowISO(),
      }
      const next = new Map(state.todos)
      next.set(id, updated)
      return { todos: next }
    })
  },

  deleteTodo: (id: string) => {
    set((state) => {
      const next = new Map(state.todos)
      next.delete(id)
      return { todos: next }
    })
  },

  toggleComplete: (id: string) => {
    set((state) => {
      const existing = state.todos.get(id)
      if (!existing) return state

      const updated: Todo = {
        ...existing,
        is_completed: !existing.is_completed,
        completed_at: !existing.is_completed ? nowISO() : null,
        updated_at: nowISO(),
      }
      const next = new Map(state.todos)
      next.set(id, updated)
      return { todos: next }
    })
  },

  scheduleTodo: (id: string, date: Date, durationMinutes?: number) => {
    set((state) => {
      const existing = state.todos.get(id)
      if (!existing) return state

      const updated: Todo = {
        ...existing,
        scheduled_date: date.toISOString(),
        duration_minutes: durationMinutes ?? existing.duration_minutes,
        updated_at: nowISO(),
      }
      const next = new Map(state.todos)
      next.set(id, updated)
      return { todos: next }
    })
  },

  setSortBy: (field: SortField) => {
    set({ sortBy: field })
  },

  setSortOrder: (order: "asc" | "desc") => {
    set({ sortOrder: order })
  },

  setFilters: (filters: Partial<TodoFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }))
  },
}))

// ------------------------------------------------------------
// Derived selectors
// ------------------------------------------------------------

/** Returns a sorted & filtered array of todos.
 *  NOTE: Do NOT pass this directly to `useTodoStore(selector)` —
 *  it returns a new array each call, which triggers infinite re-renders.
 *  Instead, select the raw data and call this inside `useMemo`. */
export function getFilteredTodos(
  state: Pick<TodoState, "todos" | "filters" | "sortBy" | "sortOrder">,
): Todo[] {
  const { todos, filters, sortBy, sortOrder } = state

  let result = Array.from(todos.values())

  // Filter: completed
  if (!filters.showCompleted) {
    result = result.filter((t) => !t.is_completed)
  }

  // Filter: section
  if (filters.sectionId) {
    result = result.filter((t) => t.section_id === filters.sectionId)
  }

  // Filter: priority
  if (filters.priority) {
    result = result.filter((t) => t.priority === filters.priority)
  }

  // Filter: labels
  if (filters.labelIds.length > 0) {
    result = result.filter((t) =>
      t.labels.some((l) => filters.labelIds.includes(l.id)),
    )
  }

  // Sort
  const direction = sortOrder === "asc" ? 1 : -1

  result.sort((a, b) => {
    switch (sortBy) {
      case "priority":
        return (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) * direction

      case "scheduled_date":
      case "deadline_date":
      case "created_at": {
        const aVal = a[sortBy]
        const bVal = b[sortBy]
        if (aVal === null && bVal === null) return 0
        if (aVal === null) return 1 // nulls last
        if (bVal === null) return -1
        return (new Date(aVal).getTime() - new Date(bVal).getTime()) * direction
      }

      default:
        return 0
    }
  })

  return result
}
