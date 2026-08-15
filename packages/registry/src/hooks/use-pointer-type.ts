"use client"

import * as React from "react"

export type PointerInputType = "mouse" | "pen" | "touch" | null

let pointerType: PointerInputType = null
let pointerListening = false
const pointerListeners = new Set<() => void>()

function onPointer(event: PointerEvent) {
  const next =
    event.pointerType === "mouse" ||
    event.pointerType === "pen" ||
    event.pointerType === "touch"
      ? event.pointerType
      : null
  if (next === pointerType) return
  pointerType = next
  pointerListeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  pointerListeners.add(listener)
  if (!pointerListening && typeof window !== "undefined") {
    window.addEventListener("pointerdown", onPointer, { passive: true })
    pointerListening = true
  }
  return () => {
    pointerListeners.delete(listener)
    if (pointerListeners.size === 0 && pointerListening) {
      window.removeEventListener("pointerdown", onPointer)
      pointerListening = false
    }
  }
}

export function usePointerType(
  defaultValue: PointerInputType = null
): PointerInputType {
  return React.useSyncExternalStore(
    subscribe,
    () => pointerType,
    () => defaultValue
  )
}
