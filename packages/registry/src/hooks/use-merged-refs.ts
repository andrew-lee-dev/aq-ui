"use client"

import * as React from "react"

import { useLatest } from "@aq-ui/registry/hooks/use-latest"

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") {
    ref(value)
  } else if (ref) {
    ;(ref as React.MutableRefObject<T | null>).current = value
  }
}

export function useMergedRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  const refsRef = useLatest(refs)
  return React.useCallback(
    (value: T | null) => {
      refsRef.current.forEach((ref) => assignRef(ref, value))
    },
    [refsRef]
  )
}
