import { useNavigate } from "react-router"
import { Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { setAuthenticated } from "@/components/auth/AuthGuard"

export default function LoginPage() {
  const navigate = useNavigate()

  function handleLogin() {
    setAuthenticated(true)
    navigate("/", { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6">
      <div className="flex flex-col items-center gap-2">
        <Lock className="h-10 w-10 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">The Todo Way</h1>
        <p className="text-muted-foreground">
          Sign in to manage your todos
        </p>
      </div>
      <Button size="lg" onClick={handleLogin}>
        Enter App
      </Button>
      <p className="text-xs text-muted-foreground">
        Full login coming in FE-4
      </p>
    </div>
  )
}
