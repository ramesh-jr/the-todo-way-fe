// ============================================================
// Review Store — Zustand (async)
// Review ritual status + nudges. Nudge dismissal/rate-limiting lives in uiStore.
// ============================================================

import { create } from "zustand"

import { dataProvider } from "@/data/provider"
import type { NudgeList, ReviewStatus, ReviewType } from "@/types"

interface ReviewState {
  status: ReviewStatus | null
  nudges: NudgeList | null

  fetchStatus: () => Promise<void>
  fetchNudges: () => Promise<void>
  completeReview: (type: ReviewType) => Promise<void>
  deferReview: (type: ReviewType, reason?: string, until?: string) => Promise<void>
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  status: null,
  nudges: null,

  fetchStatus: async () => {
    const status = await dataProvider.review.status()
    set({ status })
  },

  fetchNudges: async () => {
    const nudges = await dataProvider.nudges.list()
    set({ nudges })
  },

  completeReview: async (type) => {
    await dataProvider.review.complete(type)
    await Promise.all([get().fetchStatus(), get().fetchNudges()])
  },

  deferReview: async (type, reason, until) => {
    await dataProvider.review.defer(type, reason, until)
    await Promise.all([get().fetchStatus(), get().fetchNudges()])
  },
}))
