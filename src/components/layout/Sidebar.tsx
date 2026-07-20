import { useEffect } from "react"
import { NavLink } from "react-router"
import {
  CalendarDays,
  ClipboardCheck,
  Compass,
  Inbox,
  Settings,
  Sun,
} from "lucide-react"

import { useIsDesktop } from "@/hooks/useMediaQuery"
import { cn } from "@/lib/utils"
import { useItemStore } from "@/stores/itemStore"
import { useUIStore } from "@/stores/uiStore"

const navItems = [
  { to: "/", icon: Sun, label: "Today", end: true },
  { to: "/inbox", icon: Inbox, label: "Inbox", end: false },
  { to: "/calendar", icon: CalendarDays, label: "Calendar", end: false },
  { to: "/domains", icon: Compass, label: "Domains", end: false },
  { to: "/review", icon: ClipboardCheck, label: "Review", end: false },
  { to: "/settings", icon: Settings, label: "Settings", end: false },
] as const

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const items = useItemStore((s) => s.items)
  const inboxCount = items.filter((i) => i.status === "inbox").length

  return (
    <nav className="flex flex-col gap-1 p-3">
      {navItems.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50",
            )
          }
        >
          <Icon className="size-4 shrink-0" />
          <span>{label}</span>
          {label === "Inbox" && inboxCount > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">{inboxCount}</span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export default function Sidebar() {
  const isDesktop = useIsDesktop()
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)

  // Phones use bottom nav; keep the drawer closed so content isn't crushed.
  useEffect(() => {
    if (!isDesktop) setSidebarOpen(false)
  }, [isDesktop, setSidebarOpen])

  // Desktop: collapsible rail that pushes content.
  if (isDesktop) {
    return (
      <aside
        className={cn(
          "flex h-full shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-200",
          sidebarOpen ? "w-[240px]" : "w-0 overflow-hidden border-r-0",
        )}
      >
        <div className="px-5 py-4">
          <span className="text-base font-semibold text-primary">The Todo Way</span>
          <p className="text-xs text-muted-foreground">Your calm command center</p>
        </div>
        <NavLinks />
      </aside>
    )
  }

  // Mobile: overlay drawer (hamburger) — secondary to bottom nav.
  return (
    <>
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(280px,85vw)] flex-col border-r border-border bg-sidebar text-sidebar-foreground shadow-lg transition-transform duration-200 md:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
        aria-hidden={!sidebarOpen}
      >
        <div className="px-5 py-4">
          <span className="text-base font-semibold text-primary">The Todo Way</span>
          <p className="text-xs text-muted-foreground">Your calm command center</p>
        </div>
        <NavLinks onNavigate={() => setSidebarOpen(false)} />
      </aside>
    </>
  )
}
