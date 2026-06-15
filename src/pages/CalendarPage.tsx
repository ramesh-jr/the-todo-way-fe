// ============================================================
// CalendarPage — tasks + synced events together. Drag to time-block.
// Surfaces a gentle overcommitment warning before a day feels impossible.
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { EventClickArg, EventDropArg } from "@fullcalendar/core"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import type { EventResizeDoneArg } from "@fullcalendar/interaction"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import { TriangleAlert } from "lucide-react"

import { CalendarToolbar } from "@/components/calendar/CalendarToolbar"
import { MiniCalendar } from "@/components/calendar/MiniCalendar"
import { diffInMinutes, itemToFCEvent } from "@/lib/calendarUtils"
import { CALENDAR_CUSTOM_VIEWS } from "@/lib/calendarViews"
import { formatShortDate, isoDate } from "@/lib/dates"
import { OVERCOMMIT_MINUTES, scheduledMinutesByDay } from "@/lib/lifeLogic"
import { useItemStore } from "@/stores/itemStore"
import { useUIStore } from "@/stores/uiStore"

import "@/styles/fullcalendar.css"

export default function CalendarPage() {
  const calendarRef = useRef<FullCalendar>(null)
  const items = useItemStore((s) => s.items)
  const fetchItems = useItemStore((s) => s.fetchItems)
  const scheduleItem = useItemStore((s) => s.scheduleItem)
  const updateItem = useItemStore((s) => s.updateItem)

  const calendarView = useUIStore((s) => s.calendarView)
  const setCalendarView = useUIStore((s) => s.setCalendarView)
  const openItemDetail = useUIStore((s) => s.openItemDetail)
  const openCapture = useUIStore((s) => s.openCapture)

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [title, setTitle] = useState("")

  useEffect(() => {
    void fetchItems()
  }, [fetchItems])

  const events = useMemo(
    () =>
      items
        .filter((i) => i.scheduled_at && i.status !== "done")
        .map(itemToFCEvent),
    [items],
  )

  // Gentle overcommitment check across the next week (derived, not stored).
  const overcommittedDay = useMemo<string | null>(() => {
    const byDay = scheduledMinutesByDay(items)
    const today = new Date()
    for (let offset = 0; offset < 7; offset++) {
      const d = new Date(today)
      d.setDate(d.getDate() + offset)
      const key = isoDate(d)
      if ((byDay.get(key) ?? 0) > OVERCOMMIT_MINUTES) return key
    }
    return null
  }, [items])

  const updateTitle = useCallback(() => {
    const api = calendarRef.current?.getApi()
    if (api) setTitle(api.view.title)
  }, [])

  const handleMiniSelect = useCallback(
    (date: Date) => {
      setSelectedDate(date)
      const api = calendarRef.current?.getApi()
      api?.gotoDate(date)
      updateTitle()
    },
    [updateTitle],
  )

  const handleToday = useCallback(() => {
    const api = calendarRef.current?.getApi()
    api?.today()
    setSelectedDate(new Date())
    updateTitle()
  }, [updateTitle])

  const handlePrev = useCallback(() => {
    const api = calendarRef.current?.getApi()
    api?.prev()
    if (api) setSelectedDate(api.getDate())
    updateTitle()
  }, [updateTitle])

  const handleNext = useCallback(() => {
    const api = calendarRef.current?.getApi()
    api?.next()
    if (api) setSelectedDate(api.getDate())
    updateTitle()
  }, [updateTitle])

  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      const id = info.event.extendedProps.itemId as string | undefined
      if (id) openItemDetail(id)
    },
    [openItemDetail],
  )

  const handleEventDrop = useCallback(
    (info: EventDropArg) => {
      const id = info.event.extendedProps.itemId as string | undefined
      if (id && info.event.start) {
        const duration =
          info.event.end && info.event.start
            ? diffInMinutes(info.event.start, info.event.end)
            : 30
        void scheduleItem(id, info.event.start.toISOString(), duration)
      }
    },
    [scheduleItem],
  )

  const handleEventResize = useCallback(
    (info: EventResizeDoneArg) => {
      const id = info.event.extendedProps.itemId as string | undefined
      if (id && info.event.start && info.event.end) {
        void updateItem(id, {
          duration_minutes: diffInMinutes(info.event.start, info.event.end),
        })
      }
    },
    [updateItem],
  )

  const handleDateClick = useCallback(() => {
    openCapture()
  }, [openCapture])

  const handleDatesSet = useCallback(() => {
    const api = calendarRef.current?.getApi()
    if (api) {
      setTitle(api.view.title)
      if (api.view.type !== calendarView) {
        setCalendarView(api.view.type as typeof calendarView)
      }
    }
  }, [calendarView, setCalendarView])

  return (
    <div className="flex h-full flex-col">
      <CalendarToolbar
        title={title}
        onToday={handleToday}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      {overcommittedDay && (
        <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm">
          <TriangleAlert className="size-4 text-amber-600" />
          <span className="text-foreground">
            {formatShortDate(`${overcommittedDay}T12:00:00`)} looks full — want to move
            something so the day feels doable?
          </span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-64 shrink-0 border-r border-border p-4 lg:block">
          <MiniCalendar selectedDate={selectedDate} onDateSelect={handleMiniSelect} />
          <p className="mt-4 text-xs text-muted-foreground">
            Dashed events are commitments synced from your calendars. Solid blocks are your
            tasks — drag them to make time.
          </p>
        </aside>

        <div className="flex-1 overflow-auto p-2">
          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
            initialView={calendarView}
            headerToolbar={false}
            views={CALENDAR_CUSTOM_VIEWS}
            slotMinTime="06:00:00"
            slotMaxTime="24:00:00"
            slotDuration="00:15:00"
            nowIndicator
            editable
            eventResizableFromStart
            events={events}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            dateClick={handleDateClick}
            datesSet={handleDatesSet}
            height="100%"
            stickyHeaderDates
            dayMaxEvents={4}
          />
        </div>
      </div>
    </div>
  )
}
