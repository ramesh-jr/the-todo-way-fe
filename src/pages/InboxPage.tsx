import { Inbox } from "lucide-react"

export default function InboxPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
      <Inbox className="h-12 w-12 text-primary" />
      <h1 className="text-2xl font-bold">Inbox</h1>
      <p className="text-muted-foreground">
        All your todos in one place. Coming in FE-6.
      </p>
    </div>
  )
}
