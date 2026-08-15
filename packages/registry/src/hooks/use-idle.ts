"use client"

import * as React from "react"

import { useStableCallback } from "@aq-ui/registry/hooks/use-stable-callback"

export interface UseIdleOptions {
  timeout?: number
  initialState?: boolean
  enabled?: boolean
  events?: Array<keyof WindowEventMap>
  onIdle?: () => void
  onActive?: () => void
}

const DEFAULT_IDLE_EVENTS: Array<keyof WindowEventMap> = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
]

export function useIdle({
  timeout = 60_000,
  initialState = false,
  enabled = true,
  events = DEFAULT_IDLE_EVENTS,
  onIdle,
  onActive,
}: UseIdleOptions = {}): boolean {
  const [idle, setIdle] = React.useState(initialState)
  const idleRef = React.useRef(initialState)
  const onIdleStable = useStableCallback(onIdle)
  const onActiveStable = useStableCallback(onActive)
  const eventsKey = events.join("\u0000")

  React.useEffect(() => {
    if (!enabled || typeof window === "undefined") return
    let timer: ReturnType<typeof setTimeout>
    const eventNames = eventsKey.split("\u0000").filter(Boolean) as Array<
      keyof WindowEventMap
    >

    const schedule = () => {
      clearTimeout(timer)
      if (idleRef.current) {
        idleRef.current = false
        setIdle(false)
        onActiveStable()
      }
      timer = setTimeout(
        () => {
          idleRef.current = true
          setIdle(true)
          onIdleStable()
        },
        Math.max(0, timeout)
      )
    }

    eventNames.forEach((event) =>
      window.addEventListener(event, schedule, { passive: true })
    )
    schedule()

    return () => {
      clearTimeout(timer)
      eventNames.forEach((event) => window.removeEventListener(event, schedule))
    }
  }, [enabled, eventsKey, onActiveStable, onIdleStable, timeout])

  return idle
}
