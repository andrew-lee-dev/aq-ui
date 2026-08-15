"use client"

import * as React from "react"

import { useLatest } from "@aq-ui/registry/hooks/use-latest"

export interface IntervalControls {
  pause: () => void
  resume: () => void
  isActive: boolean
}

export interface UseIntervalOptions {
  autoStart?: boolean
  immediate?: boolean
}

export function useInterval(
  callback: () => void,
  delay: number | null,
  { autoStart = true, immediate = false }: UseIntervalOptions = {}
): IntervalControls {
  const callbackRef = useLatest(callback)
  const [isActive, setIsActive] = React.useState(autoStart && delay !== null)

  const pause = React.useCallback(() => setIsActive(false), [])
  const resume = React.useCallback(() => {
    if (delay !== null) setIsActive(true)
  }, [delay])

  React.useEffect(() => {
    if (!isActive || delay === null) return
    if (immediate) callbackRef.current()
    const id = setInterval(() => callbackRef.current(), Math.max(0, delay))
    return () => clearInterval(id)
  }, [callbackRef, delay, immediate, isActive])

  return { pause, resume, isActive: isActive && delay !== null }
}
