import { Link } from "react-router"
import { Menu, Monitor, Moon, Plus, Settings, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useUIStore } from "@/stores/uiStore"

export default function TopBar() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const openCapture = useUIStore((s) => s.openCapture)
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)

  function cycleTheme() {
    setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light")
  }

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor

  return (
    <header className="shrink-0 border-b border-border bg-background pt-[env(safe-area-inset-top)]">
      <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label="Toggle menu"
          className="shrink-0"
        >
          <Menu className="size-5" />
        </Button>

        <span className="truncate text-sm font-semibold text-primary md:hidden">
          The Todo Way
        </span>

        <div className="flex-1" />

        {/* Desktop: labeled Capture. Mobile relies on the FAB. */}
        <Button size="sm" onClick={openCapture} className="hidden sm:inline-flex">
          <Plus className="size-4" />
          Capture
        </Button>

        <Button
          variant="ghost"
          size="icon"
          asChild
          className="shrink-0 md:hidden"
        >
          <Link to="/settings" aria-label="Settings">
            <Settings className="size-5" />
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={cycleTheme}
          aria-label={`Theme: ${theme}`}
          className="shrink-0"
        >
          <ThemeIcon className="size-5" />
        </Button>
      </div>
    </header>
  )
}
