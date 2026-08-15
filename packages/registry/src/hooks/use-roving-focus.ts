"use client"

import * as React from "react"

import { useControllableState } from "@aq-ui/registry/hooks/use-controllable-state"

export interface UseRovingFocusOptions {
  itemCount: number
  activeIndex?: number
  defaultActiveIndex?: number
  onActiveIndexChange?: (index: number) => void
  orientation?: "horizontal" | "vertical" | "both"
  direction?: "ltr" | "rtl"
  loop?: boolean
  disabledIndices?: Iterable<number>
}

export interface RovingFocusItemProps<T extends HTMLElement> {
  ref: (element: T | null) => void
  tabIndex: 0 | -1
  onFocus: () => void
  onKeyDown: React.KeyboardEventHandler<T>
}

export interface RovingFocusControls<T extends HTMLElement> {
  activeIndex: number
  setActiveIndex: (index: number) => void
  focusIndex: (index: number) => void
  getItemProps: (index: number) => RovingFocusItemProps<T>
}

export function useRovingFocus<T extends HTMLElement>({
  itemCount,
  activeIndex,
  defaultActiveIndex = 0,
  onActiveIndexChange,
  orientation = "both",
  direction = "ltr",
  loop = true,
  disabledIndices = [],
}: UseRovingFocusOptions): RovingFocusControls<T> {
  const [currentIndex, setCurrentIndex] = useControllableState({
    value: activeIndex,
    defaultValue: defaultActiveIndex,
    onChange: onActiveIndexChange,
  })
  const itemRefs = React.useRef<Array<T | null>>([])
  const disabled = React.useMemo(
    () => new Set(disabledIndices),
    [disabledIndices]
  )

  const findEnabled = React.useCallback(
    (start: number, delta: number) => {
      if (itemCount <= 0) return -1
      let index = start
      for (let attempts = 0; attempts < itemCount; attempts += 1) {
        index += delta
        if (loop) index = (index + itemCount) % itemCount
        if (!loop && (index < 0 || index >= itemCount)) return start
        if (!disabled.has(index)) return index
      }
      return start
    },
    [disabled, itemCount, loop]
  )

  const focusIndex = React.useCallback(
    (index: number) => {
      if (index < 0 || index >= itemCount || disabled.has(index)) return
      setCurrentIndex(index)
      itemRefs.current[index]?.focus()
    },
    [disabled, itemCount, setCurrentIndex]
  )

  const getItemProps = React.useCallback(
    (index: number): RovingFocusItemProps<T> => ({
      ref(element) {
        itemRefs.current[index] = element
      },
      tabIndex: index === currentIndex && !disabled.has(index) ? 0 : -1,
      onFocus() {
        if (!disabled.has(index)) setCurrentIndex(index)
      },
      onKeyDown(event) {
        let next: number | undefined
        const horizontalPrevious =
          direction === "rtl" ? "ArrowRight" : "ArrowLeft"
        const horizontalNext = direction === "rtl" ? "ArrowLeft" : "ArrowRight"

        if (orientation !== "vertical" && event.key === horizontalPrevious) {
          next = findEnabled(index, -1)
        } else if (orientation !== "vertical" && event.key === horizontalNext) {
          next = findEnabled(index, 1)
        } else if (orientation !== "horizontal" && event.key === "ArrowUp") {
          next = findEnabled(index, -1)
        } else if (orientation !== "horizontal" && event.key === "ArrowDown") {
          next = findEnabled(index, 1)
        } else if (event.key === "Home") {
          next = findEnabled(-1, 1)
        } else if (event.key === "End") {
          next = findEnabled(itemCount, -1)
        }

        if (next !== undefined && next >= 0) {
          event.preventDefault()
          focusIndex(next)
        }
      },
    }),
    [
      currentIndex,
      direction,
      disabled,
      findEnabled,
      focusIndex,
      itemCount,
      orientation,
      setCurrentIndex,
    ]
  )

  return {
    activeIndex: currentIndex,
    setActiveIndex: setCurrentIndex,
    focusIndex,
    getItemProps,
  }
}
