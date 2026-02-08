import { Menu, Moon, Plus, Sun, Monitor } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useUIStore } from "@/stores/uiStore"

export default function TopBar() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const openCreateDialog = useUIStore((s) => s.openCreateDialog)
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)

  function cycleTheme() {
    const next =
      theme === "light" ? "dark" : theme === "dark" ? "system" : "light"
    setTheme(next)
  }

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
      {/* Sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* App name */}
      <h1 className="text-lg font-semibold text-primary">The Todo Way</h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Create todo */}
      <Button size="sm" onClick={() => openCreateDialog()}>
        <Plus className="h-4 w-4" />
        New Todo
      </Button>

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={cycleTheme}
        aria-label={`Switch theme (current: ${theme})`}
      >
        <ThemeIcon className="h-5 w-5" />
      </Button>
    </header>
  )
}
