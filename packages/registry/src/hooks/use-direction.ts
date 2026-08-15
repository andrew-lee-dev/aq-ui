"use client"

import * as React from "react"

export type Direction = "ltr" | "rtl"

interface DirectionStore {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => Direction
}

let cachedDirection: Direction = "ltr"
let directionObserver: MutationObserver | null = null
const directionListeners = new Set<() => void>()

function readDirection(): Direction {
  if (typeof document === "undefined") return cachedDirection
  const explicit = document.documentElement.getAttribute("dir")
  if (explicit === "rtl" || explicit === "ltr") return explicit
  return getComputedStyle(document.documentElement).direction === "rtl"
    ? "rtl"
    : "ltr"
}

const directionStore: DirectionStore = {
  subscribe(listener) {
    directionListeners.add(listener)
    if (
      directionListeners.size === 1 &&
      typeof document !== "undefined" &&
      typeof MutationObserver !== "undefined"
    ) {
      cachedDirection = readDirection()
      directionObserver = new MutationObserver(() => {
        const next = readDirection()
        if (next === cachedDirection) return
        cachedDirection = next
        directionListeners.forEach((notify) => notify())
      })
      directionObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["dir", "class", "style"],
      })
    }
    return () => {
      directionListeners.delete(listener)
      if (directionListeners.size === 0) {
        directionObserver?.disconnect()
        directionObserver = null
      }
    }
  },
  getSnapshot() {
    cachedDirection = readDirection()
    return cachedDirection
  },
}

export function useDirection(defaultDirection: Direction = "ltr"): Direction {
  return React.useSyncExternalStore(
    directionStore.subscribe,
    directionStore.getSnapshot,
    () => defaultDirection
  )
}
