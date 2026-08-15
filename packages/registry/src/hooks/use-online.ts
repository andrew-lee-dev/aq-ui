"use client"

import * as React from "react"

const listeners = new Set<() => void>()
let listening = false

function notify() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!listening && typeof window !== "undefined") {
    window.addEventListener("online", notify)
    window.addEventListener("offline", notify)
    listening = true
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && listening && typeof window !== "undefined") {
      window.removeEventListener("online", notify)
      window.removeEventListener("offline", notify)
      listening = false
    }
  }
}

function getSnapshot() {
  return typeof navigator === "undefined" ? true : navigator.onLine
}

export function useOnline(defaultValue = true): boolean {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => defaultValue)
}
