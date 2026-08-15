"use client"

import * as React from "react"

import { resolveTarget, type Target } from "@aq-ui/registry/hooks/_target"
import { useKeyboardModality } from "@aq-ui/registry/hooks/use-keyboard-modality"

export function useFocusVisible<T extends HTMLElement>(
  target: Target<T>,
  enabled = true
): boolean {
  const modality = useKeyboardModality()
  const [focusVisible, setFocusVisible] = React.useState(false)

  React.useEffect(() => {
    if (!enabled) return
    const element = resolveTarget(target)
    if (!element) return
    const onFocus = () => setFocusVisible(modality === "keyboard")
    const onBlur = () => setFocusVisible(false)
    element.addEventListener("focus", onFocus)
    element.addEventListener("blur", onBlur)
    return () => {
      element.removeEventListener("focus", onFocus)
      element.removeEventListener("blur", onBlur)
    }
  }, [enabled, modality, target])

  return focusVisible
}
