"use client"

import * as React from "react"

import { subscribeIntersectionObserver } from "@aq-ui/registry/hooks/_observer-pools"
import { resolveTarget, type Target } from "@aq-ui/registry/hooks/_target"
import { useStableCallback } from "@aq-ui/registry/hooks/use-stable-callback"

export interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  enabled?: boolean
  freezeOnceVisible?: boolean
  onChange?: (entry: IntersectionObserverEntry) => void
}

export interface IntersectionObserverResult {
  entry: IntersectionObserverEntry | null
  isIntersecting: boolean
  supported: boolean
}

export function useIntersectionObserver<T extends Element>(
  target: Target<T>,
  {
    root,
    rootMargin,
    threshold,
    enabled = true,
    freezeOnceVisible = false,
    onChange,
  }: UseIntersectionObserverOptions = {}
): IntersectionObserverResult {
  const [entry, setEntry] = React.useState<IntersectionObserverEntry | null>(
    null
  )
  const frozenRef = React.useRef(false)
  const onChangeStable = useStableCallback(onChange)

  React.useEffect(() => {
    if (!enabled || frozenRef.current) return
    const element = resolveTarget(target)
    if (!element) return
    const unsubscribe = subscribeIntersectionObserver(
      element,
      { root, rootMargin, threshold },
      (nextEntry) => {
        setEntry(nextEntry)
        onChangeStable(nextEntry)
        if (freezeOnceVisible && nextEntry.isIntersecting) {
          frozenRef.current = true
          unsubscribe?.()
        }
      }
    )
    return unsubscribe ?? undefined
  }, [
    enabled,
    freezeOnceVisible,
    onChangeStable,
    root,
    rootMargin,
    target,
    threshold,
  ])

  return {
    entry,
    isIntersecting: entry?.isIntersecting ?? false,
    supported:
      typeof window !== "undefined" &&
      typeof IntersectionObserver !== "undefined",
  }
}
