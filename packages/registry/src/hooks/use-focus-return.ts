"use client"

import * as React from "react"

import { resolveTarget, type Target } from "@aq-ui/registry/hooks/_target"

export interface FocusReturnControls {
  capture: () => void
  restore: () => void
}

export interface UseFocusReturnOptions {
  enabled?: boolean
  preventScroll?: boolean
  fallback?: Target<HTMLElement>
}

export function useFocusReturn({
  enabled = true,
  preventScroll = true,
  fallback,
}: UseFocusReturnOptions = {}): FocusReturnControls {
  const capturedRef = React.useRef<HTMLElement | null>(null)

  const capture = React.useCallback(() => {
    if (
      typeof document !== "undefined" &&
      document.activeElement instanceof HTMLElement
    ) {
      capturedRef.current = document.activeElement
    }
  }, [])

  const restore = React.useCallback(() => {
    const element =
      (capturedRef.current?.isConnected ? capturedRef.current : null) ??
      resolveTarget(fallback)
    element?.focus({ preventScroll })
    capturedRef.current = null
  }, [fallback, preventScroll])

  React.useEffect(() => {
    if (!enabled) return
    capture()
    return restore
  }, [capture, enabled, restore])

  return { capture, restore }
}
