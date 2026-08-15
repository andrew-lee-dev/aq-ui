"use client"

import * as React from "react"

import { resolveTarget, type Target } from "@aq-ui/registry/hooks/_target"

export interface FullscreenControls {
  active: boolean
  supported: boolean
  error: unknown
  enter: () => Promise<boolean>
  exit: () => Promise<boolean>
  toggle: () => Promise<boolean>
}

export function useFullscreen(target?: Target<Element>): FullscreenControls {
  const [active, setActive] = React.useState(false)
  const [error, setError] = React.useState<unknown>()
  const supported =
    typeof document !== "undefined" && "fullscreenEnabled" in document

  const enter = React.useCallback(async () => {
    const element =
      resolveTarget(target) ??
      (typeof document === "undefined" ? null : document.documentElement)
    if (!element?.requestFullscreen) return false
    try {
      await element.requestFullscreen()
      return true
    } catch (fullscreenError) {
      setError(fullscreenError)
      return false
    }
  }, [target])

  const exit = React.useCallback(async () => {
    if (typeof document === "undefined" || !document.fullscreenElement) {
      return false
    }
    try {
      await document.exitFullscreen()
      return true
    } catch (fullscreenError) {
      setError(fullscreenError)
      return false
    }
  }, [])

  const toggle = React.useCallback(
    () => (active ? exit() : enter()),
    [active, enter, exit]
  )

  React.useEffect(() => {
    if (typeof document === "undefined") return
    const update = () => {
      const element = resolveTarget(target)
      setActive(
        element
          ? document.fullscreenElement === element
          : Boolean(document.fullscreenElement)
      )
    }
    document.addEventListener("fullscreenchange", update)
    update()
    return () => document.removeEventListener("fullscreenchange", update)
  }, [target])

  return { active, supported, error, enter, exit, toggle }
}
