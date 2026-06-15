import { Menu, Monitor, Moon, Plus, Sun } from "lucide-react"

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
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
      <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Toggle sidebar">
        <Menu className="size-5" />
      </Button>

      <div className="flex-1" />

      <Button size="sm" onClick={openCapture}>
        <Plus className="size-4" />
        Capture
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={cycleTheme}
        aria-label={`Theme: ${theme}`}
      >
        <ThemeIcon className="size-5" />
      </Button>
    </header>
  )
}
