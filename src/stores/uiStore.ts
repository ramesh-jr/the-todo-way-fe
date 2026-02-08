// ============================================================
// UI Store — Zustand (persisted to localStorage)
// Ref: docs/lld.md §3 (uiStore)
//
// Manages sidebar, theme, calendar view, card display prefs,
// and dialog/detail states.
// ============================================================

import { create } from "zustand"
import { persist } from "zustand/middleware"

import type {
  CalendarView,
  CreateTodoInput,
  TodoCardDisplayFields,
} from "@/types/todo"

// ------------------------------------------------------------
// State shape
// ------------------------------------------------------------

interface UIState {
  sidebarOpen: boolean
  theme: "light" | "dark" | "system"
  calendarView: CalendarView
  todoCardDisplayFields: TodoCardDisplayFields
  selectedTodoId: string | null
  isCreateDialogOpen: boolean
  createDialogDefaults: Partial<CreateTodoInput> | null

  // Actions
  toggleSidebar: () => void
  setTheme: (theme: "light" | "dark" | "system") => void
  setCalendarView: (view: CalendarView) => void
  openTodoDetail: (id: string) => void
  closeTodoDetail: () => void
  openCreateDialog: (defaults?: Partial<CreateTodoInput>) => void
  closeCreateDialog: () => void
  toggleCardDisplayField: (field: keyof TodoCardDisplayFields) => void
}

// ------------------------------------------------------------
// Theme application helper
// ------------------------------------------------------------

function applyThemeToDOM(theme: "light" | "dark" | "system"): void {
  const root = document.documentElement
  if (theme === "dark") {
    root.classList.add("dark")
  } else if (theme === "light") {
    root.classList.remove("dark")
  } else {
    // system: follow OS preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    root.classList.toggle("dark", prefersDark)
  }
}

// ------------------------------------------------------------
// Store
// ------------------------------------------------------------

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: "system",
      calendarView: "timeGridWeek",
      todoCardDisplayFields: {
        showDate: true,
        showDeadline: true,
        showDuration: true,
        showPriority: true,
        showLabels: true,
        showSection: false,
      },
      selectedTodoId: null,
      isCreateDialogOpen: false,
      createDialogDefaults: null,

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }))
      },

      setTheme: (theme) => {
        applyThemeToDOM(theme)
        set({ theme })
      },

      setCalendarView: (calendarView) => {
        set({ calendarView })
      },

      openTodoDetail: (id: string) => {
        set({ selectedTodoId: id })
      },

      closeTodoDetail: () => {
        set({ selectedTodoId: null })
      },

      openCreateDialog: (defaults?: Partial<CreateTodoInput>) => {
        set({
          isCreateDialogOpen: true,
          createDialogDefaults: defaults ?? null,
        })
      },

      closeCreateDialog: () => {
        set({
          isCreateDialogOpen: false,
          createDialogDefaults: null,
        })
      },

      toggleCardDisplayField: (field: keyof TodoCardDisplayFields) => {
        set((state) => ({
          todoCardDisplayFields: {
            ...state.todoCardDisplayFields,
            [field]: !state.todoCardDisplayFields[field],
          },
        }))
      },
    }),
    {
      name: "the-todo-way-ui",
      // Only persist user preferences, not transient dialog state
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
        calendarView: state.calendarView,
        todoCardDisplayFields: state.todoCardDisplayFields,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          // Apply persisted theme to DOM after rehydration
          if (state?.theme) {
            applyThemeToDOM(state.theme)
          }
        }
      },
    },
  ),
)
