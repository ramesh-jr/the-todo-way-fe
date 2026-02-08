import { useEffect } from "react"
import { NavLink } from "react-router"
import {
  Calendar,
  ChevronRight,
  Home,
  Inbox,
  ListTodo,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useSectionStore } from "@/stores/sectionStore"
import { useUIStore } from "@/stores/uiStore"

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/inbox", icon: Inbox, label: "Inbox" },
  { to: "/calendar", icon: Calendar, label: "Calendar" },
  { to: "/todos", icon: ListTodo, label: "Todos" },
] as const

export default function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const sections = useSectionStore((s) => s.sections)
  const fetchSections = useSectionStore((s) => s.fetchSections)

  useEffect(() => {
    if (sections.length === 0) {
      fetchSections()
    }
  }, [sections.length, fetchSections])

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-200",
        sidebarOpen ? "w-[260px]" : "w-0 overflow-hidden border-r-0",
      )}
    >
      {/* Nav links */}
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t border-sidebar-border" />

      {/* Sections list */}
      <div className="flex-1 overflow-y-auto p-3">
        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Sections
        </p>
        <div className="flex flex-col gap-0.5">
          {sections.map((section) => (
            <div key={section.id}>
              <div className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent/50">
                <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span>{section.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {section.subsections.length}
                </span>
              </div>
              {section.subsections.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-2 rounded-md py-1 pl-8 pr-3 text-sm text-muted-foreground hover:bg-sidebar-accent/50"
                >
                  <span>{sub.name}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
