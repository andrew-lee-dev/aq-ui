"use client"

import * as React from "react"

import { useLatest } from "@aq-ui/registry/hooks/use-latest"

type AnyFunction = (...args: never[]) => unknown

export interface ThrottleOptions {
  leading?: boolean
  trailing?: boolean
}

export type ThrottledFunction<T extends AnyFunction> = ((
  ...args: Parameters<T>
) => ReturnType<T> | undefined) & {
  cancel: () => void
  flush: () => ReturnType<T> | undefined
  pending: () => boolean
}

export function useThrottledCallback<T extends AnyFunction>(
  callback: T,
  interval = 250,
  { leading = true, trailing = true }: ThrottleOptions = {}
): ThrottledFunction<T> {
  const callbackRef = useLatest(callback)
  const lastRunRef = React.useRef(0)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const argsRef = React.useRef<Parameters<T> | null>(null)

  const cancel = React.useCallback(() => {
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
    timeoutRef.current = null
    argsRef.current = null
    lastRunRef.current = 0
  }, [])

  const invoke = React.useCallback(() => {
    if (!argsRef.current) return undefined
    const args = argsRef.current
    argsRef.current = null
    lastRunRef.current = Date.now()
    return callbackRef.current(...args) as ReturnType<T>
  }, [callbackRef])

  const flush = React.useCallback(() => {
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
    timeoutRef.current = null
    return invoke()
  }, [invoke])

  const schedule = React.useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      if (lastRunRef.current === 0 && !leading) lastRunRef.current = now
      const remaining = interval - (now - lastRunRef.current)
      argsRef.current = args

      if (remaining <= 0 || remaining > interval) {
        if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
        timeoutRef.current = null
        return invoke()
      }

      if (trailing && timeoutRef.current === null) {
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null
          invoke()
        }, remaining)
      } else if (!trailing) {
        argsRef.current = null
      }

      return undefined
    },
    [interval, invoke, leading, trailing]
  )

  const pending = React.useCallback(() => timeoutRef.current !== null, [])

  // The augmented function only captures callbacks; it does not read refs here.
  /* eslint-disable react-hooks/refs */
  const throttled = React.useMemo(
    () =>
      Object.assign(schedule, {
        cancel,
        flush,
        pending,
      }) as ThrottledFunction<T>,
    [cancel, flush, pending, schedule]
  )
  /* eslint-enable react-hooks/refs */

  React.useEffect(() => cancel, [cancel])

  return throttled
}
