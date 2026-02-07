# The Todo Way - Frontend

A personal productivity app with Todoist-like features including Inbox, Calendar (Outlook-style with FullCalendar), and drag-and-drop scheduling.

## Tech Stack

- **React 19** + TypeScript
- **Vite 6** (build tool)
- **Tailwind CSS 4** + **shadcn/ui** (UI)
- **FullCalendar v6** (calendar views, drag-and-drop)
- **Zustand** (state management)
- **React Router v7** (routing)
- **React Hook Form** + **Zod** (forms & validation)

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
  components/
    ui/              # shadcn/ui components
    todo/            # TodoCard, TodoDetailPopup, CreateTodoDialog
    calendar/        # CalendarView, MiniCalendar, FullCalendarWrapper
    inbox/           # InboxList, InboxFilters
    layout/          # MainLayout, Sidebar, TopBar
    landing/         # LandingPage (split pane)
  hooks/             # Custom hooks
  stores/            # Zustand stores (todoStore, sectionStore, uiStore)
  data/              # Static JSON dummy data + data provider
  types/             # TypeScript interfaces
  lib/               # Utilities, date helpers
  styles/            # globals.css, FullCalendar overrides
  pages/             # Route-level page components
  App.tsx
  main.tsx
```

## Current Status

**Frontend-first development**: The UI is built with static JSON dummy data. When the backend is ready, swap `src/data/provider.ts` to use the real API client.

## Documentation

- [Design System](docs/design-system.md)
- [Low-Level Design](docs/lld.md)
- [Plans](docs/plans/)
