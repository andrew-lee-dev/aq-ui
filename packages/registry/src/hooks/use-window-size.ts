"use client"

import * as React from "react"

export interface WindowSize {
  width: number
  height: number
}

const serverWindowSize: WindowSize = { width: 0, height: 0 }
let cachedWindowSize = serverWindowSize
let resizeFrame = 0
const windowSizeListeners = new Set<() => void>()

function readWindowSize(): WindowSize {
  if (typeof window === "undefined") return serverWindowSize
  if (
    cachedWindowSize.width !== window.innerWidth ||
    cachedWindowSize.height !== window.innerHeight
  ) {
    cachedWindowSize = {
      width: window.innerWidth,
      height: window.innerHeight,
    }
  }
  return cachedWindowSize
}

function notifyWindowSize() {
  cancelAnimationFrame(resizeFrame)
  resizeFrame = requestAnimationFrame(() => {
    readWindowSize()
    windowSizeListeners.forEach((listener) => listener())
  })
}

function subscribe(listener: () => void) {
  windowSizeListeners.add(listener)
  if (windowSizeListeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("resize", notifyWindowSize, { passive: true })
  }
  return () => {
    windowSizeListeners.delete(listener)
    if (windowSizeListeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("resize", notifyWindowSize)
      cancelAnimationFrame(resizeFrame)
    }
  }
}

export function useWindowSize(
  defaultValue: WindowSize = serverWindowSize
): WindowSize {
  return React.useSyncExternalStore(
    subscribe,
    readWindowSize,
    () => defaultValue
  )
}
