// ============================================================
// API data provider — fetch client against the FastAPI backend.
// Implements the same DataProvider contract as the static provider.
// ============================================================

import { getToken, logoutToLogin } from "@/lib/auth"
import type {
  CalendarConnection,
  CaptureInput,
  ClarifyInput,
  CreateItemInput,
  Dashboard,
  Domain,
  Item,
  NudgeList,
  Priority,
  PriorityStatus,
  ReflectionEntry,
  ReviewStatus,
  ReviewType,
  Routine,
  Season,
  Standard,
  TrendPoint,
  UpdateItemInput,
} from "@/types"

import type {
  DataProvider,
  DomainCreateInput,
  GenerateResult,
  ItemListFilters,
  PriorityCreateInput,
  ReflectionCreateInput,
  RoutineCreateInput,
  StandardCreateInput,
  SyncResult,
} from "./provider"

interface ApiEnvelope<T> {
  data: T
  error: string | null
}

export function createApiProvider(baseUrl: string): DataProvider {
  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const token = getToken()
    const resp = await fetch(`${baseUrl}/api/v1${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    if (!resp.ok) {
      if (resp.status === 401) {
        logoutToLogin()
        throw new Error("Session expired — please log in again")
      }
      let message = `Request failed (${resp.status})`
      try {
        const payload = (await resp.json()) as ApiEnvelope<unknown>
        if (payload.error) message = payload.error
      } catch {
        /* ignore */
      }
      throw new Error(message)
    }
    if (resp.status === 204) return undefined as T
    const payload = (await resp.json()) as ApiEnvelope<T>
    return payload.data
  }

  function query(params: Record<string, string | undefined>): string {
    const entries = Object.entries(params).filter(([, v]) => v !== undefined) as [
      string,
      string,
    ][]
    const qs = new URLSearchParams(entries).toString()
    return qs ? `?${qs}` : ""
  }

  return {
    items: {
      list: (filters?: ItemListFilters) =>
        request<Item[]>("GET", `/items${query({ ...filters })}`),
      get: (id) => request<Item>("GET", `/items/${id}`),
      capture: (input: CaptureInput) =>
        request<Item>("POST", "/items/capture", input),
      create: (input: CreateItemInput) => request<Item>("POST", "/items", input),
      update: (id, patch: UpdateItemInput) =>
        request<Item>("PUT", `/items/${id}`, patch),
      remove: (id) => request<void>("DELETE", `/items/${id}`),
      clarify: (id, input: ClarifyInput) =>
        request<Item>("PATCH", `/items/${id}/clarify`, input),
      toggleComplete: (id) => request<Item>("PATCH", `/items/${id}/complete`),
      schedule: (id, scheduledAt, durationMinutes) =>
        request<Item>("PATCH", `/items/${id}/schedule`, {
          scheduled_at: scheduledAt,
          duration_minutes: durationMinutes,
        }),
      markSomeday: (id) => request<Item>("PATCH", `/items/${id}/someday`),
    },

    domains: {
      list: () => request<Domain[]>("GET", "/domains"),
      create: (input: DomainCreateInput) =>
        request<Domain>("POST", "/domains", input),
      update: (id, patch) => request<Domain>("PUT", `/domains/${id}`, patch),
      remove: (id) => request<void>("DELETE", `/domains/${id}`),
      setSeason: (id, season: Season, note) =>
        request<Domain>("PATCH", `/domains/${id}/season`, { season, note }),
      addStandard: (domainId, input: StandardCreateInput) =>
        request<Standard>("POST", `/domains/${domainId}/standards`, input),
      updateStandard: (id, patch) =>
        request<Standard>("PUT", `/standards/${id}`, patch),
      removeStandard: (id) => request<void>("DELETE", `/standards/${id}`),
      addReflection: (domainId, input: ReflectionCreateInput) =>
        request<ReflectionEntry>(
          "POST",
          `/domains/${domainId}/reflections`,
          input,
        ),
      trend: (domainId) =>
        request<TrendPoint[]>("GET", `/domains/${domainId}/trend`),
      dashboard: () => request<Dashboard>("GET", "/domains/dashboard"),
    },

    priorities: {
      list: (currentOnly = true) =>
        request<Priority[]>(
          "GET",
          `/priorities${query({ current_only: String(currentOnly) })}`,
        ),
      create: (input: PriorityCreateInput) =>
        request<Priority>("POST", "/priorities", input),
      update: (id, patch) => request<Priority>("PUT", `/priorities/${id}`, patch),
      setStatus: (id, status: PriorityStatus) =>
        request<Priority>("PATCH", `/priorities/${id}/status`, { status }),
      remove: (id) => request<void>("DELETE", `/priorities/${id}`),
    },

    routines: {
      list: () => request<Routine[]>("GET", "/routines"),
      create: (input: RoutineCreateInput) =>
        request<Routine>("POST", "/routines", input),
      update: (id, patch) => request<Routine>("PUT", `/routines/${id}`, patch),
      remove: (id) => request<void>("DELETE", `/routines/${id}`),
      generate: () => request<GenerateResult>("POST", "/routines/generate"),
    },

    review: {
      status: () => request<ReviewStatus>("GET", "/review/status"),
      complete: async (type: ReviewType) => {
        await request("POST", "/review/complete", { type })
      },
      defer: async (type: ReviewType, reason?: string, until?: string) => {
        await request("POST", "/review/defer", { type, reason, until })
      },
    },

    nudges: {
      list: () => request<NudgeList>("GET", "/nudges"),
    },

    data: {
      exportJson: () => request<unknown>("GET", "/data/export"),
    },

    calendar: {
      connections: () =>
        request<CalendarConnection[]>("GET", "/calendar/connections"),
      connect: (provider) =>
        request<{ authorization_url: string }>(
          "POST",
          `/calendar/connect/${provider}`,
        ),
      disconnect: (id) => request<void>("DELETE", `/calendar/connections/${id}`),
      sync: () => request<SyncResult>("POST", "/calendar/sync"),
    },
  }
}
