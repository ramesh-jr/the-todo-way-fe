# The Todo Way - Frontend Low-Level Design

> **Version**: v1 | **Created**: 2026-02-07 | **Last Updated**: 2026-02-07
> **Scope**: Frontend-specific implementation details. For full project LLD see docs/lld.md.

---

## 1. Routing

```
/                     -> LandingPage (Inbox | Calendar split)
/inbox                -> InboxPage (full-width inbox)
/calendar             -> CalendarPage (mini-cal + full calendar)
/todos                -> TodosPage (sections/subsections view)
/login                -> LoginPage
```

All routes except `/login` wrapped in `AuthGuard` (checks localStorage for auth flag).

---

## 2. Type Definitions (`src/types/`)

```typescript
interface Todo {
  id: string
  title: string
  description: string | null
  scheduled_date: string | null       // ISO 8601
  deadline_date: string | null
  duration_minutes: number | null     // 5-480
  priority: 'p1' | 'p2' | 'p3' | 'p4'
  location: string | null
  is_completed: boolean
  completed_at: string | null
  section_id: string | null
  subsection_id: string | null
  labels: Label[]
  reminders: Reminder[]
  created_at: string
  updated_at: string
}

interface Section {
  id: string
  name: string
  sort_order: number
  subsections: Subsection[]
}

interface Subsection {
  id: string
  name: string
  sort_order: number
  section_id: string
}

interface Label {
  id: string
  name: string
  color: string   // hex
}

interface Reminder {
  id: string
  remind_at: string
  type: 'before_5min' | 'before_15min' | 'before_30min' | 'before_1hr' | 'custom'
}

type Priority = 'p1' | 'p2' | 'p3' | 'p4'
type CalendarView = 'timeGridDay' | 'timeGridThreeDay' | 'timeGridWorkWeek' | 'timeGridWeek' | 'dayGridMonth'
type SortField = 'scheduled_date' | 'priority' | 'created_at' | 'deadline_date'

interface CreateTodoInput {
  title: string
  description?: string | null
  scheduled_date?: string | null
  deadline_date?: string | null
  duration_minutes?: number | null
  priority?: Priority
  location?: string | null
  section_id?: string | null
  subsection_id?: string | null
  label_ids?: string[]
}

type UpdateTodoInput = Partial<CreateTodoInput>
```

---

## 3. Zustand Stores

### 3.1 todoStore

```typescript
interface TodoState {
  todos: Map<string, Todo>
  isLoading: boolean
  error: string | null
  sortBy: SortField
  sortOrder: 'asc' | 'desc'
  filters: {
    sectionId: string | null
    labelIds: string[]
    priority: Priority | null
    showCompleted: boolean  // default false
  }

  fetchTodos: () => void
  createTodo: (data: CreateTodoInput) => Todo
  updateTodo: (id: string, data: Partial<Todo>) => void
  deleteTodo: (id: string) => void
  toggleComplete: (id: string) => void
  scheduleTodo: (id: string, date: Date, durationMinutes?: number) => void
  setSortBy: (field: SortField) => void
  setSortOrder: (order: 'asc' | 'desc') => void
  setFilters: (filters: Partial<TodoState['filters']>) => void
}
```

Reads from `dataProvider.todos.list()` on init. Mutations are in-memory (static data phase).

### 3.2 sectionStore

```typescript
interface SectionState {
  sections: Section[]
  labels: Label[]
  isLoading: boolean
  fetchSections: () => void
  fetchLabels: () => void
  createSection: (name: string) => Section
  deleteSection: (id: string) => void
  createSubsection: (sectionId: string, name: string) => void
  createLabel: (name: string, color: string) => Label
  deleteLabel: (id: string) => void
}
```

### 3.3 uiStore (persisted to localStorage)

```typescript
interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  calendarView: CalendarView
  todoCardDisplayFields: {
    showDate: boolean
    showDeadline: boolean
    showDuration: boolean
    showPriority: boolean
    showLabels: boolean
    showSection: boolean
  }
  selectedTodoId: string | null
  isCreateDialogOpen: boolean
  createDialogDefaults: Partial<CreateTodoInput> | null

  toggleSidebar: () => void
  setTheme: (t: 'light' | 'dark' | 'system') => void
  setCalendarView: (v: CalendarView) => void
  openTodoDetail: (id: string) => void
  closeTodoDetail: () => void
  openCreateDialog: (defaults?: Partial<CreateTodoInput>) => void
  closeCreateDialog: () => void
  toggleCardDisplayField: (field: string) => void
}
```

---

## 4. Component Hierarchy

### TodoCard
```
TodoCard (props: { todo: Todo, draggable?: boolean })
  ├── PriorityIndicator (colored left border: border-l-2)
  ├── CompleteCheckbox (circle, click -> toggleComplete)
  ├── TodoTitle (text-sm font-medium, truncated)
  ├── TodoMeta (conditional on uiStore.todoCardDisplayFields)
  │    ├── DateBadge (calendar icon + formatted date)
  │    ├── DeadlineBadge (flag icon + deadline)
  │    ├── DurationBadge (clock icon + "1h 30m")
  │    └── LabelTags (colored pills)
  └── data-event, data-title, data-duration, data-todo-id (when draggable=true)
```

### CreateTodoDialog
```
CreateTodoDialog (shadcn Dialog)
  ├── TitleInput (required)
  ├── DescriptionTextarea
  ├── DateTimePicker (shadcn Calendar + time)
  ├── DeadlinePicker
  ├── DurationSelect (15m, 30m, 45m, 1h, 1.5h, 2h, custom)
  ├── PrioritySelect (P1-P4, colored dots)
  ├── SectionSelect (from sectionStore)
  ├── SubsectionSelect (filtered by section)
  ├── LabelMultiSelect (combobox)
  ├── LocationInput (text)
  ├── ReminderSelect
  └── Save / Cancel buttons
```

### TodoDetailPopup
```
TodoDetailPopup (shadcn Dialog, opened via uiStore.selectedTodoId)
  ├── All fields from CreateTodoDialog in view/edit mode
  ├── Inline editing (click to edit)
  ├── Delete button (with confirmation dialog)
  └── Close button
```

### CalendarPage
```
CalendarPage
  ├── MiniCalendar (react-day-picker / shadcn Calendar, left panel)
  ├── CalendarToolbar (view switcher, today, prev/next)
  └── FullCalendarWrapper
       └── <FullCalendar ... />  (see fullcalendar.mdc rule for full config)
```

### LandingPage
```
LandingPage
  ├── InboxPanel (left ~35%)
  │    ├── InboxHeader + sort/filter
  │    ├── TodoCard[] (draggable=true, with FullCalendar Draggable)
  │    └── + FAB
  └── CalendarPanel (right ~65%)
       └── FullCalendarWrapper (droppable=true)
```

---

## 5. FullCalendar Event Mapping

```typescript
const priorityColors = { p1: '#EF4444', p2: '#F97316', p3: '#3B82F6', p4: '#94A3B8' }

function todoToFCEvent(todo: Todo): EventInput {
  return {
    id: todo.id,
    title: todo.title,
    start: todo.scheduled_date ?? undefined,
    end: todo.scheduled_date && todo.duration_minutes
      ? addMinutes(new Date(todo.scheduled_date), todo.duration_minutes).toISOString()
      : undefined,
    allDay: false,
    backgroundColor: priorityColors[todo.priority],
    borderColor: priorityColors[todo.priority],
    extendedProps: { todoId: todo.id, priority: todo.priority }
  }
}
```

---

## 6. Data Provider (Swap Point)

```typescript
// src/data/provider.ts -- THE SINGLE SWAP POINT
import todosData from './todos.json'
import sectionsData from './sections.json'
import labelsData from './labels.json'

export const dataProvider = {
  todos: {
    list: (): Todo[] => todosData as Todo[],
    get: (id: string) => (todosData as Todo[]).find(t => t.id === id),
  },
  sections: { list: (): Section[] => sectionsData as Section[] },
  labels: { list: (): Label[] => labelsData as Label[] },
}

// When BE ready, swap to:
// export { apiDataProvider as dataProvider } from './apiProvider'
```

---

## 7. Build Conversations (FE-1 through FE-10)

- **FE-1**: Vite + React + Tailwind + shadcn/ui + FullCalendar packages + design system tokens + data provider
- **FE-2**: Type definitions + Zustand stores (todoStore, sectionStore, uiStore)
- **FE-3**: MainLayout + Sidebar + TopBar + routing
- **FE-4**: LoginPage
- **FE-5**: TodoCard + CreateTodoDialog + TodoDetailPopup
- **FE-6**: InboxPage with filtering/sorting
- **FE-7**: CalendarPage with FullCalendar
- **FE-8**: LandingPage with drag-and-drop
- **FE-9**: TodosPage with sections accordion
- **FE-10**: Dark/light theme
