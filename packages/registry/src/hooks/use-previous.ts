"use client"

import * as React from "react"

export function usePrevious<T>(value: T): T | undefined {
  const ref = React.useRef<T | undefined>(undefined)

  React.useEffect(() => {
    ref.current = value
  }, [value])

  // Reading the committed value during render is the purpose of this hook.
  // eslint-disable-next-line react-hooks/refs
  return ref.current
}
