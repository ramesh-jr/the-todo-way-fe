// ============================================================
// OnboardingPage — a calm welcome. No setup walls; explains the loop, then in.
// ============================================================

import { useState } from "react"
import { useNavigate } from "react-router"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useItemStore } from "@/stores/itemStore"

const STEPS = [
  { label: "Capture", desc: "Dump anything on your mind into one inbox." },
  { label: "Clarify", desc: "Give it a home — a domain, a time, an energy." },
  { label: "Engage", desc: "Today shows only what matters now." },
  { label: "Review", desc: "A gentle weekly look — never a scorecard." },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const capture = useItemStore((s) => s.capture)
  const [first, setFirst] = useState("")

  async function start() {
    const value = first.trim()
    if (value) await capture({ title: value })
    navigate("/", { replace: true })
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <div className="w-full max-w-xl space-y-8">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Welcome to your calm command center</h1>
          <p className="text-sm text-muted-foreground">
            One place to think, plan, and review — so you can stop reacting and start
            choosing. Your domains are a gentle dashboard, never a scorecard.
          </p>
        </header>

        <ol className="grid gap-3 sm:grid-cols-2">
          {STEPS.map((step, i) => (
            <li key={step.label} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <span className="font-medium">{step.label}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
            </li>
          ))}
        </ol>

        <div className="space-y-3">
          <Input
            placeholder="Capture your first thing (optional)…"
            value={first}
            onChange={(e) => setFirst(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void start()
            }}
          />
          <Button size="lg" className="w-full" onClick={() => void start()}>
            Get started
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
