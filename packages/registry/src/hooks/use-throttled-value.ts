"use client"

import * as React from "react"

export function useThrottledValue<T>(value: T, interval = 250): T {
  const [throttled, setThrottled] = React.useState(value)
  const lastUpdatedRef = React.useRef(0)

  React.useEffect(() => {
    const elapsed = Date.now() - lastUpdatedRef.current

    if (elapsed >= interval) {
      lastUpdatedRef.current = Date.now()
      setThrottled(value)
      return
    }

    const timeout = window.setTimeout(() => {
      lastUpdatedRef.current = Date.now()
      setThrottled(value)
    }, interval - elapsed)

    return () => window.clearTimeout(timeout)
  }, [interval, value])

  return throttled
}
