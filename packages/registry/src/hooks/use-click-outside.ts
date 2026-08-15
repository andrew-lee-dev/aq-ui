"use client"

import * as React from "react"

import { resolveTarget, type Target } from "@aq-ui/registry/hooks/_target"
import { useStableCallback } from "@aq-ui/registry/hooks/use-stable-callback"

export interface UseClickOutsideOptions {
  enabled?: boolean
  events?: Array<"pointerdown" | "mousedown" | "touchstart" | "click">
  capture?: boolean
}

export function useClickOutside<T extends Element>(
  targets: Target<T> | Array<Target<T>>,
  handler: (event: Event) => void,
  {
    enabled = true,
    events = ["pointerdown"],
    capture = true,
  }: UseClickOutsideOptions = {}
): void {
  const stableHandler = useStableCallback(handler)

  React.useEffect(() => {
    if (!enabled || typeof document === "undefined") return
    const targetList = Array.isArray(targets) ? targets : [targets]

    const listener = (event: Event) => {
      const path = event.composedPath()
      const isInside = targetList.some((target) => {
        const element = resolveTarget(target)
        return (
          element &&
          (path.includes(element) ||
            (event.target instanceof Node && element.contains(event.target)))
        )
      })
      if (!isInside) stableHandler(event)
    }

    events.forEach((event) =>
      document.addEventListener(event, listener, { capture, passive: true })
    )
    return () =>
      events.forEach((event) =>
        document.removeEventListener(event, listener, capture)
      )
  }, [capture, enabled, events, stableHandler, targets])
}
