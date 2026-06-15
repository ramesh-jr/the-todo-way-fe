// ============================================================
// LoginPage — single-user auth. Real backend when VITE_API_URL is set;
// otherwise a local demo "Enter".
// ============================================================

import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router"
import { Compass } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { API_URL, setToken } from "@/lib/auth"

interface AuthEnvelope {
  data: { access_token: string } | null
  error: string | null
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<"login" | "setup">("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [recoveryEmail, setRecoveryEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function enterDemo() {
    setToken("demo")
    navigate("/", { replace: true })
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!API_URL) {
      enterDemo()
      return
    }
    setLoading(true)
    setError(null)
    try {
      const body =
        mode === "setup"
          ? { username, password, recovery_email: recoveryEmail || null }
          : { username, password }
      const resp = await fetch(`${API_URL}/api/v1/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const payload = (await resp.json()) as AuthEnvelope
      if (!resp.ok || !payload.data) {
        throw new Error(payload.error ?? "Something went wrong")
      }
      setToken(payload.data.access_token)
      navigate("/", { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Compass className="size-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">The Todo Way</CardTitle>
          <CardDescription>
            {API_URL
              ? mode === "setup"
                ? "Create your account"
                : "Welcome back"
              : "Local demo mode"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!API_URL ? (
            <Button size="lg" className="w-full" onClick={enterDemo}>
              Enter
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {mode === "setup" && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="recovery">Recovery email (optional)</Label>
                  <Input
                    id="recovery"
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                  />
                </div>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Please wait…" : mode === "setup" ? "Create account" : "Log in"}
              </Button>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setMode(mode === "login" ? "setup" : "login")}
              >
                {mode === "login"
                  ? "First time? Set up your account"
                  : "Already have an account? Log in"}
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
