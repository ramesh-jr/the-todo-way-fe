import { Navigate, Outlet } from "react-router"

const AUTH_KEY = "the-todo-way-auth"

/** Checks localStorage for auth flag. Redirects to /login if not authenticated. */
export default function AuthGuard() {
  const isAuthenticated = localStorage.getItem(AUTH_KEY) === "true"

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

/** Helpers for login/logout (used by LoginPage) */
export function setAuthenticated(value: boolean): void {
  if (value) {
    localStorage.setItem(AUTH_KEY, "true")
  } else {
    localStorage.removeItem(AUTH_KEY)
  }
}

export function getIsAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === "true"
}
