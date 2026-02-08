// ============================================================
// Section Store — Zustand
// Ref: docs/lld.md §3 (sectionStore)
//
// Manages sections, subsections, and labels.
// In-memory CRUD; data resets on page reload.
// ============================================================

import { create } from "zustand"

import { dataProvider } from "@/data/provider"
import type { Label, Section, Subsection } from "@/types/todo"

// ------------------------------------------------------------
// State shape
// ------------------------------------------------------------

interface SectionState {
  sections: Section[]
  labels: Label[]
  isLoading: boolean

  // Actions
  fetchSections: () => void
  fetchLabels: () => void
  createSection: (name: string) => Section
  updateSection: (id: string, name: string) => void
  deleteSection: (id: string) => void
  createSubsection: (sectionId: string, name: string) => Subsection | undefined
  createLabel: (name: string, color: string) => Label
  updateLabel: (id: string, name: string, color: string) => void
  deleteLabel: (id: string) => void
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function generateSectionId(): string {
  return `sec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function generateSubsectionId(): string {
  return `subsec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function generateLabelId(): string {
  return `lbl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

// ------------------------------------------------------------
// Store
// ------------------------------------------------------------

export const useSectionStore = create<SectionState>((set, get) => ({
  sections: [],
  labels: [],
  isLoading: false,

  fetchSections: () => {
    set({ isLoading: true })
    try {
      const sections = dataProvider.sections.list()
      set({ sections, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchLabels: () => {
    set({ isLoading: true })
    try {
      const labels = dataProvider.labels.list()
      set({ labels, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  createSection: (name: string): Section => {
    const section: Section = {
      id: generateSectionId(),
      name,
      sort_order: get().sections.length + 1,
      subsections: [],
    }
    set((state) => ({ sections: [...state.sections, section] }))
    return section
  },

  updateSection: (id: string, name: string) => {
    set((state) => ({
      sections: state.sections.map((s) =>
        s.id === id ? { ...s, name } : s,
      ),
    }))
  },

  deleteSection: (id: string) => {
    set((state) => ({
      sections: state.sections.filter((s) => s.id !== id),
    }))
  },

  createSubsection: (sectionId: string, name: string): Subsection | undefined => {
    const section = get().sections.find((s) => s.id === sectionId)
    if (!section) return undefined

    const subsection: Subsection = {
      id: generateSubsectionId(),
      name,
      sort_order: section.subsections.length + 1,
      section_id: sectionId,
    }

    set((state) => ({
      sections: state.sections.map((s) =>
        s.id === sectionId
          ? { ...s, subsections: [...s.subsections, subsection] }
          : s,
      ),
    }))

    return subsection
  },

  createLabel: (name: string, color: string): Label => {
    const label: Label = {
      id: generateLabelId(),
      name,
      color,
    }
    set((state) => ({ labels: [...state.labels, label] }))
    return label
  },

  updateLabel: (id: string, name: string, color: string) => {
    set((state) => ({
      labels: state.labels.map((l) =>
        l.id === id ? { ...l, name, color } : l,
      ),
    }))
  },

  deleteLabel: (id: string) => {
    set((state) => ({
      labels: state.labels.filter((l) => l.id !== id),
    }))
  },
}))
