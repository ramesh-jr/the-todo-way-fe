# The Todo Way - Life Command Center (v3)

> **Version**: v3 (current)
> **Created**: 2026-06-02
> **Status**: Active
> **Supersedes**: v2 (frontend-first todo app)

## Why v3

v2 shipped a Todoist-style task app (Inbox / Calendar / Todos). v3 restructures it into a
single calm **life command center**: external tools (Google / Outlook calendars) become
synced satellites, and the app's job becomes helping you *think, plan, prioritize, and
review* - not just store tasks.

Guiding purpose:

> "Know what matters, know what is slipping, and make conscious choices instead of reacting randomly."

## Two mental models

**The loop** (day to day): Capture -> Clarify -> Engage -> Review -> (repeat).

**The hierarchy** (intent flowing broad -> concrete):

```
Life domains  (dashboard: notice what is slipping)
   -> Priorities  (what matters this week/period)
      -> Routines  (repeatable behaviors upholding standards)
         -> Next actions  (the concrete things you do)
```

## Core principles (binding for all implementation)

1. **Conscious attention over failure.** Every dashboard/summary leads with what you chose
   to focus on and recent wins, before anything that needs attention. Attention items are
   invitations, never red shortfall walls.
2. **Goodhart guard.** Relationships / intrinsic things are *reflection-only* - never
   counted, checkboxed, or streaked. The Family domain has no automatic slipping-detector.
3. **Standards have two kinds.** `countable` (honest-to-quantify behaviors, light on-track
   signal) and `reflection` (1-5 self-rating + note, shown as a trend, never red/green).
4. **Seasons.** Each domain is `active` | `maintenance` | `paused`. Paused domains produce
   no prompts/nudges/attention. Choosing to pause is good self-management, surfaced
   positively. State changes are logged.
5. **Grace by default.** Missed routines skip (never stack into overdue piles). `someday`
   items decay (one "still relevant?" prompt, then fade). Inbox shows age, not a guilt
   counter. No streaks, real or disguised.
6. **Energy & context.** Items carry `energy` (low/medium/high) and `context` tags
   (`@focus`, `@errand`, ...). Today supports an "I have X minutes, feeling Y" filter.
   `kind: event` (commitments) renders distinctly from `kind: task` (movable, mine).
7. **Nudges, never nagging.** All nudges are calm, dismissible, rate-limited (one at a
   time), and silenced for paused domains.
8. **Honesty about scope.** Personal command center, not a family coordinator. No
   over-promising on shared responsibilities.
9. **Data trust early.** Export, backup, account recovery, sensitive-data handling.

## Data model (canonical)

| Entity | Purpose | Key fields |
|--------|---------|-----------|
| `Domain` | Life domain / dashboard | `name`, `color`, `icon`, `season`, `season_note`, `reflection_only`, `sort_order` |
| `Standard` | What "good enough" looks like | `domain_id`, `text`, `kind` (countable\|reflection), `cadence`, `target`, `active` |
| `ReflectionEntry` | Periodic self-rating/note | `domain_id`, `standard_id?`, `rating` (1-5), `note`, `period_start` |
| `Priority` | What matters this period | `domain_id?`, `title`, `horizon` (week), `status`, `period_start` |
| `Routine` | Recurring generator | `domain_id?`, `standard_id?`, `title`, `rrule`, `default_energy`, `default_context`, `default_duration_minutes`, `active`, `last_generated_date` |
| `Item` | Capture / next action / event | `status`, `kind`, `domain_id?`, `priority_id?`, `routine_id?`, `standard_id?`, `energy`, `context[]`, `scheduled_at`, `duration_minutes`, `deadline_at`, `urgency`, `rrule`, `source`, `external_id`, `external_calendar_id`, `someday_reviewed_at`, `completed_at`, `labels[]`, `reminders[]` |
| `Label` | Optional color tag | `name`, `color` |
| `Reminder` | Reminder entry | `item_id`, `remind_at`, `offset_type` |
| `CalendarConnection` | Synced satellite account | `provider` (google\|outlook), `account_email`, encrypted tokens, `sync_token`, `calendar_id`, `status`, `last_synced_at` |
| `DomainStateLog` | Season change audit | `domain_id`, `from_state`, `to_state`, `note` |
| `Review` | Review ritual records | `type` (daily\|weekly), `status` (completed\|deferred), `deferred_reason`, `deferred_until`, `completed_at` |
| `PushSubscription` | Web-push endpoint | `endpoint`, `p256dh`, `auth` |

`User` gains `recovery_email`, `recovery_code_hash`, `recovery_code_expires_at`.

## Navigation (5 surfaces + global capture)

- **Capture** (global): quick-add, defaults to Inbox, optional natural-language parse.
- **Today** (home): this week's priorities + merged agenda + energy/context filter.
- **Inbox**: clarify surface (domain + priority + energy/context + schedule); shows age.
- **Calendar**: tasks + external events (rendered distinctly); overcommitment warning.
- **Domains**: conscious-attention dashboard (focus + wins first, seasons, gentle invitations).
- **Review**: lightweight skippable daily/weekly ritual with nudges + defer-with-comment.

## Phasing

1. Model + backend end-to-end + Capture/Inbox/Today.
2. Domains dashboard + standards + seasons + priorities + routines + Calendar + Review.
3. Nudges + grace mechanics + data trust (export/backup/recovery).
4. PWA (offline capture, install, web-push).
5. Calendar sync (Google then Outlook).
6. Onboarding + natural-language capture + polish.

## What we keep

React 19 / Vite / Tailwind / shadcn / Zustand / FullCalendar engine, the shadcn UI
library, the data-provider abstraction, FastAPI / SQLAlchemy / Alembic / Postgres, auth,
and build/deploy tooling. We redesign the data model, stores, navigation, the surfaces,
and finish the backend service/route layer against the new model.
