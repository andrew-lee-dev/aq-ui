"use client"

import type { Target } from "@aq-ui/registry/hooks/_target"
import { useResizeObserver } from "@aq-ui/registry/hooks/use-resize-observer"

export interface ElementSize {
  width: number
  height: number
}

export function useElementSize<T extends Element>(
  target: Target<T>,
  initialSize: ElementSize = { width: 0, height: 0 }
): ElementSize {
  const { entry } = useResizeObserver(target)
  if (!entry) return initialSize
  return {
    width: entry.contentRect.width,
    height: entry.contentRect.height,
  }
}
