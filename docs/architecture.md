# The Todo Way — System Architecture

> **Version**: v3 (Life Command Center) | **Updated**: 2026-06-15
> **Scope**: Whole-system architecture across the two repos — `the-todo-way-fe`
> (React SPA/PWA) and `the-todo-way-be` (FastAPI REST API). This is the canonical
> "how it fits together and *why*" document. For field-level detail see
> `docs/lld-frontend.md`, `the-todo-way-be/docs/lld-backend.md`, and the product
> rationale in `docs/plans/v3-life-command-center.md`.

---

## 1. What the system is

The Todo Way is a **single-user personal "life command center."** It is intentionally
*not* a team task tracker. Its job is to help one person *think, plan, prioritize, and
review* their life — external calendars (Google / Outlook) are treated as synced
satellites, not the source of truth.

Two mental models drive every architectural choice:

- **The loop** (day to day): `Capture → Clarify → Engage → Review → repeat`.
- **The hierarchy** (intent flowing broad → concrete):

```
Life domains   (dashboard: notice what is slipping)
  └─ Priorities    (what matters this week/period)
       └─ Routines     (repeatable behaviours upholding standards)
            └─ Items / next actions   (the concrete things you do)
```

**Why this matters for architecture:** the data model and the API are organized around
this hierarchy rather than around a flat "tasks" table. Almost every product principle
(grace, Goodhart guard, seasons, calm nudges) shows up as a *data shape* or a *service
rule* rather than as UI-only behaviour, so both clients and any future client get it for
free.

---

## 2. High-level topology

```
┌─────────────────────────────────────────────┐        ┌──────────────────────────────┐
│  the-todo-way-fe  (React 19 SPA / PWA)        │        │  the-todo-way-be (FastAPI)    │
│                                               │        │                               │
│  Pages ── Zustand stores ── DataProvider ─────┼──HTTP──┤  Routes → Services → Models   │
│                              (swap point)     │ JSON   │              │                │
│  FullCalendar · shadcn/ui · Tailwind          │  +JWT  │              ▼                │
│  Service worker (offline capture, push)       │        │       PostgreSQL 16 (async)   │
└─────────────────────────────────────────────┘        └───────────────┬──────────────┘
                                                                        │ OAuth + sync
                                                          Google Calendar / Microsoft Graph
                                                                        │ Web Push (VAPID)
                                                                     Browser push service
```

- The frontend is a **static, client-rendered SPA** that talks to the backend purely over
  a versioned JSON REST API (`/api/v1`) with a bearer JWT.
- The backend is a **stateless, layered FastAPI app** backed by PostgreSQL, deployable
  unchanged as a long-running Uvicorn container **or** an AWS Lambda function.
- External calendars and the browser push service are the only outbound integrations.

**Why two repos / a hard HTTP boundary:** the clients and server have very different
release cadences, languages, and toolchains. A clean REST seam means the SPA can be
developed (and demoed) with zero backend running (see §4), and the backend can be tested
and deployed independently. It also keeps the door open for additional clients (native,
CLI) without reworking business logic.

---

## 3. Frontend architecture

### 3.1 Stack and why

| Choice | Why |
|--------|-----|
| **React 19 + TypeScript (strict)** | Mature ecosystem; strict TS catches model drift between client and the API contract early. `any` is banned — `unknown` + type guards instead. |
| **Vite 7** | Fast dev server + ESM build; trivial env-var driven config (`VITE_API_URL`). |
| **Tailwind CSS 4 + shadcn/ui (Radix)** | Design tokens as CSS custom properties (HSL) give one source of truth for colour/spacing and free dark mode via the `class` strategy. Radix primitives give accessible dialogs/selects without rebuilding them. |
| **Zustand** | Minimal, unopinionated global state with no provider boilerplate; selectors keep re-renders cheap. Chosen over Redux (too heavy for a single-user app) and Context (re-render churn). |
| **FullCalendar v6 (MIT)** | Battle-tested calendar engine for week/day/month, drag-to-reschedule, resize, external drag. Rebuilding this would be a project on its own. |
| **React Router v7** | Standard SPA routing; nested layout routes model the "auth guard wraps layout wraps pages" structure cleanly. |
| **React Hook Form + Zod** | Schema-first validation shared in spirit with backend Pydantic; minimal re-renders. |

### 3.2 Routing & layout

`src/App.tsx` defines the route tree. Everything except `/login` and `/onboarding` is
wrapped in `AuthGuard` → `MainLayout`:

```
/            → TodayPage      (home: this week's priorities + merged agenda)
/inbox       → InboxPage      (clarify surface)
/calendar    → CalendarPage   (tasks + external events; overcommitment warning)
/domains     → DomainsPage    (conscious-attention dashboard)
/review      → ReviewPage     (daily/weekly ritual)
/settings    → SettingsPage   (calendar connections, export, recovery)
/login, /onboarding           (unauthenticated)
```

A global **`CaptureBar`** (FAB + `c` shortcut) lives in `MainLayout`, so capture is one
keystroke away on every authenticated surface — the "Capture" step of the loop must have
zero friction.

### 3.3 State management — three stores + UI store

| Store | Owns | Notes |
|-------|------|-------|
| `itemStore` | items array, loading/error, CRUD + `capture`/`clarify`/`schedule`/`toggleComplete`/`markSomeday` | Optimistic update for completion toggles (instant flip, rollback + refetch on failure). |
| `domainStore` | domains, priorities, routines, dashboard | Mutations re-fetch the affected slice to stay consistent with server-computed signals. |
| `reviewStore` | review status / completion / deferral | Drives the Review ritual + re-entry detection. |
| `uiStore` (**persisted** to localStorage) | theme, sidebar, calendar view, capture-bar open, energy/context filter, dismissed nudges (timestamped), onboarding flag | Only *device preferences* are persisted — never domain data, which always comes from the provider. |

**Why this split:** each store maps to one bounded concern, so a page subscribes to only
what it needs. Persisting *just* `uiStore` keeps a clean rule — "data lives behind the
provider, preferences live on the device" — and avoids stale cached domain data.

### 3.4 The data provider — the single most important seam

`src/data/provider.ts` defines a `DataProvider` interface and picks an implementation at
load time:

```ts
// src/data/provider.ts (simplified)
const API_URL = import.meta.env.VITE_API_URL
provider = API_URL ? createApiProvider(API_URL)   // axios/fetch → backend
                   : createStaticProvider()        // in-memory, seeded from JSON
```

- **Stores never import data or axios directly** — they only call `dataProvider.*`.
- `staticProvider.ts` is a fully working in-memory backend seeded from `src/data/seed/*.json`
  (domains, items, priorities, routines, reflections). It implements the *same* contract,
  including server-like behaviours (e.g. "this week only" priority filtering).
- `apiProvider.ts` is the real HTTP client.

**Why:** this is what lets the entire app run, be demoed, and be UI-developed with **no
backend at all**, then switch to the real API by setting one env var — without touching a
single store or component. It also makes the client's expectations of the server explicit
and testable. (The recent "This week's priority is empty" bug lived entirely in the static
provider's week-window filter vs. stale seed dates — fixed by normalising seed
`period_start` to the current week.)

### 3.5 Calendar integration

Items are mapped to FullCalendar events via `itemToFCEvent()`. Tasks (`kind=task`) are
movable and urgency-tinted; external events (`kind=event`, `source=google|outlook`) render
in a distinct neutral style and are `editable: false` (you don't edit your synced meetings
here). Overcommitment is computed by summing durations per day against a threshold and
surfaced as a calm banner, never a block.

### 3.6 PWA layer

`public/manifest.webmanifest` + `public/sw.js` provide install, an **offline capture queue**
(so the frictionless capture step survives no connectivity), and web-push subscription wired
to the backend `/push` endpoints. Registered only in `import.meta.env.PROD` to keep dev
reloads clean.

### 3.7 Auth on the client

`src/lib/auth.ts` stores a single JWT in `localStorage` (`ttw_token`). In static mode a
placeholder token satisfies `AuthGuard` so the no-backend demo is fully navigable. Single
user ⇒ no refresh-token dance; the 7-day JWT is simply re-issued on login.

---

## 4. Backend architecture

### 4.1 Stack and why

| Choice | Why |
|--------|-----|
| **Python 3.13 + FastAPI** | Async-native, Pydantic-integrated validation, automatic OpenAPI docs. |
| **SQLAlchemy 2.0 (async, asyncpg)** | Modern typed ORM; async end-to-end so a single Lambda/worker handles concurrent I/O without threads. |
| **PostgreSQL 16** | Relational integrity for the domain→priority→routine→item hierarchy; JSON columns for flexible bits (context tags, default_context). |
| **Alembic** | Versioned, reviewable schema migrations. |
| **Pydantic v2** | Request/response validation + typed settings from env. |
| **JWT (python-jose) + bcrypt** | Stateless auth fit for a single user; bcrypt used directly to avoid passlib/bcrypt version drift. |
| **Uvicorn + Mangum** | Same code runs as a container locally and as a Lambda in AWS — the only difference is the entry handler. |
| **uv + pyproject** | Fast, reproducible dependency management. |
| **Ruff + mypy (strict)** | Formatting, linting, and strict typing as one toolchain. |

### 4.2 Strict layering (the core discipline)

```
Routes (thin)  →  Services (all business logic + all queries)  →  Models / DB
```

- **Routes** (`app/api/v1/routes/`): validate input via Pydantic, call a service, wrap the
  result in `ApiResponse`. They **never import SQLAlchemy**.
- **Services** (`app/services/`): receive an `AsyncSession`, own *all* queries and rules.
  They **never return HTTP responses** and never know about FastAPI.
- **Models** (`app/models/`): SQLAlchemy ORM tables, relationships, indexes.
- **Schemas** (`app/schemas/`): Pydantic request/response contracts.
- **Core** (`app/core/`): config, security (JWT/hashing/Fernet), dependencies
  (`get_db`, `get_current_user`).

**Why so strict:** it keeps business rules in one testable place, makes routes trivial, and
guarantees the HTTP layer can be swapped (or a second transport added) without touching
logic. It also means "where does a query live?" always has one answer: the service.

### 4.3 Request lifecycle

1. `app/main.py` builds the FastAPI app, adds CORS (origins from settings), registers a
   single `AppException → ApiResponse` exception handler, and includes `v1_router`.
2. `v1_router` (`app/api/v1/__init__.py`) mounts every feature router under `/api/v1/*`
   (auth, items, domains, standards, priorities, routines, review, nudges, data, calendar,
   push, onboarding).
3. A route depends on `CurrentUser` (`get_current_user`) which decodes the JWT and loads the
   `User`; and on `DbSession` (`get_db`) which yields an async session that **rolls back on
   any exception**.
4. The route delegates to a service, which queries/mutates models scoped by `user_id`.

### 4.4 Uniform response envelope

Every endpoint returns the same shape, so the client has one parsing path:

```json
{ "data": ..., "error": null, "meta": { "total": 42, "page": 1, "per_page": 50, "total_pages": 1 } }
```

Errors are raised as `AppException(status, detail)` and converted centrally to
`{ "data": null, "error": "message", "meta": null }`. **Why:** predictable client code and a
single place to evolve pagination/metadata.

### 4.5 Data model highlights & the rules baked into them

The schema mirrors the hierarchy. Beyond the obvious tables, several *product principles are
enforced in data/services, not UI*:

- **Goodhart guard.** `domains.reflection_only` (e.g. Family) means *no countable standards
  and no slipping signal* — relationships are never scored or streaked. A standard in a
  reflection-only domain must be `kind=reflection`.
- **Two kinds of standard.** `countable` (light on-track signal vs. a `target` over a
  `cadence` window) and `reflection` (1–5 rating + note shown as a trend, never red/green).
- **Seasons.** Each domain is `active | maintenance | paused`; paused domains produce no
  nudges/signals. Changes are written to `domain_state_logs` (audit trail).
- **Grace.** Routine generation only fills the current horizon forward — **missed past
  occurrences are never backfilled** into an overdue pile. `someday` items decay rather than
  nag.
- **Calm nudges.** `NudgeService` returns at most relevant calm nudges (weekly-review,
  unclarified-inbox, overcommitment, someday-decay), rate-limited and excluding paused
  domains.

**Why in the data layer:** these are the soul of the product. Encoding them server-side
means they hold regardless of which client renders them and can't be accidentally "optimized
away" in the UI.

### 4.6 Slipping signal

`signals.py` / `NudgeService.compute_domain_signals` measures completed items / routine
instances tagged to a **countable** standard against its `target` over the `cadence` window,
emitting a calm tri-state `on_track | needs_attention | paused` — never a score or streak.
Reflection-only domains and reflection standards are never measured; they only surface a
"due for a reflection" invitation.

### 4.7 External integrations

- **Calendar sync** (`calendar_service.py` + `GoogleCalendarClient`/`OutlookCalendarClient`):
  OAuth connect → incremental sync. External events land as `items` with `kind=event` and
  `source=google|outlook`, so the calendar view and overcommitment logic treat them uniformly
  with internal tasks.
- **Web push** (`push_service.py`): VAPID keys; subscriptions stored per endpoint.

---

## 5. Security & configuration

- **Auth:** JWT (HS256), 7-day expiry, `sub = user_id`. Single-user, so no roles/refresh
  tokens.
- **Secrets at rest:** passwords + recovery codes are bcrypt/SHA-256 hashed; OAuth tokens are
  **encrypted with Fernet** (`ENCRYPTION_KEY`) and never logged. Recovery codes are
  short-lived and constant-time compared.
- **Config via env (Pydantic `BaseSettings`):** `DATABASE_URL`, `JWT_SECRET`, `ENVIRONMENT`,
  `CORS_ORIGINS`, plus optional `ENCRYPTION_KEY`, `VAPID_*`, `GOOGLE_*`/`MS_*` OAuth creds.
  Optional vars stay unset until the matching feature (calendars/push) is configured.

  **Why env-driven:** the *same artifact* runs locally (Docker/Uvicorn) and in AWS
  (Lambda/Mangum) — environment selects behaviour, never a code branch beyond the handler.

---

## 6. Cross-cutting conventions

- **Contract mirroring.** Frontend `src/types/index.ts` mirrors backend Pydantic schemas;
  the `DataProvider` interface is the explicit, typed contract between the two repos.
- **Naming.** FE: PascalCase components, `useX` hooks, `xStore` stores. BE: snake_case files,
  PascalCase classes, UPPER_SNAKE constants.
- **Commits.** Conventional Commits (`feat:`/`fix:`/`chore:`/`docs:`/`refactor:`/`test:`)
  across both repos.
- **Versioned plans.** `docs/plans/` (shared between FE and BE) records the product/architecture
  evolution (v0 → v3); v3 supersedes the earlier Todoist-style v2.

---

## 7. Key decisions, summarized

| Decision | Alternative considered | Why we chose it |
|----------|------------------------|-----------------|
| `DataProvider` abstraction with static + API impls | Components call axios directly | Lets the whole app run with no backend; one swap point; explicit, testable contract. |
| Three domain stores + persisted UI store | One mega-store / Redux | Bounded concerns, cheap re-renders, clear "data vs. preference" persistence rule. |
| Strict Routes→Services→Models layering | Logic in route handlers | Testable, swappable transport, single home for queries/rules. |
| Product principles encoded in data/services | Enforce in UI | Holds across all clients; can't be optimized away; the product's soul lives server-side. |
| Uniform `ApiResponse` envelope | Bare payloads / per-route shapes | One client parsing path; central place to evolve pagination/errors. |
| Env-driven config, Uvicorn **and** Mangum | Separate codebases per target | One artifact runs locally and on Lambda; environment, not code, selects behaviour. |
| External events stored as `items` (`kind=event`) | Separate events table | Calendar + overcommitment logic treat internal and external uniformly. |
| JWT + bcrypt, no refresh tokens | Session store / OAuth-only | Right-sized for a single-user app; minimal moving parts. |
| Two repos, hard HTTP seam | Monorepo / SSR coupling | Independent cadence/toolchains; room for future clients. |

---

## 8. Where to look next

- `docs/lld-frontend.md` — component interfaces, store shapes, calendar mapping, PWA detail.
- `the-todo-way-be/docs/lld-backend.md` — full DB schema, endpoint list, service catalogue.
- `docs/plans/v3-life-command-center.md` — product principles and phasing rationale.
- `the-todo-way-be/docs/data-trust.md` — export/backup/recovery handling.
