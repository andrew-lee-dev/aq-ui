"use client"

import * as React from "react"

import { resolveTarget, type Target } from "@aq-ui/registry/hooks/_target"
import { useIsomorphicLayoutEffect } from "@aq-ui/registry/hooks/use-isomorphic-layout-effect"

export interface ScrollPosition {
  x: number
  y: number
}

function readPosition(target: Element | Window): ScrollPosition {
  if (target instanceof Window) {
    return { x: target.scrollX, y: target.scrollY }
  }
  return { x: target.scrollLeft, y: target.scrollTop }
}

export function useScrollPosition(
  target?: Target<Element | Window>,
  initialValue: ScrollPosition = { x: 0, y: 0 }
): ScrollPosition {
  const [position, setPosition] = React.useState(initialValue)

  useIsomorphicLayoutEffect(() => {
    const scrollTarget =
      resolveTarget(target) ?? (typeof window === "undefined" ? null : window)
    if (!scrollTarget) return
    let frame = 0

    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = readPosition(scrollTarget)
        setPosition((current) =>
          current.x === next.x && current.y === next.y ? current : next
        )
      })
    }

    scrollTarget.addEventListener("scroll", update, { passive: true })
    update()
    return () => {
      cancelAnimationFrame(frame)
      scrollTarget.removeEventListener("scroll", update)
    }
  }, [target])

  return position
}
