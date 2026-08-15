"use client"

import * as React from "react"

import { useLatest } from "@aq-ui/registry/hooks/use-latest"

const STORAGE_EVENT = "aq-ui:storage"

export interface StorageOptions<T> {
  serializer?: (value: T) => string
  deserializer?: (value: string) => T
  validate?: (value: unknown) => value is T
  initializeWithValue?: boolean
}

export type StorageSetter<T> = (value: T | ((current: T) => T)) => void

function defaultSerialize<T>(value: T) {
  return JSON.stringify(value)
}

function defaultDeserialize<T>(value: string) {
  return JSON.parse(value) as T
}

export function useStorage<T>(
  storageType: "localStorage" | "sessionStorage",
  key: string,
  initialValue: T | (() => T),
  {
    serializer = defaultSerialize,
    deserializer = defaultDeserialize,
    validate,
    initializeWithValue = true,
  }: StorageOptions<T> = {}
): [T, StorageSetter<T>, () => void] {
  const [value, setValue] = React.useState<T>(initialValue)
  const initialValueRef = useLatest(initialValue)
  const resolveInitial = React.useCallback(
    () =>
      typeof initialValueRef.current === "function"
        ? (initialValueRef.current as () => T)()
        : initialValueRef.current,
    [initialValueRef]
  )
  const optionsRef = useLatest({ serializer, deserializer, validate })
  const valueRef = useLatest(value)

  const read = React.useCallback((): T => {
    if (typeof window === "undefined") return resolveInitial()
    try {
      const raw = window[storageType].getItem(key)
      if (raw === null) return resolveInitial()
      const parsed = optionsRef.current.deserializer(raw)
      return optionsRef.current.validate && !optionsRef.current.validate(parsed)
        ? resolveInitial()
        : parsed
    } catch {
      return resolveInitial()
    }
  }, [key, optionsRef, resolveInitial, storageType])

  const write = React.useCallback<StorageSetter<T>>(
    (nextValue) => {
      const next =
        typeof nextValue === "function"
          ? (nextValue as (current: T) => T)(valueRef.current)
          : nextValue
      valueRef.current = next
      setValue(next)
      if (typeof window === "undefined") return
      try {
        window[storageType].setItem(key, optionsRef.current.serializer(next))
        window.dispatchEvent(
          new CustomEvent(STORAGE_EVENT, {
            detail: { key, storageType },
          })
        )
      } catch {
        // State still updates when storage is unavailable or quota is exceeded.
      }
    },
    [key, optionsRef, storageType, valueRef]
  )

  const remove = React.useCallback(() => {
    const next = resolveInitial()
    valueRef.current = next
    setValue(next)
    if (typeof window === "undefined") return
    try {
      window[storageType].removeItem(key)
      window.dispatchEvent(
        new CustomEvent(STORAGE_EVENT, {
          detail: { key, storageType },
        })
      )
    } catch {
      // Removing an unavailable storage item is a no-op.
    }
  }, [key, resolveInitial, storageType, valueRef])

  React.useEffect(() => {
    let active = true
    if (initializeWithValue) {
      queueMicrotask(() => {
        if (active) setValue(read())
      })
    }

    const sync = (event: Event) => {
      if (event instanceof StorageEvent) {
        if (event.key !== key || event.storageArea !== window[storageType]) {
          return
        }
      } else if (event instanceof CustomEvent) {
        const detail = event.detail as {
          key?: string
          storageType?: string
        }
        if (detail.key !== key || detail.storageType !== storageType) return
      }
      const next = read()
      valueRef.current = next
      setValue(next)
    }

    window.addEventListener("storage", sync)
    window.addEventListener(STORAGE_EVENT, sync)
    return () => {
      active = false
      window.removeEventListener("storage", sync)
      window.removeEventListener(STORAGE_EVENT, sync)
    }
  }, [initializeWithValue, key, read, storageType, valueRef])

  return [value, write, remove]
}
