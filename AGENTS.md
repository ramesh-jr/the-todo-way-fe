# The Todo Way - Frontend

## Project Overview

Personal productivity app with 3 views: Inbox, Calendar, Todos. Built with React + TypeScript, using FullCalendar for the calendar and static JSON for dummy data (backend not yet built).

## Tech Stack

- React 19, TypeScript, Vite 6
- Tailwind CSS 4, shadcn/ui (Radix UI primitives)
- FullCalendar v6 (MIT): @fullcalendar/react, @fullcalendar/timegrid, @fullcalendar/daygrid, @fullcalendar/interaction
- Zustand (state management)
- React Router v7, React Hook Form + Zod
- Axios (for future API integration)
- Lucide React (icons), Inter (font)

## Architecture

**Routing**: `/` (Landing), `/inbox`, `/calendar`, `/todos`, `/login`

**State**: 3 Zustand stores -- `todoStore` (todos CRUD), `sectionStore` (sections/labels), `uiStore` (theme, sidebar, calendar view, card display prefs). UI store persisted to localStorage.

**Data Layer**: `src/data/provider.ts` abstracts the data source. Currently returns static JSON. Will be swapped to `apiProvider.ts` (axios) when backend is ready. Stores call the provider, never import JSON directly.

**Components**: Located in `src/components/{domain}/`. Shared UI in `src/components/ui/` (shadcn). Pages in `src/pages/`.

## Key Patterns

- **Optimistic updates**: Zustand `set()` immediately, rollback on API failure (future)
- **FullCalendar integration**: Todos mapped to FC events via `todoToFCEvent()`. External drag uses FC `Draggable` class. Events: `eventReceive` (external drop), `eventDrop` (reschedule), `eventResize` (duration change), `eventClick` (open detail), `dateClick` (create todo)
- **Design system**: All colors via CSS custom properties (HSL) in `globals.css`. Primary: Indigo-600. Components use Tailwind classes referencing these tokens. No hardcoded hex in components.
- **Dark mode**: Tailwind `class` strategy. System preference + manual toggle. Persisted in `uiStore`.

## File Naming

- Components: PascalCase (`TodoCard.tsx`)
- Hooks: `use` prefix (`useTodos.ts`)
- Stores: camelCase + Store suffix (`todoStore.ts`)
- Utils: camelCase (`dateHelpers.ts`)
- Types: PascalCase in `src/types/` (`todo.ts` exports `interface Todo`)

## Conventions

- TypeScript strict mode. No `any` -- use `unknown` + type guards.
- All form validation with Zod schemas.
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- Co-locate tests next to source: `TodoCard.test.tsx`
- All colors from design system tokens (never hardcode hex in components)

## Reference Docs

- `docs/lld.md` -- Detailed component interfaces, store shapes, API contracts
- `docs/design-system.md` -- Color palette, typography, spacing
- `docs/plans/` -- Versioned project plans
