# The Todo Way - Frontend

Personal **Life Command Center**: Today, Inbox (capture → clarify), Calendar, Domains, Review, Settings. Installable PWA. Works offline with static seed data; point at the API with `VITE_API_URL` for a live backend.

## Tech Stack

- **React 19** + TypeScript + **Vite**
- **Tailwind CSS 4** + **shadcn/ui**
- **FullCalendar v6**
- **Zustand**, **React Router v7**, **React Hook Form** + **Zod**, **Axios**

## Getting Started

```bash
npm install
cp .env.example .env   # optional — omit VITE_API_URL for offline static mode
npm run dev            # http://localhost:5173
```

### Live API

1. Run the backend (`the-todo-way-be`) on port 8000 with migrations applied.
2. In `.env`:
   ```
   VITE_API_URL=http://localhost:8000
   ```
3. Restart Vite, open `/login` (or onboarding), create the first account via setup.

Human ops (OAuth, VAPID, email, deploy): see **the-todo-way-be** `docs/ops-pending.md`.

## Project Structure

```
src/
  components/   # capture, inbox, calendar, domains, review, layout, ui
  pages/        # Today, Inbox, Calendar, Domains, Review, Settings, Login, …
  stores/       # itemStore, domainStore, reviewStore, uiStore
  data/         # provider.ts → staticProvider | apiProvider
  types/
  lib/          # auth, pwa, quickAdd, date helpers
```

## Documentation

- [AI / handoff context (decisions, pending, what to test)](docs/ai-context.md)
- [Architecture](docs/architecture.md)
- [Frontend LLD](docs/lld-frontend.md)
- [Design system](docs/design-system.md)
- [v3 plan](docs/plans/v3-life-command-center.md)
