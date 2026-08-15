"use client"

import * as React from "react"

const UNINITIALIZED = Symbol("aq-ui.lazy-ref")

export function useLazyRef<T>(initializer: () => T): React.MutableRefObject<T> {
  const ref = React.useRef<T | typeof UNINITIALIZED>(UNINITIALIZED)

  // This follows React's documented lazy-ref initialization pattern.
  /* eslint-disable react-hooks/refs */
  if (ref.current === UNINITIALIZED) {
    ref.current = initializer()
  }

  return ref as React.MutableRefObject<T>
  /* eslint-enable react-hooks/refs */
}
