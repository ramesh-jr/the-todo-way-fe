/* The Todo Way — service worker.
 * - App-shell runtime caching (network-first navigation, cache fallback offline).
 * - Offline capture queue in IndexedDB, flushed via Background Sync.
 * - Web Push reminder notifications.
 */

const CACHE = "ttw-shell-v1"
const SHELL = ["/", "/icon.svg", "/manifest.webmanifest"]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return

  // Navigations: network-first, fall back to cached app shell when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put("/", copy))
          return res
        })
        .catch(() => caches.match("/").then((r) => r || caches.match(req))),
    )
    return
  }

  // Static assets: stale-while-revalidate.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy))
          return res
        })
        .catch(() => cached)
      return cached || network
    }),
  )
})

/* ---- Offline capture queue (IndexedDB) ---- */

const DB_NAME = "ttw-offline"
const STORE = "captures"
let apiConfig = { baseUrl: null, token: null }

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { autoIncrement: true })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function queueCapture(payload) {
  const db = await openDb()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    tx.objectStore(STORE).add(payload)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function flushCaptures() {
  if (!apiConfig.baseUrl) return
  const db = await openDb()
  const all = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly")
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  for (const payload of all) {
    try {
      await fetch(`${apiConfig.baseUrl}/api/v1/items/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiConfig.token ? { Authorization: `Bearer ${apiConfig.token}` } : {}),
        },
        body: JSON.stringify(payload),
      })
    } catch {
      return // stay queued; try again on next sync
    }
  }
  const db2 = await openDb()
  await new Promise((resolve) => {
    const tx = db2.transaction(STORE, "readwrite")
    tx.objectStore(STORE).clear()
    tx.oncomplete = () => resolve()
  })
}

self.addEventListener("message", (event) => {
  const data = event.data || {}
  if (data.type === "configure") apiConfig = { baseUrl: data.baseUrl, token: data.token }
  if (data.type === "queue-capture") event.waitUntil(queueCapture(data.payload))
  if (data.type === "flush") event.waitUntil(flushCaptures())
})

self.addEventListener("sync", (event) => {
  if (event.tag === "ttw-flush-captures") event.waitUntil(flushCaptures())
})

/* ---- Web Push ---- */

self.addEventListener("push", (event) => {
  let payload = { title: "The Todo Way", body: "A gentle reminder." }
  try {
    if (event.data) payload = event.data.json()
  } catch {
    /* keep default */
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: "ttw-reminder",
    }),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find((c) => "focus" in c)
      if (existing) return existing.focus()
      return self.clients.openWindow("/")
    }),
  )
})
