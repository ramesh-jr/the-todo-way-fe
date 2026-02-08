// ============================================================
// CalendarPage — Full calendar view with MiniCalendar sidebar
// Left panel: MiniCalendar (react-day-picker)
// Right panel: FullCalendar with 5 views + all event handlers
// Ref: docs/build-guide.md FE-7
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import FullCalendar from "@fullcalendar/react"
import type { EventClickArg, EventDropArg } from "@fullcalendar/core"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import type { DateClickArg, EventResizeDoneArg } from "@fullcalendar/interaction"
import timeGridPlugin from "@fullcalendar/timegrid"

import { diffInMinutes, formatDuration, todoToFCEvent } from "@/lib/calendarUtils"
import { useTodoStore } from "@/stores/todoStore"
import { useUIStore } from "@/stores/uiStore"

import { CalendarToolbar } from "@/components/calendar/CalendarToolbar"
import { MiniCalendar } from "@/components/calendar/MiniCalendar"
import { CreateTodoDialog } from "@/components/todo/CreateTodoDialog"
import { TodoDetailPopup } from "@/components/todo/TodoDetailPopup"

import "@/styles/fullcalendar.css"

// ─── Component ──────────────────────────────────────────────

export default function CalendarPage() {
  const calendarRef = useRef<FullCalendar>(null)

  // ─── Stores ─────────────────────────────────────────────

  const todos = useTodoStore((s) => s.todos)
  const fetchTodos = useTodoStore((s) => s.fetchTodos)
  const scheduleTodo = useTodoStore((s) => s.scheduleTodo)
  const updateTodo = useTodoStore((s) => s.updateTodo)

  const calendarView = useUIStore((s) => s.calendarView)
  const setCalendarView = useUIStore((s) => s.setCalendarView)
  const openTodoDetail = useUIStore((s) => s.openTodoDetail)
  const openCreateDialog = useUIStore((s) => s.openCreateDialog)

  // ─── Local state ────────────────────────────────────────

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [toolbarTitle, setToolbarTitle] = useState("")

  // ─── Fetch todos on mount ───────────────────────────────

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  // ─── Derive FC events from todos ────────────────────────

  const events = useMemo(() => {
    const scheduled: ReturnType<typeof todoToFCEvent>[] = []
    for (const todo of todos.values()) {
      if (todo.scheduled_date && !todo.is_completed) {
        scheduled.push(todoToFCEvent(todo))
      }
    }
    return scheduled
  }, [todos])

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

  // ─── MiniCalendar → navigate FullCalendar ───────────────

  const handleMiniCalendarSelect = useCallback(
    (date: Date) => {
      setSelectedDate(date)
      const api = calendarRef.current?.getApi()
      if (api) {
        api.gotoDate(date)
        updateTitle()
      }
    },
    [updateTitle],
  )

  // ─── Toolbar navigation ─────────────────────────────────

  const handleToday = useCallback(() => {
    const api = calendarRef.current?.getApi()
    if (api) {
      api.today()
      setSelectedDate(new Date())
      updateTitle()
    }
  }, [updateTitle])

  const handlePrev = useCallback(() => {
    const api = calendarRef.current?.getApi()
    if (api) {
      api.prev()
      setSelectedDate(api.getDate())
      updateTitle()
    }
  }, [updateTitle])

  const handleNext = useCallback(() => {
    const api = calendarRef.current?.getApi()
    if (api) {
      api.next()
      setSelectedDate(api.getDate())
      updateTitle()
    }
  }, [updateTitle])

  // ─── FullCalendar event handlers ────────────────────────

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

  /** Drag an event to a new time → reschedule */
  const handleEventDrop = useCallback(
    (info: EventDropArg) => {
      const todoId = info.event.extendedProps.todoId as string
      if (todoId && info.event.start) {
        scheduleTodo(todoId, info.event.start)
      }
    },
    [scheduleTodo],
  )

  /** Resize an event → update duration */
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
    (eventInfo: { event: { title: string; extendedProps: Record<string, unknown> }; timeText: string }) => {
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
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <CalendarToolbar
        title={toolbarTitle}
        onToday={handleToday}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      {/* Body: MiniCalendar + FullCalendar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: MiniCalendar */}
        <aside className="hidden w-64 shrink-0 border-r border-border p-4 lg:block">
          <MiniCalendar
            selectedDate={selectedDate}
            onDateSelect={handleMiniCalendarSelect}
          />
        </aside>

        {/* Right panel: FullCalendar */}
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
            eventResizableFromStart
            // Events
            events={events}
            eventContent={renderEventContent}
            // Callbacks
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

      {/* Dialogs */}
      <CreateTodoDialog />
      <TodoDetailPopup />
    </div>
  )
}
