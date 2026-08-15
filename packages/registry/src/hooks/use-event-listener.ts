"use client"

import * as React from "react"

import { resolveTarget, type Target } from "@aq-ui/registry/hooks/_target"
import { useStableCallback } from "@aq-ui/registry/hooks/use-stable-callback"

export interface EventListenerOptions extends AddEventListenerOptions {
  enabled?: boolean
}

export function useEventListener<TEvent extends Event>(
  target: Target<EventTarget> | undefined,
  eventName: string,
  handler: (event: TEvent) => void,
  { enabled = true, capture, once, passive, signal }: EventListenerOptions = {}
): void {
  const stableHandler = useStableCallback(handler)

  React.useEffect(() => {
    if (!enabled) return
    const eventTarget =
      resolveTarget(target) ?? (typeof window === "undefined" ? null : window)
    if (!eventTarget) return

    const listener: EventListener = (event) => {
      stableHandler(event as TEvent)
    }
    const options = { capture, once, passive, signal }
    eventTarget.addEventListener(eventName, listener, options)
    return () => eventTarget.removeEventListener(eventName, listener, options)
  }, [
    capture,
    enabled,
    eventName,
    once,
    passive,
    signal,
    stableHandler,
    target,
  ])
}
