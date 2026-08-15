"use client"

import * as React from "react"

import { subscribeResizeObserver } from "@aq-ui/registry/hooks/_observer-pools"
import { resolveTarget, type Target } from "@aq-ui/registry/hooks/_target"
import { useStableCallback } from "@aq-ui/registry/hooks/use-stable-callback"

export interface UseResizeObserverOptions {
  box?: ResizeObserverBoxOptions
  enabled?: boolean
  onResize?: (entry: ResizeObserverEntry) => void
}

export interface ResizeObserverResult {
  entry: ResizeObserverEntry | null
  supported: boolean
}

export function useResizeObserver<T extends Element>(
  target: Target<T>,
  {
    box = "content-box",
    enabled = true,
    onResize,
  }: UseResizeObserverOptions = {}
): ResizeObserverResult {
  const [entry, setEntry] = React.useState<ResizeObserverEntry | null>(null)
  const onResizeStable = useStableCallback(onResize)

  React.useEffect(() => {
    if (!enabled) return
    const element = resolveTarget(target)
    if (!element) return
    const unsubscribe = subscribeResizeObserver(element, box, (nextEntry) => {
      setEntry(nextEntry)
      onResizeStable(nextEntry)
    })
    return unsubscribe ?? undefined
  }, [box, enabled, onResizeStable, target])

  return {
    entry,
    supported:
      typeof window !== "undefined" && typeof ResizeObserver !== "undefined",
  }
}
