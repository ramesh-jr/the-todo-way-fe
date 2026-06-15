# The Todo Way - Frontend Low-Level Design (v3)

> **Version**: v3 | **Updated**: 2026-06-02
> **Scope**: Frontend for the Life Command Center. See `docs/plans/v3-life-command-center.md`.

---

## 1. Routing

```
/                 -> TodayPage (default home: priorities + agenda + energy/context filter)
/inbox            -> InboxPage (clarify surface)
/calendar         -> CalendarPage (tasks + events; overcommitment warning)
/domains          -> DomainsPage (conscious-attention dashboard)
/review           -> ReviewPage (lightweight daily/weekly ritual)
/settings         -> SettingsPage (calendar connections, export, recovery, data)
/login            -> LoginPage
```

All routes except `/login` are wrapped in `AuthGuard`. A global `CaptureBar` (FAB + `c`
shortcut + command box) is rendered in `MainLayout`, available on every authed surface.

---

## 2. Types (`src/types/`)

Mirror the canonical model (`domain.ts`, `item.ts`, `review.ts`, ...):

- `Domain` { id, name, slug, color, icon, sort_order, season, season_note, reflection_only, standards }
- `Season = 'active' | 'maintenance' | 'paused'`
- `Standard` { id, domain_id, text, kind, cadence, target, active, sort_order }
- `StandardKind = 'countable' | 'reflection'`
- `ReflectionEntry` { id, domain_id, standard_id, rating, note, period_start }
- `Priority` { id, domain_id, title, horizon, status, period_start, sort_order }
- `Routine` { id, domain_id, standard_id, title, rrule, default_energy, default_context, default_duration_minutes, active }
- `Item` { id, title, notes, status, kind, domain_id, priority_id, routine_id, standard_id,
  energy, context[], scheduled_at, duration_minutes, deadline_at, urgency, rrule, source,
  external_id, external_calendar_id, someday_reviewed_at, completed_at, labels[], reminders[],
  created_at, updated_at }
- `ItemStatus = 'inbox' | 'active' | 'scheduled' | 'done' | 'someday'`
- `ItemKind = 'task' | 'event'`
- `Energy = 'low' | 'medium' | 'high'`
- `Urgency = 'low' | 'normal' | 'high'`
- `DomainSignal = 'on_track' | 'needs_attention' | 'paused'`
- Input types: `CaptureInput`, `CreateItemInput`, `ClarifyInput`, `UpdateItemInput`.

---

## 3. Stores (Zustand)

- `itemStore` (was todoStore): items Map, filters (status/domain/priority/energy/context/
  maxMinutes), CRUD, `capture`, `clarify`, `complete`, `schedule`, `markSomeday`. Energy/
  context aware selectors (`getTodayItems`, `getInboxItems`, `getAgendaForDate`,
  `getItemsForEnergyContext`).
- `domainStore` (was sectionStore): domains + standards + priorities + reflections;
  `setSeason`, standard CRUD, `addReflection`, `computeSignals` (countable only, honors
  seasons + reflection_only), priority CRUD.
- `reviewStore`: review status, `completeReview`, `deferReview(reason, until)`, re-entry
  detection after gaps.
- `uiStore` (persisted): theme, sidebar, calendar view, capture-bar open, energy/context
  filter, dismissed nudges (with timestamps for rate-limiting), onboarding complete flag.

---

## 4. Surfaces

- **CaptureBar**: title-only quick add; optional NL parse (`parseQuickAdd`); enter -> inbox.
- **TodayPage**: this week's priorities (top), merged agenda (events + scheduled tasks +
  due-today + today's routine instances), and an energy/context filter ("I have __ min,
  feeling __").
- **InboxPage**: unprocessed captures with **age** chips; per-item clarify (domain, priority,
  energy/context, schedule, or drop). No guilt counter.
- **CalendarPage**: FullCalendar engine; tasks vs events styled distinctly; overcommitment
  warning banner when a day's load exceeds a sane threshold.
- **DomainsPage**: dashboard ordered (1) focus + wins, (2) intentional choices (seasons),
  (3) gentle invitations (countable needs-attention, reflection due). Family / reflection-
  only domains show a trend + "reflect" prompt, never a slipping flag. Season control inline.
- **ReviewPage**: lightweight, skippable. Triage inbox -> reflect per domain (honor seasons)
  -> set/confirm priorities. Defer-with-comment supported; gentle re-entry after gaps.
- **SettingsPage**: calendar connections, export (JSON + markdown), account recovery, data.

---

## 5. Nudges & grace (`src/lib/nudges.ts`, `src/lib/grace.ts`)

- Nudge engine returns at most one prominent nudge: weekly-review, unclarified-inbox (N items
  older than threshold), overcommitment (per-day load), someday-decay ("still relevant?").
  Each dismissible + rate-limited via `uiStore.dismissedNudges`. Paused domains excluded.
- Grace helpers: routine generation skips missed occurrences; someday decay computation;
  inbox-age formatting (calm, never "overdue").

---

## 6. Data provider (swap point)

`src/data/provider.ts` re-exports either the static provider (current) or `apiProvider.ts`
(axios/fetch against the backend). Stores always go through the provider. The static provider
serves `src/data/*.json` (domains, standards, priorities, routines, items, reflections) for
local/offline development.

---

## 7. Calendar event mapping

`itemToFCEvent(item)`: tasks use urgency-tinted colors and a "task" class; events
(`kind=event`, external source) use a distinct neutral style and are marked
`editable: false`. Energy is shown as a small dot. Overcommitment is computed by summing
durations per day vs `OVERCOMMIT_MINUTES`.

---

## 8. PWA

`manifest.webmanifest`, `public/sw.js` (offline capture queue via IndexedDB + background
sync), install prompt, and web-push subscription wired to the backend `/push` endpoints.
