import { useEffect } from "react"
import { Outlet } from "react-router"
import { Plus } from "lucide-react"

import { CaptureBar } from "@/components/capture/CaptureBar"
import { ClarifyDialog } from "@/components/items/ClarifyDialog"
import { ItemDetailDialog } from "@/components/items/ItemDetailDialog"
import MobileNav from "@/components/layout/MobileNav"
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
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-auto pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
          <div className="px-3 pt-3 sm:px-4 sm:pt-4">
            <NudgeBanner />
          </div>
          <Outlet />
        </main>
      </div>

      <MobileNav />

      {/* Global capture + dialogs, available on every surface */}
      <CaptureBar />
      <ClarifyDialog />
      <ItemDetailDialog />

      {/* Capture FAB — sits above the mobile tab bar; freer on desktop */}
      <Button
        size="icon"
        className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 size-12 rounded-full shadow-lg sm:size-14 md:right-6 md:bottom-6"
        onClick={openCapture}
        aria-label="Capture"
      >
        <Plus className="size-6" />
      </Button>
    </div>
  )
}
