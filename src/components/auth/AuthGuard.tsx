import { Navigate, Outlet } from "react-router"

import { isAuthenticated } from "@/lib/auth"

/** Redirects to /login if there is no auth token. */
export default function AuthGuard() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
