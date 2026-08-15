"use client"

import * as React from "react"

const subscribe = () => () => undefined

export function useHydrated(): boolean {
  return React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}
