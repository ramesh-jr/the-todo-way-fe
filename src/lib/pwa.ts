// ============================================================
// PWA glue — service worker registration, offline capture queue,
// install prompt, and web-push subscription.
// ============================================================

import { API_URL, getToken } from "@/lib/auth"
import type { CaptureInput } from "@/types"

let registration: ServiceWorkerRegistration | null = null

export async function registerServiceWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) return
  try {
    registration = await navigator.serviceWorker.register("/sw.js")
    // Share API base + token so the SW can flush the offline queue.
    navigator.serviceWorker.ready.then((reg) => {
      reg.active?.postMessage({
        type: "configure",
        baseUrl: API_URL,
        token: getToken(),
      })
    })
  } catch {
    /* SW registration is best-effort */
  }
}

/** Queue a capture for background sync (used when offline). */
export async function queueOfflineCapture(payload: CaptureInput): Promise<void> {
  const reg = registration ?? (await navigator.serviceWorker?.ready)
  reg?.active?.postMessage({ type: "queue-capture", payload })
  // Register a background sync if available, else flush opportunistically.
  const withSync = reg as (ServiceWorkerRegistration & { sync?: { register(tag: string): Promise<void> } }) | undefined
  if (withSync?.sync) {
    try {
      await withSync.sync.register("ttw-flush-captures")
      return
    } catch {
      /* fall through */
    }
  }
  reg?.active?.postMessage({ type: "flush" })
}

// -- Install prompt ----------------------------------------------------------

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null

export function initInstallPrompt(): void {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
  })
}

export function canInstall(): boolean {
  return deferredPrompt !== null
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false
  await deferredPrompt.prompt()
  const choice = await deferredPrompt.userChoice
  deferredPrompt = null
  return choice.outcome === "accepted"
}

// -- Web Push ----------------------------------------------------------------

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(normalized)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

/** Subscribe to web-push using the backend's VAPID public key. No-op without a backend. */
export async function subscribeToPush(): Promise<boolean> {
  if (!API_URL || !registration || !("PushManager" in window)) return false
  const permission = await Notification.requestPermission()
  if (permission !== "granted") return false

  const token = getToken()
  const keyResp = await fetch(`${API_URL}/api/v1/push/vapid-public-key`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  const keyJson = (await keyResp.json()) as { data: { public_key: string | null } }
  const publicKey = keyJson.data.public_key
  if (!publicKey) return false

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  })

  const json = subscription.toJSON()
  await fetch(`${API_URL}/api/v1/push/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
    }),
  })
  return true
}
