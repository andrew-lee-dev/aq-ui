"use client"

import * as React from "react"

import { useLatest } from "@aq-ui/registry/hooks/use-latest"

export interface TimerControls {
  clear: () => void
  reset: () => void
  isActive: boolean
}

export interface UseTimeoutOptions {
  autoStart?: boolean
}

export function useTimeout(
  callback: () => void,
  delay: number | null,
  { autoStart = true }: UseTimeoutOptions = {}
): TimerControls {
  const callbackRef = useLatest(callback)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isActive, setIsActive] = React.useState(false)

  const clear = React.useCallback(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current)
    timerRef.current = null
    setIsActive(false)
  }, [])

  const reset = React.useCallback(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current)
    if (delay === null) {
      timerRef.current = null
      setIsActive(false)
      return
    }
    setIsActive(true)
    timerRef.current = setTimeout(
      () => {
        timerRef.current = null
        setIsActive(false)
        callbackRef.current()
      },
      Math.max(0, delay)
    )
  }, [callbackRef, delay])

  React.useEffect(() => {
    // Starting the external timer also exposes its active state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoStart) reset()
    return clear
  }, [autoStart, clear, reset])

  return { clear, reset, isActive }
}
