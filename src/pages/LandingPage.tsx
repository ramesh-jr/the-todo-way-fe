import { Inbox, Calendar } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex h-full items-center justify-center gap-8 p-6">
      <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-8 shadow-sm">
        <Inbox className="h-10 w-10 text-primary" />
        <h2 className="text-lg font-semibold">Inbox</h2>
        <p className="text-xs text-muted-foreground">Drag todos to Calendar</p>
      </div>
      <div className="text-2xl text-muted-foreground">+</div>
      <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-8 shadow-sm">
        <Calendar className="h-10 w-10 text-primary" />
        <h2 className="text-lg font-semibold">Calendar</h2>
        <p className="text-xs text-muted-foreground">Drop todos to schedule</p>
      </div>
    </div>
  )
}
