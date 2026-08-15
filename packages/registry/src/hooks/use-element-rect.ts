"use client"

import * as React from "react"

import { resolveTarget, type Target } from "@aq-ui/registry/hooks/_target"
import { useIsomorphicLayoutEffect } from "@aq-ui/registry/hooks/use-isomorphic-layout-effect"

export function useElementRect<T extends Element>(
  target: Target<T>
): DOMRectReadOnly | null {
  const [rect, setRect] = React.useState<DOMRectReadOnly | null>(null)

  useIsomorphicLayoutEffect(() => {
    const element = resolveTarget(target)
    if (!element) return
    let frame = 0

    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = element.getBoundingClientRect()
        setRect((current) =>
          current &&
          current.x === next.x &&
          current.y === next.y &&
          current.width === next.width &&
          current.height === next.height
            ? current
            : next
        )
      })
    }

    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure)
    observer?.observe(element)
    window.addEventListener("resize", measure, { passive: true })
    document.addEventListener("scroll", measure, {
      capture: true,
      passive: true,
    })
    measure()

    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
      window.removeEventListener("resize", measure)
      document.removeEventListener("scroll", measure, true)
    }
  }, [target])

  return rect
}
