// ============================================================
// Auth token storage (single-user JWT).
// In static (no-backend) mode a placeholder token is used so the guard passes.
// ============================================================

const TOKEN_KEY = "ttw_token"

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
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

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? null
