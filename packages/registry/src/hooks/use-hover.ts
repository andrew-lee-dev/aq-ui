"use client"

import * as React from "react"

import { resolveTarget, type Target } from "@aq-ui/registry/hooks/_target"

export function useHover<T extends Element>(
  target: Target<T>,
  enabled = true
): boolean {
  const [hovered, setHovered] = React.useState(false)

  React.useEffect(() => {
    if (!enabled) return
    const element = resolveTarget(target)
    if (!element) return
    const enter = () => setHovered(true)
    const leave = () => setHovered(false)
    element.addEventListener("pointerenter", enter)
    element.addEventListener("pointerleave", leave)
    return () => {
      element.removeEventListener("pointerenter", enter)
      element.removeEventListener("pointerleave", leave)
    }
  }, [enabled, target])

  return hovered
}
