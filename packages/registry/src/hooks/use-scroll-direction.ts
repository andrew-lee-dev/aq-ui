"use client"

import * as React from "react"

import type { Target } from "@aq-ui/registry/hooks/_target"
import {
  useScrollPosition,
  type ScrollPosition,
} from "@aq-ui/registry/hooks/use-scroll-position"

export type ScrollDirection = "up" | "down" | "left" | "right" | null

export interface UseScrollDirectionOptions {
  threshold?: number
  axis?: "x" | "y" | "both"
}

export function useScrollDirection(
  target?: Target<Element | Window>,
  { threshold = 4, axis = "y" }: UseScrollDirectionOptions = {}
): ScrollDirection {
  const position = useScrollPosition(target)
  const previousRef = React.useRef<ScrollPosition>(position)
  const [direction, setDirection] = React.useState<ScrollDirection>(null)

  React.useEffect(() => {
    const dx = position.x - previousRef.current.x
    const dy = position.y - previousRef.current.y
    previousRef.current = position

    if (
      axis !== "y" &&
      Math.abs(dx) >= threshold &&
      Math.abs(dx) >= Math.abs(dy)
    ) {
      setDirection(dx > 0 ? "right" : "left")
    } else if (axis !== "x" && Math.abs(dy) >= threshold) {
      setDirection(dy > 0 ? "down" : "up")
    }
  }, [axis, position, threshold])

  return direction
}
