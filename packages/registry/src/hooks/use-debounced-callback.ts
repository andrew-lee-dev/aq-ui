"use client"

import * as React from "react"

import { useLatest } from "@aq-ui/registry/hooks/use-latest"

type AnyFunction = (...args: never[]) => unknown

export type DebouncedFunction<T extends AnyFunction> = ((
  ...args: Parameters<T>
) => void) & {
  cancel: () => void
  flush: () => ReturnType<T> | undefined
  pending: () => boolean
}

export function useDebouncedCallback<T extends AnyFunction>(
  callback: T,
  delay = 250
): DebouncedFunction<T> {
  const callbackRef = useLatest(callback)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const argsRef = React.useRef<Parameters<T> | null>(null)

  const cancel = React.useCallback(() => {
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
    timeoutRef.current = null
    argsRef.current = null
  }, [])

  const flush = React.useCallback(() => {
    if (timeoutRef.current === null || argsRef.current === null)
      return undefined
    clearTimeout(timeoutRef.current)
    timeoutRef.current = null
    const args = argsRef.current
    argsRef.current = null
    return callbackRef.current(...args) as ReturnType<T>
  }, [callbackRef])

  const schedule = React.useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
      argsRef.current = args
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null
        const pendingArgs = argsRef.current
        argsRef.current = null
        if (pendingArgs) callbackRef.current(...pendingArgs)
      }, delay)
    },
    [callbackRef, delay]
  )

  const pending = React.useCallback(() => timeoutRef.current !== null, [])

  // The augmented function only captures callbacks; it does not read refs here.
  /* eslint-disable react-hooks/refs */
  const debounced = React.useMemo(
    () =>
      Object.assign(schedule, {
        cancel,
        flush,
        pending,
      }) as DebouncedFunction<T>,
    [cancel, flush, pending, schedule]
  )
  /* eslint-enable react-hooks/refs */

  React.useEffect(() => cancel, [cancel])

  return debounced
}
