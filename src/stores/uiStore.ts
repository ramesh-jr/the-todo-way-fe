// ============================================================
// UI Store — Zustand (persisted preferences)
// Theme, sidebar, calendar view, capture bar, energy/context filter,
// dismissed nudges (rate-limited), and transient detail/clarify state.
// ============================================================

import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { CalendarView } from "@/lib/calendarViews"
import type { Energy, NudgeKind } from "@/types"

type Theme = "light" | "dark" | "system"

interface EnergyContextFilter {
  energy: Energy | null
  context: string | null
  maxMinutes: number | null
}

interface UIState {
  // Preferences (persisted)
  theme: Theme
  sidebarOpen: boolean
  calendarView: CalendarView
  energyFilter: EnergyContextFilter
  dismissedNudges: Record<string, number> // nudgeKind -> dismissed-at epoch ms

  // Transient (not persisted)
  captureOpen: boolean
  selectedItemId: string | null
  clarifyItemId: string | null

  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setCalendarView: (view: CalendarView) => void
  setEnergyFilter: (patch: Partial<EnergyContextFilter>) => void
  resetEnergyFilter: () => void
  dismissNudge: (kind: NudgeKind) => void
  isNudgeDismissed: (kind: NudgeKind) => boolean

  openCapture: () => void
  closeCapture: () => void
  openItemDetail: (id: string) => void
  closeItemDetail: () => void
  openClarify: (id: string) => void
  closeClarify: () => void
}

// A dismissed nudge stays quiet for this long (rate-limiting, never silenced forever).
const NUDGE_QUIET_MS = 1000 * 60 * 60 * 12 // 12 hours

function applyTheme(theme: Theme): void {
  const root = document.documentElement
  if (theme === "dark") root.classList.add("dark")
  else if (theme === "light") root.classList.remove("dark")
  else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    root.classList.toggle("dark", prefersDark)
  }
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: "system",
      sidebarOpen: true,
      calendarView: "timeGridWeek",
      energyFilter: { energy: null, context: null, maxMinutes: null },
      dismissedNudges: {},

      captureOpen: false,
      selectedItemId: null,
      clarifyItemId: null,

      setTheme: (theme) => {
        applyTheme(theme)
        set({ theme })
      },
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setCalendarView: (calendarView) => set({ calendarView }),
      setEnergyFilter: (patch) =>
        set((s) => ({ energyFilter: { ...s.energyFilter, ...patch } })),
      resetEnergyFilter: () =>
        set({ energyFilter: { energy: null, context: null, maxMinutes: null } }),

      dismissNudge: (kind) =>
        set((s) => ({
          dismissedNudges: { ...s.dismissedNudges, [kind]: Date.now() },
        })),
      isNudgeDismissed: (kind) => {
        const at = get().dismissedNudges[kind]
        return at !== undefined && Date.now() - at < NUDGE_QUIET_MS
      },

      openCapture: () => set({ captureOpen: true }),
      closeCapture: () => set({ captureOpen: false }),
      openItemDetail: (id) => set({ selectedItemId: id }),
      closeItemDetail: () => set({ selectedItemId: null }),
      openClarify: (id) => set({ clarifyItemId: id }),
      closeClarify: () => set({ clarifyItemId: null }),
    }),
    {
      name: "ttw-ui",
      partialize: (s) => ({
        theme: s.theme,
        sidebarOpen: s.sidebarOpen,
        calendarView: s.calendarView,
        energyFilter: s.energyFilter,
        dismissedNudges: s.dismissedNudges,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) applyTheme(state.theme)
      },
    },
  ),
)

const mq = window.matchMedia("(prefers-color-scheme: dark)")
mq.addEventListener("change", () => {
  if (useUIStore.getState().theme === "system") applyTheme("system")
})
