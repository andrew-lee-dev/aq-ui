"use client"

import * as React from "react"

import { resolveTarget, type Target } from "@aq-ui/registry/hooks/_target"
import { useStableCallback } from "@aq-ui/registry/hooks/use-stable-callback"

export interface UseEscapeKeyOptions {
  enabled?: boolean
  capture?: boolean
  preventDefault?: boolean
  stopPropagation?: boolean
  target?: Target<EventTarget>
}

export function useEscapeKey(
  callback: (event: KeyboardEvent) => void,
  {
    enabled = true,
    capture = true,
    preventDefault = false,
    stopPropagation = false,
    target,
  }: UseEscapeKeyOptions = {}
): void {
  const stableCallback = useStableCallback(callback)

  React.useEffect(() => {
    if (!enabled) return
    const eventTarget =
      resolveTarget(target) ??
      (typeof document === "undefined" ? null : document)
    if (!eventTarget) return

    const listener: EventListener = (event) => {
      if (!(event instanceof KeyboardEvent) || event.key !== "Escape") return
      if (preventDefault) event.preventDefault()
      if (stopPropagation) event.stopPropagation()
      stableCallback(event)
    }
    eventTarget.addEventListener("keydown", listener, capture)
    return () => eventTarget.removeEventListener("keydown", listener, capture)
  }, [
    capture,
    enabled,
    preventDefault,
    stableCallback,
    stopPropagation,
    target,
  ])
}
