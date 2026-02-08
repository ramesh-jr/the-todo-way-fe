// ============================================================
// LandingPage — Split pane: InboxPanel + CalendarPanel
// with FullCalendar external drag-and-drop from inbox to calendar.
// Ref: docs/build-guide.md FE-8, docs/lld-frontend.md §4
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import FullCalendar from "@fullcalendar/react"
import type { EventClickArg, EventDropArg } from "@fullcalendar/core"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin, { Draggable } from "@fullcalendar/interaction"
import type {
  DateClickArg,
  EventReceiveArg,
  EventResizeDoneArg,
} from "@fullcalendar/interaction"
import timeGridPlugin from "@fullcalendar/timegrid"

import { Inbox, Plus } from "lucide-react"

import { diffInMinutes, formatDuration, todoToFCEvent } from "@/lib/calendarUtils"
import { getFilteredTodos, useTodoStore } from "@/stores/todoStore"
import { useUIStore } from "@/stores/uiStore"

import { CalendarToolbar } from "@/components/calendar/CalendarToolbar"
import { CreateTodoDialog } from "@/components/todo/CreateTodoDialog"
import { TodoCard } from "@/components/todo/TodoCard"
import { TodoDetailPopup } from "@/components/todo/TodoDetailPopup"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

import "@/styles/fullcalendar.css"

// ─── Constants ──────────────────────────────────────────────

const DEFAULT_DURATION_MINUTES = 30

// ─── Component ──────────────────────────────────────────────

export default function LandingPage() {
  const calendarRef = useRef<FullCalendar>(null)
  const inboxRef = useRef<HTMLDivElement>(null)

  // ─── Stores ─────────────────────────────────────────────

  const todos = useTodoStore((s) => s.todos)
  const isLoading = useTodoStore((s) => s.isLoading)
  const sortBy = useTodoStore((s) => s.sortBy)
  const sortOrder = useTodoStore((s) => s.sortOrder)
  const filters = useTodoStore((s) => s.filters)
  const fetchTodos = useTodoStore((s) => s.fetchTodos)
  const scheduleTodo = useTodoStore((s) => s.scheduleTodo)
  const updateTodo = useTodoStore((s) => s.updateTodo)

  const calendarView = useUIStore((s) => s.calendarView)
  const setCalendarView = useUIStore((s) => s.setCalendarView)
  const openTodoDetail = useUIStore((s) => s.openTodoDetail)
  const openCreateDialog = useUIStore((s) => s.openCreateDialog)

  // ─── Local state ────────────────────────────────────────

  const [toolbarTitle, setToolbarTitle] = useState("")

  // ─── Fetch todos on mount ───────────────────────────────

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  // ─── Derive incomplete todos for the inbox ─────────────

  const inboxTodos = useMemo(
    () => getFilteredTodos({ todos, filters, sortBy, sortOrder }),
    [todos, filters, sortBy, sortOrder],
  )

  // ─── Derive FC events from scheduled todos ─────────────

  const events = useMemo(() => {
    const scheduled: ReturnType<typeof todoToFCEvent>[] = []
    for (const todo of todos.values()) {
      if (todo.scheduled_date && !todo.is_completed) {
        scheduled.push(todoToFCEvent(todo))
      }
    }
    return scheduled
  }, [todos])

  // ─── Initialize FullCalendar Draggable on inbox ────────

  useEffect(() => {
    const el = inboxRef.current
    if (!el) return

    const draggable = new Draggable(el, {
      itemSelector: ".todo-card",
      eventData: (eventEl) => {
        const dataEvent = eventEl.getAttribute("data-event")
        if (dataEvent) {
          try {
            return JSON.parse(dataEvent) as Record<string, unknown>
          } catch {
            // fallback below
          }
        }
        return { title: "Untitled", duration: "00:30" }
      },
    })

    return () => {
      draggable.destroy()
    }
  }, [])

  // ─── Sync calendar view with uiStore ────────────────────

  useEffect(() => {
    const api = calendarRef.current?.getApi()
    if (api && api.view.type !== calendarView) {
      api.changeView(calendarView)
    }
  }, [calendarView])

  // ─── Toolbar title update ───────────────────────────────

  const updateTitle = useCallback(() => {
    const api = calendarRef.current?.getApi()
    if (api) {
      setToolbarTitle(api.view.title)
    }
  }, [])

  // ─── Toolbar navigation ─────────────────────────────────

  const handleToday = useCallback(() => {
    const api = calendarRef.current?.getApi()
    if (api) {
      api.today()
      updateTitle()
    }
  }, [updateTitle])

  const handlePrev = useCallback(() => {
    const api = calendarRef.current?.getApi()
    if (api) {
      api.prev()
      updateTitle()
    }
  }, [updateTitle])

  const handleNext = useCallback(() => {
    const api = calendarRef.current?.getApi()
    if (api) {
      api.next()
      updateTitle()
    }
  }, [updateTitle])

  // ─── FullCalendar event handlers ────────────────────────

  /** External drop from inbox → schedule the todo */
  const handleEventReceive = useCallback(
    (info: EventReceiveArg) => {
      const todoId = info.draggedEl.getAttribute("data-todo-id")
      if (todoId && info.event.start) {
        scheduleTodo(todoId, info.event.start, DEFAULT_DURATION_MINUTES)
        // Remove the FullCalendar-generated event — our store-derived
        // events list will re-render it from state.
        info.event.remove()
      }
    },
    [scheduleTodo],
  )

  /** Click on an event → open TodoDetailPopup */
  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      const todoId = info.event.extendedProps.todoId as string
      if (todoId) {
        openTodoDetail(todoId)
      }
    },
    [openTodoDetail],
  )

  /** Click on an empty date/time → open CreateTodoDialog with date pre-filled */
  const handleDateClick = useCallback(
    (info: DateClickArg) => {
      openCreateDialog({
        scheduled_date: info.dateStr,
      })
    },
    [openCreateDialog],
  )

  /** Internal drag → reschedule */
  const handleEventDrop = useCallback(
    (info: EventDropArg) => {
      const todoId = info.event.extendedProps.todoId as string
      if (todoId && info.event.start) {
        scheduleTodo(todoId, info.event.start)
      }
    },
    [scheduleTodo],
  )

  /** Resize → update duration */
  const handleEventResize = useCallback(
    (info: EventResizeDoneArg) => {
      const todoId = info.event.extendedProps.todoId as string
      if (todoId && info.event.start && info.event.end) {
        const newDuration = diffInMinutes(info.event.start, info.event.end)
        updateTodo(todoId, { duration_minutes: newDuration })
      }
    },
    [updateTodo],
  )

  /** Called whenever FC's dates/view changes */
  const handleDatesSet = useCallback(() => {
    const api = calendarRef.current?.getApi()
    if (api) {
      setToolbarTitle(api.view.title)
      // Keep uiStore in sync if the view changed (e.g. via FC internal nav)
      const currentView = api.view.type
      if (currentView !== calendarView) {
        setCalendarView(currentView as typeof calendarView)
      }
    }
  }, [calendarView, setCalendarView])

  // ─── Custom event content renderer ──────────────────────

  const renderEventContent = useCallback(
    (eventInfo: {
      event: { title: string; extendedProps: Record<string, unknown> }
      timeText: string
    }) => {
      const durationMinutes = eventInfo.event.extendedProps.durationMinutes as
        | number
        | null
      return (
        <div className="fc-event-title-container">
          <span className="fc-event-title-text">{eventInfo.event.title}</span>
          {durationMinutes && (
            <span className="fc-event-duration-text">
              {formatDuration(durationMinutes)}
            </span>
          )}
        </div>
      )
    },
    [],
  )

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Inbox Panel (left ~35%) ── */}
      <div className="relative flex w-[35%] min-w-[280px] flex-col border-r border-border">
        {/* Inbox header */}
        <div className="shrink-0 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Inbox className="size-5 text-primary" />
            <h2 className="text-base font-semibold">Inbox</h2>
            <span className="text-xs text-muted-foreground">
              {inboxTodos.length} todo{inboxTodos.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Drag todos to the calendar to schedule
          </p>
        </div>

        {/* Inbox todo list (scrollable, Draggable container) */}
        <ScrollArea className="flex-1">
          <div ref={inboxRef} className="space-y-2 p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <p className="text-sm">Loading…</p>
              </div>
            ) : inboxTodos.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
                <Inbox className="size-8 opacity-40" />
                <p className="text-sm">No todos yet.</p>
                <Button size="sm" onClick={() => openCreateDialog()}>
                  <Plus className="size-4" />
                  Create todo
                </Button>
              </div>
            ) : (
              inboxTodos.map((todo) => (
                <TodoCard key={todo.id} todo={todo} draggable />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Floating + button (within inbox panel) */}
        <Button
          size="icon"
          className="absolute bottom-4 right-4 z-10 size-12 rounded-full shadow-lg"
          onClick={() => openCreateDialog()}
          aria-label="Create new todo"
        >
          <Plus className="size-5" />
        </Button>
      </div>

      {/* ── Calendar Panel (right ~65%) ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Calendar toolbar */}
        <CalendarToolbar
          title={toolbarTitle}
          onToday={handleToday}
          onPrev={handlePrev}
          onNext={handleNext}
        />

        {/* FullCalendar (droppable) */}
        <div className="flex-1 overflow-auto p-2">
          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
            initialView={calendarView}
            headerToolbar={false}
            views={{
              timeGridWorkWeek: {
                type: "timeGrid",
                duration: { weeks: 1 },
                weekends: false,
              },
              timeGridThreeDay: {
                type: "timeGrid",
                duration: { days: 3 },
              },
            }}
            // Time settings
            slotMinTime="06:00:00"
            slotMaxTime="24:00:00"
            slotDuration="00:15:00"
            // Features
            nowIndicator
            editable
            selectable
            droppable
            eventResizableFromStart
            // Events
            events={events}
            eventContent={renderEventContent}
            // Callbacks — external drop + internal handlers
            eventReceive={handleEventReceive}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            datesSet={handleDatesSet}
            // Sizing
            height="100%"
            stickyHeaderDates
            // Day grid (month) settings
            dayMaxEvents={4}
          />
        </div>
      </div>

      {/* ── Dialogs ── */}
      <CreateTodoDialog />
      <TodoDetailPopup />
    </div>
  )
}
