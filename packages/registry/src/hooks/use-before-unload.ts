"use client"

import * as React from "react"

export function useBeforeUnload(enabled: boolean, message = ""): void {
  React.useEffect(() => {
    if (!enabled || typeof window === "undefined") return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = message
      return message
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [enabled, message])
}
