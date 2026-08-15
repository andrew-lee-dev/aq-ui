"use client"

import * as React from "react"

import { useStableCallback } from "@aq-ui/registry/hooks/use-stable-callback"

export interface UseTypeaheadOptions<T> {
  items: T[]
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  getTextValue?: (item: T) => string
  timeout?: number
  loop?: boolean
  disabledIndices?: Iterable<number>
}

export interface TypeaheadControls {
  search: (character: string) => number
  onKeyDown: (event: React.KeyboardEvent) => void
  reset: () => void
}

export function useTypeahead<T>({
  items,
  activeIndex,
  onActiveIndexChange,
  getTextValue = (item) => String(item),
  timeout = 500,
  loop = true,
  disabledIndices = [],
}: UseTypeaheadOptions<T>): TypeaheadControls {
  const bufferRef = React.useRef("")
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const getTextStable = useStableCallback(getTextValue)
  const onChangeStable = useStableCallback(onActiveIndexChange)
  const disabled = React.useMemo(
    () => new Set(disabledIndices),
    [disabledIndices]
  )

  const reset = React.useCallback(() => {
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
    timeoutRef.current = null
    bufferRef.current = ""
  }, [])

  const search = React.useCallback(
    (character: string) => {
      if (!character) return -1
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
      const lower = character.toLocaleLowerCase()
      bufferRef.current =
        bufferRef.current === lower ? lower : bufferRef.current + lower
      timeoutRef.current = setTimeout(reset, timeout)

      const indices = items.map((_, index) => index)
      const ordered = loop
        ? [
            ...indices.slice(activeIndex + 1),
            ...indices.slice(0, activeIndex + 1),
          ]
        : indices.slice(activeIndex + 1)
      let match = ordered.find(
        (index) =>
          !disabled.has(index) &&
          getTextStable(items[index] as T)
            ?.trim()
            .toLocaleLowerCase()
            .startsWith(bufferRef.current)
      )

      if (match === undefined && bufferRef.current.length > 1) {
        bufferRef.current = lower
        match = ordered.find(
          (index) =>
            !disabled.has(index) &&
            getTextStable(items[index] as T)
              ?.trim()
              .toLocaleLowerCase()
              .startsWith(lower)
        )
      }

      if (match !== undefined) {
        onChangeStable(match)
        return match
      }
      return -1
    },
    [
      activeIndex,
      disabled,
      getTextStable,
      items,
      loop,
      onChangeStable,
      reset,
      timeout,
    ]
  )

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (
        event.key.length !== 1 ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return
      }
      if (search(event.key) >= 0) event.preventDefault()
    },
    [search]
  )

  React.useEffect(() => reset, [reset])

  return { search, onKeyDown, reset }
}
