"use client"

import * as React from "react"

import { useLatest } from "@aq-ui/registry/hooks/use-latest"

type AnyFunction = (...args: never[]) => unknown

export function useStableCallback<T extends AnyFunction>(
  callback: T | undefined
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  const callbackRef = useLatest(callback)

  return React.useCallback(
    (...args: Parameters<T>) => {
      return callbackRef.current?.(...args) as ReturnType<T> | undefined
    },
    [callbackRef]
  )
}
