import { useEffect, useState } from "react"

/** Tailwind `md` breakpoint — desktop shell starts here. */
export const DESKTOP_MQ = "(min-width: 768px)"

/**
 * Subscribe to a CSS media query. SSR-safe: returns `false` until mounted.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    onChange()
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [query])

  return matches
}

export function useIsDesktop(): boolean {
  return useMediaQuery(DESKTOP_MQ)
}
