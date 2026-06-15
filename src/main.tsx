import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import App from "./App.tsx"
import { initInstallPrompt, registerServiceWorker } from "./lib/pwa"
import "./styles/globals.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Progressive enhancement: install prompt + offline/push service worker.
initInstallPrompt()
if (import.meta.env.PROD) {
  void registerServiceWorker()
}
