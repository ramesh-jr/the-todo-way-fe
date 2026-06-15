import { useEffect } from "react"
import { Outlet } from "react-router"
import { Plus } from "lucide-react"

import { CaptureBar } from "@/components/capture/CaptureBar"
import { ClarifyDialog } from "@/components/items/ClarifyDialog"
import { ItemDetailDialog } from "@/components/items/ItemDetailDialog"
import { NudgeBanner } from "@/components/nudges/NudgeBanner"
import Sidebar from "@/components/layout/Sidebar"
import TopBar from "@/components/layout/TopBar"
import { Button } from "@/components/ui/button"
import { useDomainStore } from "@/stores/domainStore"
import { useItemStore } from "@/stores/itemStore"
import { useUIStore } from "@/stores/uiStore"

export default function MainLayout() {
  const fetchItems = useItemStore((s) => s.fetchItems)
  const fetchDomains = useDomainStore((s) => s.fetchDomains)
  const fetchPriorities = useDomainStore((s) => s.fetchPriorities)
  const openCapture = useUIStore((s) => s.openCapture)

  // Load shared data once for the whole authenticated shell.
  useEffect(() => {
    void fetchItems()
    void fetchDomains()
    void fetchPriorities()
  }, [fetchItems, fetchDomains, fetchPriorities])

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-auto">
          <div className="px-4 pt-4">
            <NudgeBanner />
          </div>
          <Outlet />
        </main>
      </div>

      {/* Global capture + dialogs, available on every surface */}
      <CaptureBar />
      <ClarifyDialog />
      <ItemDetailDialog />

      {/* Global capture FAB */}
      <Button
        size="icon"
        className="fixed bottom-6 right-6 size-14 rounded-full shadow-lg"
        onClick={openCapture}
        aria-label="Capture"
      >
        <Plus className="size-6" />
      </Button>
    </div>
  )
}
