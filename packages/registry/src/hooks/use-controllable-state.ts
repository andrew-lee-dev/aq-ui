"use client"

import * as React from "react"

import { useLatest } from "@aq-ui/registry/hooks/use-latest"

export type ControllableStateUpdater<T> = T | ((previous: T) => T)

export interface UseControllableStateOptions<T> {
  value?: T
  defaultValue: T | (() => T)
  onChange?: (value: T) => void
}

export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateOptions<T>): [
  T,
  (next: ControllableStateUpdater<T>) => void,
] {
  const [uncontrolledValue, setUncontrolledValue] =
    React.useState<T>(defaultValue)
  const controlled = value !== undefined
  const currentValue = controlled ? value : uncontrolledValue
  const currentValueRef = useLatest(currentValue)
  const onChangeRef = useLatest(onChange)

  const setValue = React.useCallback(
    (next: ControllableStateUpdater<T>) => {
      const resolved =
        typeof next === "function"
          ? (next as (previous: T) => T)(currentValueRef.current)
          : next

      if (Object.is(resolved, currentValueRef.current)) return
      currentValueRef.current = resolved

      if (!controlled) setUncontrolledValue(resolved)
      onChangeRef.current?.(resolved)
    },
    [controlled, currentValueRef, onChangeRef]
  )

  return [currentValue, setValue]
}
