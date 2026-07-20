import { NavLink } from "react-router"
import {
  CalendarDays,
  ClipboardCheck,
  Compass,
  Inbox,
  Sun,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useItemStore } from "@/stores/itemStore"

const navItems = [
  { to: "/", icon: Sun, label: "Today", end: true },
  { to: "/inbox", icon: Inbox, label: "Inbox", end: false },
  { to: "/calendar", icon: CalendarDays, label: "Calendar", end: false },
  { to: "/domains", icon: Compass, label: "Domains", end: false },
  { to: "/review", icon: ClipboardCheck, label: "Review", end: false },
] as const

/**
 * Thumb-reachable primary navigation for phones.
 * Settings lives in the hamburger drawer. Desktop keeps the sidebar.
 */
export default function MobileNav() {
  const items = useItemStore((s) => s.items)
  const inboxCount = items.filter((i) => i.status === "inbox").length

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="grid h-14 grid-cols-5">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <li key={to} className="min-w-0">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "relative flex h-full flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span className="max-w-full truncate">{label}</span>
              {label === "Inbox" && inboxCount > 0 && (
                <span className="absolute top-1.5 right-[calc(50%-1.25rem)] flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
                  {inboxCount > 9 ? "9+" : inboxCount}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
