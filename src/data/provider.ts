// ============================================================
// Data Provider — Static JSON (swap to apiProvider.ts when BE is ready)
// Ref: docs/lld.md §6, .cursor/rules/data-provider.mdc
//
// Stores ALWAYS import from this provider, NEVER from JSON directly.
// ============================================================

import type { Label, Section, Todo } from "@/types/todo"
import labelsData from "./labels.json"
import sectionsData from "./sections.json"
import todosData from "./todos.json"

export const dataProvider = {
  todos: {
    list: (): Todo[] => todosData as Todo[],
    get: (id: string): Todo | undefined =>
      (todosData as Todo[]).find((t) => t.id === id),
  },

  sections: {
    list: (): Section[] => sectionsData as Section[],
  },

  labels: {
    list: (): Label[] => labelsData as Label[],
  },
}
