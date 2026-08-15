"use client"

import * as React from "react"

export type InputModality = "keyboard" | "pointer"

let currentModality: InputModality = "keyboard"
let modalityListening = false
const modalityListeners = new Set<() => void>()

function setModality(modality: InputModality) {
  if (currentModality === modality) return
  currentModality = modality
  modalityListeners.forEach((listener) => listener())
}

function onKeyDown(event: KeyboardEvent) {
  if (!event.metaKey && !event.altKey && !event.ctrlKey) {
    setModality("keyboard")
  }
}

function onPointerDown() {
  setModality("pointer")
}

function subscribe(listener: () => void) {
  modalityListeners.add(listener)
  if (!modalityListening && typeof document !== "undefined") {
    document.addEventListener("keydown", onKeyDown, true)
    document.addEventListener("pointerdown", onPointerDown, true)
    modalityListening = true
  }
  return () => {
    modalityListeners.delete(listener)
    if (
      modalityListeners.size === 0 &&
      modalityListening &&
      typeof document !== "undefined"
    ) {
      document.removeEventListener("keydown", onKeyDown, true)
      document.removeEventListener("pointerdown", onPointerDown, true)
      modalityListening = false
    }
  }
}

export function useKeyboardModality(
  defaultValue: InputModality = "keyboard"
): InputModality {
  return React.useSyncExternalStore(
    subscribe,
    () => currentModality,
    () => defaultValue
  )
}
