import { Calendar } from "lucide-react"

export default function CalendarPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
      <Calendar className="h-12 w-12 text-primary" />
      <h1 className="text-2xl font-bold">Calendar</h1>
      <p className="text-muted-foreground">
        FullCalendar integration coming in FE-7.
      </p>
    </div>
  )
}
