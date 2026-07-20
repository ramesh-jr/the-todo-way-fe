// ============================================================
// Date helpers — calm, human formatting and week math.
// ============================================================

export function startOfWeek(d: Date = new Date()): Date {
  const date = new Date(d)
  const day = (date.getDay() + 6) % 7 // Monday = 0
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - day)
  return date
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isToday(iso: string | null): boolean {
  if (!iso) return false
  return isSameDay(new Date(iso), new Date())
}

/** True when `iso` falls on a calendar day after today, within `withinDays` (default 7). */
export function isUpcoming(iso: string | null, withinDays = 7): boolean {
  if (!iso) return false
  const when = new Date(iso)
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const tomorrow = new Date(start)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const end = new Date(start)
  end.setDate(end.getDate() + withinDays + 1) // exclusive upper bound
  return when >= tomorrow && when < end
}

/** Calm relative age, e.g. "today", "2 days", "3 weeks". Never "overdue". */
export function formatAge(iso: string): string {
  const then = new Date(iso).getTime()
  const days = Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24))
  if (days <= 0) return "today"
  if (days === 1) return "1 day"
  if (days < 7) return `${days} days`
  const weeks = Math.floor(days / 7)
  if (weeks === 1) return "1 week"
  if (weeks < 8) return `${weeks} weeks`
  const months = Math.floor(days / 30)
  return months === 1 ? "1 month" : `${months} months`
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function diffInMinutes(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (60 * 1000))
}
