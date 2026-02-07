# The Todo Way - Low-Level Design

> **Version**: v1 | **Created**: 2026-02-07 | **Last Updated**: 2026-02-07

## 1. Routing

```
/                     -> LandingPage (Inbox | Calendar split)
/inbox                -> InboxPage (full-width inbox)
/calendar             -> CalendarPage (mini-cal + full calendar)
/todos                -> TodosPage (sections/subsections view)
/login                -> LoginPage
```

All routes except `/login` wrapped in `AuthGuard`.

## 2. Type Definitions

```typescript
// types/todo.ts
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
```

## 3. Zustand Stores

### todoStore

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
    showCompleted: boolean  // false default
  }

  fetchTodos: () => void
  createTodo: (data: CreateTodoInput) => Todo
  updateTodo: (id: string, data: Partial<Todo>) => void
  deleteTodo: (id: string) => void
  toggleComplete: (id: string) => void
  scheduleTodo: (id: string, date: Date, durationMinutes?: number) => void
  setSortBy: (field: SortField) => void
  setSortOrder: (order: 'asc' | 'desc') => void
  setFilters: (filters: Partial<Filters>) => void
}
```

### sectionStore

```typescript
interface SectionState {
  sections: Section[]
  labels: Label[]
  isLoading: boolean

  fetchSections: () => void
  fetchLabels: () => void
  createSection: (name: string) => Section
  updateSection: (id: string, name: string) => void
  deleteSection: (id: string) => void
  createSubsection: (sectionId: string, name: string) => void
  createLabel: (name: string, color: string) => Label
  updateLabel: (id: string, name: string, color: string) => void
  deleteLabel: (id: string) => void
}
```

### uiStore (persisted to localStorage)

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
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setCalendarView: (view: CalendarView) => void
  openTodoDetail: (id: string) => void
  closeTodoDetail: () => void
  openCreateDialog: (defaults?: Partial<CreateTodoInput>) => void
  closeCreateDialog: () => void
  toggleCardDisplayField: (field: string) => void
}
```

## 4. Component Hierarchy

### TodoCard

```
TodoCard (props: { todo: Todo, draggable?: boolean })
  ├── PriorityIndicator (colored left border)
  ├── CompleteCheckbox (circle, click toggleComplete)
  ├── TodoTitle (truncated)
  ├── TodoMeta (conditional on uiStore.todoCardDisplayFields)
  │    ├── DateBadge (if showDate && scheduled_date)
  │    ├── DeadlineBadge (if showDeadline && deadline_date)
  │    ├── DurationBadge (if showDuration && duration_minutes)
  │    └── LabelTags (if showLabels && labels.length)
  └── data-* attributes (when draggable, for FullCalendar Draggable)
```

### CreateTodoDialog

```
CreateTodoDialog (form with all 10 fields)
  ├── TitleInput (required, text)
  ├── DescriptionTextarea (optional)
  ├── DateTimePicker (shadcn Calendar + time select)
  ├── DeadlinePicker (shadcn Calendar)
  ├── DurationSelect (presets: 15m, 30m, 45m, 1h, 1.5h, 2h, custom)
  ├── PrioritySelect (P1-P4, colored dots)
  ├── SectionSelect (dropdown from sectionStore)
  ├── SubsectionSelect (filtered by selected section)
  ├── LabelMultiSelect (combobox)
  ├── LocationInput (text)
  ├── ReminderSelect (multi-select presets, stored for future)
  └── ActionButtons (Save, Cancel)
```

### TodoDetailPopup

```
TodoDetailPopup (triggered by clicking any todo anywhere)
  ├── Same fields as CreateTodoDialog in view/edit mode
  ├── Inline editing (click field to edit)
  ├── Delete button (with confirmation)
  └── Close button
```

### CalendarPage

```
CalendarPage
  ├── MiniCalendar (react-day-picker, left panel)
  ├── CalendarToolbar (view switcher, today, prev/next)
  └── FullCalendarWrapper
       └── <FullCalendar
              plugins, views, editable, droppable, selectable,
              nowIndicator, slotMinTime/slotMaxTime,
              eventContent, eventClick, eventDrop,
              eventResize, eventReceive, dateClick
           />
```

### LandingPage

```
LandingPage
  ├── InboxPanel (left ~35%, scrollable)
  │    ├── InboxHeader + sort/filter controls
  │    ├── TodoCard[] (draggable=true)
  │    └── AddTodoFAB (+)
  └── CalendarPanel (right ~65%)
       └── FullCalendarWrapper (droppable)
```

## 5. FullCalendar Event Mapping

```typescript
const priorityColors = {
  p1: '#EF4444', p2: '#F97316', p3: '#3B82F6', p4: '#94A3B8'
}

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

## 6. Data Provider (Static JSON -> API Swap)

```typescript
// src/data/provider.ts
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
```

Stores call `dataProvider`. In-memory mutations. Swap to apiProvider.ts when BE is ready.

## 7. API Endpoints (Future Backend)

- `POST /api/auth/login`, `POST /api/auth/setup`
- `GET/POST /api/todos`, `GET/PUT/DELETE /api/todos/{id}`
- `PATCH /api/todos/{id}/complete`, `PATCH /api/todos/{id}/schedule`
- `GET/POST /api/sections`, `PUT/DELETE /api/sections/{id}`
- `POST /api/sections/{id}/subsections`, `PUT/DELETE /api/subsections/{id}`
- `GET/POST /api/labels`, `PUT/DELETE /api/labels/{id}`

Response format: `{ data, error, meta: { total, page, per_page, total_pages } }`
