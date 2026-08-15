"use client"

import * as React from "react"

export interface UseClipboardOptions {
  timeout?: number
}

export interface ClipboardControls {
  copied: boolean
  value: string | undefined
  error: unknown
  supported: boolean
  copy: (value: string) => Promise<boolean>
  reset: () => void
}

export function useClipboard({
  timeout = 2_000,
}: UseClipboardOptions = {}): ClipboardControls {
  const [copied, setCopied] = React.useState(false)
  const [value, setValue] = React.useState<string>()
  const [error, setError] = React.useState<unknown>()
  const resetTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const supported = typeof navigator !== "undefined" && "clipboard" in navigator

  const reset = React.useCallback(() => {
    if (resetTimerRef.current !== null) clearTimeout(resetTimerRef.current)
    resetTimerRef.current = null
    setCopied(false)
    setError(undefined)
  }, [])

  const copy = React.useCallback(
    async (nextValue: string) => {
      reset()
      if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        setError(new Error("Clipboard API is not supported"))
        return false
      }
      try {
        await navigator.clipboard.writeText(nextValue)
        setValue(nextValue)
        setCopied(true)
        if (timeout > 0) {
          resetTimerRef.current = setTimeout(() => setCopied(false), timeout)
        }
        return true
      } catch (copyError) {
        setError(copyError)
        return false
      }
    },
    [reset, timeout]
  )

  React.useEffect(() => reset, [reset])

  return { copied, value, error, supported, copy, reset }
}
