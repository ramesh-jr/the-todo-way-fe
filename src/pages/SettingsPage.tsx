// ============================================================
// SettingsPage — satellites (calendar connections), data trust (export),
// notifications (web-push), and account (recovery, logout).
// ============================================================

import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { Bell, CalendarSync, Download, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { dataProvider } from "@/data/provider"
import { API_URL, clearToken } from "@/lib/auth"
import { subscribeToPush } from "@/lib/pwa"
import type { CalendarConnection, CalendarProvider } from "@/types"

export default function SettingsPage() {
  const navigate = useNavigate()
  const [connections, setConnections] = useState<CalendarConnection[]>([])
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    void dataProvider.calendar.connections().then(setConnections)
  }, [])

  async function connect(provider: CalendarProvider) {
    const { authorization_url } = await dataProvider.calendar.connect(provider)
    if (authorization_url) {
      window.location.assign(authorization_url)
    } else {
      setMessage("Connect a backend (set VITE_API_URL) to link external calendars.")
    }
  }

  async function sync() {
    const result = await dataProvider.calendar.sync()
    setMessage(
      `Synced ${result.connections_synced} calendar(s): ${result.imported} new, ${result.updated} updated.`,
    )
    setConnections(await dataProvider.calendar.connections())
  }

  async function disconnect(id: string) {
    await dataProvider.calendar.disconnect(id)
    setConnections(await dataProvider.calendar.connections())
  }

  async function exportData() {
    const data = await dataProvider.data.exportJson()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "the-todo-way-export.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  async function enableReminders() {
    const ok = await subscribeToPush()
    setMessage(
      ok
        ? "Reminders enabled on this device."
        : "Reminders need a backend with push configured (set VITE_API_URL).",
    )
  }

  function logout() {
    clearToken()
    navigate("/login", { replace: true })
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Your command center and its satellites.
        </p>
      </header>

      {message && (
        <p className="rounded-md bg-secondary px-3 py-2 text-sm text-muted-foreground">
          {message}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connected calendars</CardTitle>
          <CardDescription>
            Satellites the command center syncs from. Events appear on your calendar as
            commitments alongside your tasks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {connections.length > 0 && (
            <ul className="space-y-2">
              {connections.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span>
                    {c.provider}
                    {c.account_email ? ` · ${c.account_email}` : ""}
                    <span className="ml-2 text-xs text-muted-foreground">{c.status}</span>
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => void disconnect(c.id)}>
                    Disconnect
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void connect("google")}>
              Connect Google
            </Button>
            <Button variant="outline" size="sm" onClick={() => void connect("outlook")}>
              Connect Outlook
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void sync()}>
              <CalendarSync className="size-4" />
              Sync now
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your data</CardTitle>
          <CardDescription>
            Your data is portable — never a hostage. Export everything any time. When
            connected to a backend, automatic server-side backups run too.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={() => void exportData()}>
            <Download className="size-4" />
            Export everything (JSON)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reminders</CardTitle>
          <CardDescription>
            Opt-in only. Gentle nudges via your device — never nagging.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={() => void enableReminders()}>
            <Bell className="size-4" />
            Enable reminders on this device
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>
            {API_URL
              ? "Set a recovery email so a lost password never means losing your life OS."
              : "Local demo mode — sign-in is simulated on this device."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="size-4" />
            Log out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
