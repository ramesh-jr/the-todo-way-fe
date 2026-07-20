// ============================================================
// Auth token storage (single-user JWT).
// In static (no-backend) mode a placeholder "demo" token is used so the guard
// passes. That placeholder is NOT valid when VITE_API_URL is set.
// ============================================================

const TOKEN_KEY = "ttw_token"
const DEMO_TOKEN = "demo"

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? null

export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY)
  // Leftover demo token after switching to a live API — treat as logged out.
  if (API_URL && token === DEMO_TOKEN) {
    localStorage.removeItem(TOKEN_KEY)
    return null
  }
  return token
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return getToken() !== null
}

/** Clear session and send the user to login (used on 401 from the API). */
export function logoutToLogin(): void {
  clearToken()
  if (window.location.pathname !== "/login") {
    window.location.assign("/login")
  }
}
