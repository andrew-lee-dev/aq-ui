"use client"

import * as React from "react"

import { resolveTarget, type Target } from "@aq-ui/registry/hooks/_target"

export function useFocusWithin<T extends Element>(
  target: Target<T>,
  enabled = true
): boolean {
  const [focused, setFocused] = React.useState(false)

  React.useEffect(() => {
    if (!enabled) return
    const element = resolveTarget(target)
    if (!element) return
    const onFocusIn = () => setFocused(true)
    const onFocusOut: EventListener = (nativeEvent) => {
      const event = nativeEvent as FocusEvent
      if (
        !event.relatedTarget ||
        !(event.relatedTarget instanceof Node) ||
        !element.contains(event.relatedTarget)
      ) {
        setFocused(false)
      }
    }
    element.addEventListener("focusin", onFocusIn)
    element.addEventListener("focusout", onFocusOut)
    return () => {
      element.removeEventListener("focusin", onFocusIn)
      element.removeEventListener("focusout", onFocusOut)
    }
  }, [enabled, target])

  return focused
}
