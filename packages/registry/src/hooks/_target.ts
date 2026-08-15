import type * as React from "react"

export type Target<T extends EventTarget> =
  T | null | React.RefObject<T | null> | (() => T | null)

export function resolveTarget<T extends EventTarget>(
  target: Target<T> | undefined
): T | null {
  if (typeof target === "function") return target()
  if (target && "current" in target) return target.current
  return target ?? null
}
