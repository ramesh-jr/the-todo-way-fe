// ============================================================
// Item Store — Zustand (async, provider-backed)
// Replaces the old todoStore. Handles capture/clarify/schedule/complete.
// ============================================================

import { create } from "zustand"

import { dataProvider } from "@/data/provider"
import type { ItemListFilters } from "@/data/provider"
import type {
  CaptureInput,
  ClarifyInput,
  CreateItemInput,
  Item,
  UpdateItemInput,
} from "@/types"

interface ItemState {
  items: Item[]
  isLoading: boolean
  error: string | null

  fetchItems: (filters?: ItemListFilters) => Promise<void>
  capture: (input: CaptureInput) => Promise<Item>
  createItem: (input: CreateItemInput) => Promise<Item>
  updateItem: (id: string, patch: UpdateItemInput) => Promise<void>
  removeItem: (id: string) => Promise<void>
  clarifyItem: (id: string, input: ClarifyInput) => Promise<void>
  toggleComplete: (id: string) => Promise<void>
  scheduleItem: (id: string, scheduledAt: string, durationMinutes: number) => Promise<void>
  markSomeday: (id: string) => Promise<void>
}

function upsert(items: Item[], updated: Item): Item[] {
  const idx = items.findIndex((i) => i.id === updated.id)
  if (idx === -1) return [updated, ...items]
  const next = [...items]
  next[idx] = updated
  return next
}

export const useItemStore = create<ItemState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async (filters) => {
    set({ isLoading: true, error: null })
    try {
      const items = await dataProvider.items.list(filters)
      set({ items, isLoading: false })
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false })
    }
  },

  capture: async (input) => {
    const item = await dataProvider.items.capture(input)
    set((s) => ({ items: upsert(s.items, item) }))
    return item
  },

  createItem: async (input) => {
    const item = await dataProvider.items.create(input)
    set((s) => ({ items: upsert(s.items, item) }))
    return item
  },

  updateItem: async (id, patch) => {
    const item = await dataProvider.items.update(id, patch)
    set((s) => ({ items: upsert(s.items, item) }))
  },

  removeItem: async (id) => {
    await dataProvider.items.remove(id)
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
  },

  clarifyItem: async (id, input) => {
    const item = await dataProvider.items.clarify(id, input)
    set((s) => ({ items: upsert(s.items, item) }))
  },

  toggleComplete: async (id) => {
    // Optimistic flip for snappy UX; reconcile with the returned item.
    const current = get().items.find((i) => i.id === id)
    if (current) {
      const optimistic: Item = {
        ...current,
        status: current.status === "done" ? "active" : "done",
      }
      set((s) => ({ items: upsert(s.items, optimistic) }))
    }
    try {
      const item = await dataProvider.items.toggleComplete(id)
      set((s) => ({ items: upsert(s.items, item) }))
    } catch (err) {
      set({ error: (err as Error).message })
      await get().fetchItems()
    }
  },

  scheduleItem: async (id, scheduledAt, durationMinutes) => {
    const item = await dataProvider.items.schedule(id, scheduledAt, durationMinutes)
    set((s) => ({ items: upsert(s.items, item) }))
  },

  markSomeday: async (id) => {
    const item = await dataProvider.items.markSomeday(id)
    set((s) => ({ items: upsert(s.items, item) }))
  },
}))
