// ============================================================
// Domain Store — Zustand (async, provider-backed)
// Replaces the old sectionStore. Domains + standards + priorities + dashboard.
// ============================================================

import { create } from "zustand"

import { dataProvider } from "@/data/provider"
import type {
  DomainCreateInput,
  PriorityCreateInput,
  ReflectionCreateInput,
  StandardCreateInput,
} from "@/data/provider"
import type {
  Dashboard,
  Domain,
  Priority,
  PriorityStatus,
  Routine,
  Season,
  TrendPoint,
} from "@/types"

interface DomainState {
  domains: Domain[]
  priorities: Priority[]
  routines: Routine[]
  dashboard: Dashboard | null
  isLoading: boolean

  fetchDomains: () => Promise<void>
  fetchPriorities: () => Promise<void>
  fetchRoutines: () => Promise<void>
  fetchDashboard: () => Promise<void>

  createDomain: (input: DomainCreateInput) => Promise<void>
  setSeason: (id: string, season: Season, note?: string | null) => Promise<void>
  addStandard: (domainId: string, input: StandardCreateInput) => Promise<void>
  removeStandard: (id: string) => Promise<void>
  addReflection: (domainId: string, input: ReflectionCreateInput) => Promise<void>
  getTrend: (domainId: string) => Promise<TrendPoint[]>

  createPriority: (input: PriorityCreateInput) => Promise<void>
  setPriorityStatus: (id: string, status: PriorityStatus) => Promise<void>
  removePriority: (id: string) => Promise<void>

  generateRoutines: () => Promise<{ generated: number; skipped_missed: number }>
}

export const useDomainStore = create<DomainState>((set, get) => ({
  domains: [],
  priorities: [],
  routines: [],
  dashboard: null,
  isLoading: false,

  fetchDomains: async () => {
    set({ isLoading: true })
    const domains = await dataProvider.domains.list()
    set({ domains, isLoading: false })
  },

  fetchPriorities: async () => {
    const priorities = await dataProvider.priorities.list(true)
    set({ priorities })
  },

  fetchRoutines: async () => {
    const routines = await dataProvider.routines.list()
    set({ routines })
  },

  fetchDashboard: async () => {
    const dashboard = await dataProvider.domains.dashboard()
    set({ dashboard })
  },

  createDomain: async (input) => {
    await dataProvider.domains.create(input)
    await get().fetchDomains()
  },

  setSeason: async (id, season, note) => {
    await dataProvider.domains.setSeason(id, season, note)
    await Promise.all([get().fetchDomains(), get().fetchDashboard()])
  },

  addStandard: async (domainId, input) => {
    await dataProvider.domains.addStandard(domainId, input)
    await get().fetchDomains()
  },

  removeStandard: async (id) => {
    await dataProvider.domains.removeStandard(id)
    await get().fetchDomains()
  },

  addReflection: async (domainId, input) => {
    await dataProvider.domains.addReflection(domainId, input)
    await get().fetchDashboard()
  },

  getTrend: (domainId) => dataProvider.domains.trend(domainId),

  createPriority: async (input) => {
    await dataProvider.priorities.create(input)
    await get().fetchPriorities()
  },

  setPriorityStatus: async (id, status) => {
    await dataProvider.priorities.setStatus(id, status)
    await get().fetchPriorities()
  },

  removePriority: async (id) => {
    await dataProvider.priorities.remove(id)
    await get().fetchPriorities()
  },

  generateRoutines: async () => {
    const result = await dataProvider.routines.generate()
    await get().fetchRoutines()
    return result
  },
}))
