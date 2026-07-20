# The Todo Way - Frontend

## Project Overview

Personal Life Command Center: capture → clarify → engage → review. Surfaces: Today, Inbox, Calendar, Domains, Review, Settings. React + TypeScript; FullCalendar; PWA. Offline via static provider; live API when `VITE_API_URL` is set.

## Tech Stack

- React 19, TypeScript, Vite
- Tailwind CSS 4, shadcn/ui (Radix UI primitives)
- FullCalendar v6: `@fullcalendar/react`, timegrid, daygrid, interaction
- Zustand, React Router v7, React Hook Form + Zod, Axios, Lucide React

## Architecture

**Routing**: `/` (landing), `/today`, `/inbox`, `/calendar`, `/domains`, `/review`, `/settings`, `/login`, onboarding

**State**: `itemStore`, `domainStore`, `reviewStore`, `uiStore` (theme/sidebar/prefs; UI store persisted).

**Data Layer**: `src/data/provider.ts` — `staticProvider` (offline seed) or `apiProvider` when `VITE_API_URL` is set. Stores call the provider only.

**Components**: `src/components/{domain}/`. Shared UI in `src/components/ui/`. Pages in `src/pages/`.

## Key Patterns

- Optimistic updates in stores where appropriate; rollback on API failure when wired.
- FullCalendar: items → events; drag/drop/resize/click for schedule + detail.
- Design system tokens in `globals.css` (HSL CSS variables). No hardcoded hex in components.
- Dark mode: Tailwind `class` strategy; persisted in `uiStore`.
- PWA: `public/sw.js`, `src/lib/pwa.ts`, web-push subscription against backend VAPID.

## File Naming

- Components: PascalCase (`CaptureBar.tsx`)
- Hooks: `use` prefix
- Stores: camelCase + `Store` (`itemStore.ts`)
- Utils: camelCase
- Types: PascalCase in `src/types/`

## Conventions

- TypeScript strict. No `any` — use `unknown` + guards.
- Form validation with Zod.
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- Co-locate tests: `Foo.test.tsx`
- Colors from design tokens only

## Reference Docs

- **`docs/ai-context.md`** — start here for any new session (decisions, pending, test checklist); keep in sync with BE copy
- `docs/lld-frontend.md`, `docs/architecture.md`, `docs/design-system.md`
- `docs/plans/v3-life-command-center.md`
- Backend ops: `the-todo-way-be/docs/ops-pending.md`
