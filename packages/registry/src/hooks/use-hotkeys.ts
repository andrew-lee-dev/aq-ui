"use client"

import * as React from "react"

import { resolveTarget, type Target } from "@aq-ui/registry/hooks/_target"
import { useStableCallback } from "@aq-ui/registry/hooks/use-stable-callback"

export interface UseHotkeysOptions {
  target?: Target<EventTarget>
  enabled?: boolean
  preventDefault?: boolean
  stopPropagation?: boolean
  allowInInputs?: boolean
  exactModifiers?: boolean
}

function isEditable(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  )
}

function matchesHotkey(hotkey: string, event: KeyboardEvent, exact: boolean) {
  const parts = hotkey
    .toLowerCase()
    .split("+")
    .map((part) => part.trim())
  const key = parts.find(
    (part) =>
      ![
        "ctrl",
        "control",
        "alt",
        "option",
        "shift",
        "meta",
        "cmd",
        "mod",
      ].includes(part)
  )
  const expectsCtrl = parts.includes("ctrl") || parts.includes("control")
  const expectsAlt = parts.includes("alt") || parts.includes("option")
  const expectsShift = parts.includes("shift")
  const expectsMeta = parts.includes("meta") || parts.includes("cmd")
  const expectsMod = parts.includes("mod")
  const modMatches = expectsMod
    ? /Mac|iPhone|iPad/.test(navigator.platform)
      ? event.metaKey
      : event.ctrlKey
    : true

  if (!modMatches || (key && event.key.toLowerCase() !== key)) return false
  if (expectsCtrl && !event.ctrlKey) return false
  if (expectsAlt && !event.altKey) return false
  if (expectsShift && !event.shiftKey) return false
  if (expectsMeta && !event.metaKey) return false
  if (!exact) return true

  return (
    (expectsCtrl || (expectsMod && !event.metaKey)) === event.ctrlKey &&
    expectsAlt === event.altKey &&
    expectsShift === event.shiftKey &&
    (expectsMeta || (expectsMod && event.metaKey)) === event.metaKey
  )
}

export function useHotkeys(
  hotkeys: string | string[],
  callback: (event: KeyboardEvent, hotkey: string) => void,
  {
    target,
    enabled = true,
    preventDefault = true,
    stopPropagation = false,
    allowInInputs = false,
    exactModifiers = true,
  }: UseHotkeysOptions = {}
): void {
  const stableCallback = useStableCallback(callback)
  const hotkeyList = Array.isArray(hotkeys) ? hotkeys : [hotkeys]
  const dependency = hotkeyList.join("|")

  React.useEffect(() => {
    if (!enabled) return
    const eventTarget =
      resolveTarget(target) ?? (typeof window === "undefined" ? null : window)
    if (!eventTarget) return

    const listener: EventListener = (nativeEvent) => {
      if (!(nativeEvent instanceof KeyboardEvent)) return
      if (!allowInInputs && isEditable(nativeEvent.target)) return
      const matched = hotkeyList.find((hotkey) =>
        matchesHotkey(hotkey, nativeEvent, exactModifiers)
      )
      if (!matched) return
      if (preventDefault) nativeEvent.preventDefault()
      if (stopPropagation) nativeEvent.stopPropagation()
      stableCallback(nativeEvent, matched)
    }

    eventTarget.addEventListener("keydown", listener)
    return () => eventTarget.removeEventListener("keydown", listener)
    // The normalized hotkey list intentionally controls re-subscription.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    allowInInputs,
    dependency,
    enabled,
    exactModifiers,
    preventDefault,
    stableCallback,
    stopPropagation,
    target,
  ])
}
