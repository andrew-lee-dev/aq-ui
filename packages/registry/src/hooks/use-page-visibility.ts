"use client"

import * as React from "react"

const visibilityListeners = new Set<() => void>()
let visibilityListening = false

function notifyVisibility() {
  visibilityListeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  visibilityListeners.add(listener)
  if (!visibilityListening && typeof document !== "undefined") {
    document.addEventListener("visibilitychange", notifyVisibility)
    visibilityListening = true
  }
  return () => {
    visibilityListeners.delete(listener)
    if (
      visibilityListeners.size === 0 &&
      visibilityListening &&
      typeof document !== "undefined"
    ) {
      document.removeEventListener("visibilitychange", notifyVisibility)
      visibilityListening = false
    }
  }
}

function getSnapshot(): DocumentVisibilityState {
  return typeof document === "undefined" ? "visible" : document.visibilityState
}

export function usePageVisibility(
  defaultValue: DocumentVisibilityState = "visible"
): DocumentVisibilityState {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => defaultValue)
}
