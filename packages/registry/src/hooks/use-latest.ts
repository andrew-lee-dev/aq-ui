"use client"

import * as React from "react"

import { useIsomorphicLayoutEffect } from "@aq-ui/registry/hooks/use-isomorphic-layout-effect"

export function useLatest<T>(value: T): React.MutableRefObject<T> {
  const ref = React.useRef(value)
  useIsomorphicLayoutEffect(() => {
    ref.current = value
  }, [value])
  return ref
}
