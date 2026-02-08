# The Todo Way - Frontend Build Guide

> **Purpose**: Copy-paste ready conversation prompts for each build step. Open a new Cursor conversation, paste the prompt, and the AI has everything it needs.
> **Created**: 2026-02-07

---

## How to Use

1. Open `/Users/ramesh.subramanian/Documents/Development/Github/the-todo-way-fe` as your Cursor workspace
2. Start a new chat (Cmd+L)
3. Copy-paste the prompt for the current task
4. The AI will auto-receive `.cursor/rules/*.mdc` files and read `AGENTS.md` + docs
5. After completion, verify the commit and move to the next task

---

## FE-1: Project Setup

```
Read AGENTS.md. Then do FE-1: Initialize the project with Vite + React 19 + TypeScript. 
Install and configure Tailwind CSS 4, shadcn/ui, React Router v7, Zustand, React Hook Form, 
Zod, Axios, Lucide React, and the Inter font. Install FullCalendar packages 
(@fullcalendar/core, @fullcalendar/react, @fullcalendar/timegrid, @fullcalendar/daygrid, 
@fullcalendar/interaction). Configure the @ path alias in vite.config.ts and tsconfig.json. 
Set up the design system CSS tokens in src/styles/globals.css per docs/design-system.md. 
Create src/data/provider.ts per docs/lld-frontend.md Section 6. Set up ESLint flat config 
and Prettier. Commit with message "feat: initialize project with React, Tailwind, shadcn/ui, 
and FullCalendar".
```

## FE-2: Types, Stores, Data Provider

```
Read AGENTS.md and docs/lld-frontend.md Sections 2 and 3. Then do FE-2: 
Create all TypeScript type definitions in src/types/ per Section 2 (Todo, Section, 
Subsection, Label, Reminder, Priority, CalendarView, SortField, CreateTodoInput, 
UpdateTodoInput). Create Zustand stores per Section 3: todoStore.ts (reads from 
dataProvider, in-memory mutations), sectionStore.ts, uiStore.ts (with persist middleware 
to localStorage). Commit with message "feat: add type definitions and Zustand stores".
```

## FE-3: Layout and Routing

```
Read AGENTS.md and docs/lld-frontend.md Section 1. Then do FE-3: Build the MainLayout 
component with a collapsible Sidebar (260px, shows sections from sectionStore, navigation 
links for Inbox/Calendar/Todos), a TopBar (app name, + create button, theme toggle 
placeholder, sidebar toggle), and React Router routing for /, /inbox, /calendar, /todos, 
/login with placeholder page components. Wrap authenticated routes in an AuthGuard that 
checks localStorage. Commit with message "feat: add main layout with sidebar, topbar, 
and routing".
```

## FE-4: Login Page

```
Read AGENTS.md. Then do FE-4: Build the LoginPage at /login. Simple centered card with 
the app name "The Todo Way", a password input field, and a login button. On submit, 
store an auth flag in localStorage and redirect to /. Use the design system tokens for 
styling. No real auth -- just a gate. Commit with message "feat: add login page".
```

## FE-5: Todo Components

```
Read AGENTS.md and docs/lld-frontend.md Section 4. Then do FE-5: Build three components:
1) TodoCard -- displays todo with priority-colored left border, title, conditional meta 
   fields (date, deadline, duration, labels) based on uiStore.todoCardDisplayFields, 
   complete checkbox. Accepts draggable prop for data-event attributes.
2) CreateTodoDialog -- shadcn Dialog with form for all 10 fields (title, description, 
   date/time picker, deadline picker, duration select, priority select, section select, 
   subsection select, label multi-select, location input, reminder select). Uses React 
   Hook Form + Zod. Calls todoStore.createTodo on submit.
3) TodoDetailPopup -- shadcn Dialog triggered by uiStore.selectedTodoId. Shows all todo 
   fields in view/edit mode. Inline editing. Delete with confirmation.
Commit with message "feat: add TodoCard, CreateTodoDialog, and TodoDetailPopup".
```

## FE-6: Inbox Page

```
Read AGENTS.md. Then do FE-6: Build the InboxPage at /inbox. Shows all incomplete todos 
from todoStore as TodoCard components in a scrollable list. Add a sort-by dropdown 
(date, priority, created, deadline) and sort-order toggle. Add filter controls: section 
dropdown, label multi-select, priority select. Add a floating + button that opens 
CreateTodoDialog. Add a settings gear icon that opens a popover to toggle 
todoCardDisplayFields in uiStore. Commit with message "feat: add inbox page with 
filtering and sorting".
```

## FE-7: Calendar Page

```
Read AGENTS.md and docs/lld-frontend.md Section 5. Then do FE-7: Build the CalendarPage 
at /calendar. Left panel: MiniCalendar using shadcn/ui Calendar (react-day-picker), 
clicking a date navigates the main calendar. Right panel: FullCalendar with TimeGrid, 
configured per .cursor/rules/fullcalendar.mdc -- all 5 views (Day, 3-Day, Work Week, 
Week, Month), slotMinTime/slotMaxTime, nowIndicator. Map todos from todoStore to FC 
events using todoToFCEvent from Section 5. Custom eventContent renderer showing title + 
duration. Wire eventClick to open TodoDetailPopup, dateClick to open CreateTodoDialog 
with date pre-filled, eventDrop to todoStore.scheduleTodo, eventResize to update 
duration. Add CalendarToolbar with view switcher buttons. Create 
src/styles/fullcalendar.css for theme overrides. Commit with message "feat: add calendar 
page with FullCalendar integration".
```

## FE-8: Landing Page with Drag-and-Drop

```
Read AGENTS.md and docs/lld-frontend.md Section 4 (LandingPage). Then do FE-8: Build 
the LandingPage at / (default route). Split pane layout: InboxPanel (left ~35%) and 
CalendarPanel (right ~65%). InboxPanel shows incomplete todos as TodoCards with 
draggable=true. Initialize FullCalendar Draggable on the inbox container with 
itemSelector='.todo-card' and eventData function that reads data-* attributes. 
CalendarPanel uses FullCalendarWrapper with droppable=true. Wire eventReceive to call 
todoStore.scheduleTodo with the dropped date/time and default 30min duration. Ensure 
internal event drag/resize also works. Add a floating + button in the inbox panel. 
Commit with message "feat: add landing page with inbox-to-calendar drag-and-drop".
```

## FE-9: Todos Page

```
Read AGENTS.md. Then do FE-9: Build the TodosPage at /todos. Show sections from 
sectionStore as collapsible accordions (use shadcn Accordion). Each section expands to 
show subsections, each subsection shows its todos as TodoCard components. Todos with 
no section shown in an "Unsorted" group at the top. Add a + button per section to 
create a todo pre-assigned to that section. Add ability to create new sections and 
subsections via inline input. Commit with message "feat: add todos page with 
section/subsection accordion".
```

## FE-10: Dark/Light Theme

```
Read AGENTS.md and docs/design-system.md. Then do FE-10: Implement theme switching. 
Detect system preference via window.matchMedia('(prefers-color-scheme: dark)'). Store 
preference in uiStore (persisted to localStorage). Apply/remove .dark class on <html>. 
Add a theme toggle button in TopBar (sun/moon icon from Lucide). Ensure all components 
use semantic tokens that auto-switch. Update src/styles/fullcalendar.css with .dark 
overrides for FullCalendar CSS variables (--fc-border-color, --fc-page-bg-color, 
--fc-neutral-bg-color, etc.). Test both themes visually. Commit with message "feat: add 
dark/light theme with system preference detection".
```

---

## Troubleshooting Prompts

### If context runs out mid-task:
```
Continue [task name, e.g. FE-7]. Read AGENTS.md. Check git log and git diff for what 
was already done. Finish the remaining work and commit.
```

### If something breaks:
```
Read AGENTS.md. There's a bug in [describe the issue]. Read [file path] and fix it. 
Commit with message "fix: [description]".
```

### If you need to refactor:
```
Read AGENTS.md. Refactor [component/module] to [what you want changed]. Follow the 
patterns in .cursor/rules/. Commit with message "refactor: [description]".
```
