"use client"

import * as React from "react"

import { resolveTarget, type Target } from "@aq-ui/registry/hooks/_target"

export type KeyMatcher = string | string[] | ((event: KeyboardEvent) => boolean)

export interface UseKeyPressOptions {
  enabled?: boolean
  preventDefault?: boolean
}

function matchesKey(matcher: KeyMatcher, event: KeyboardEvent) {
  if (typeof matcher === "function") return matcher(event)
  return (Array.isArray(matcher) ? matcher : [matcher]).includes(event.key)
}

export function useKeyPress(
  matcher: KeyMatcher,
  target?: Target<EventTarget>,
  { enabled = true, preventDefault = false }: UseKeyPressOptions = {}
): boolean {
  const [pressed, setPressed] = React.useState(false)

  React.useEffect(() => {
    if (!enabled) return
    const eventTarget =
      resolveTarget(target) ?? (typeof window === "undefined" ? null : window)
    if (!eventTarget) return

    const keydown: EventListener = (event) => {
      if (!(event instanceof KeyboardEvent) || !matchesKey(matcher, event)) {
        return
      }
      if (preventDefault) event.preventDefault()
      setPressed(true)
    }
    const keyup: EventListener = (event) => {
      if (event instanceof KeyboardEvent && matchesKey(matcher, event)) {
        setPressed(false)
      }
    }
    const blur = () => setPressed(false)

    eventTarget.addEventListener("keydown", keydown)
    eventTarget.addEventListener("keyup", keyup)
    window.addEventListener("blur", blur)
    return () => {
      eventTarget.removeEventListener("keydown", keydown)
      eventTarget.removeEventListener("keyup", keyup)
      window.removeEventListener("blur", blur)
    }
  }, [enabled, matcher, preventDefault, target])

  return pressed
}
