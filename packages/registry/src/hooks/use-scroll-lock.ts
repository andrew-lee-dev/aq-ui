"use client"

import { resolveTarget, type Target } from "@aq-ui/registry/hooks/_target"
import { useIsomorphicLayoutEffect } from "@aq-ui/registry/hooks/use-isomorphic-layout-effect"

interface LockRecord {
  count: number
  overflow: string
  paddingInlineEnd: string
}

const lockRecords = new WeakMap<HTMLElement, LockRecord>()

export function useScrollLock(
  enabled = true,
  target?: Target<HTMLElement>
): void {
  useIsomorphicLayoutEffect(() => {
    if (!enabled || typeof document === "undefined") return
    const element = resolveTarget(target) ?? document.body
    let record = lockRecords.get(element)

    if (!record) {
      record = {
        count: 0,
        overflow: element.style.overflow,
        paddingInlineEnd: element.style.paddingInlineEnd,
      }
      lockRecords.set(element, record)
      const scrollbarWidth =
        element === document.body
          ? window.innerWidth - document.documentElement.clientWidth
          : element.offsetWidth - element.clientWidth
      const computedPadding = Number.parseFloat(
        getComputedStyle(element).paddingInlineEnd
      )
      element.style.overflow = "hidden"
      if (scrollbarWidth > 0) {
        element.style.paddingInlineEnd =
          (Number.isFinite(computedPadding) ? computedPadding : 0) +
          scrollbarWidth +
          "px"
      }
    }
    record.count += 1

    return () => {
      const current = lockRecords.get(element)
      if (!current) return
      current.count -= 1
      if (current.count === 0) {
        element.style.overflow = current.overflow
        element.style.paddingInlineEnd = current.paddingInlineEnd
        lockRecords.delete(element)
      }
    }
  }, [enabled, target])
}
