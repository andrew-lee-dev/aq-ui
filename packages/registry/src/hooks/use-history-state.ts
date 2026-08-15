"use client"

import * as React from "react"

export type HistoryStateUpdater<T> = T | ((current: T) => T)

export interface UseHistoryStateOptions {
  capacity?: number
}

export interface HistoryStateControls<T> {
  back: () => void
  forward: () => void
  reset: (value?: T) => void
  canUndo: boolean
  canRedo: boolean
}

interface HistorySnapshot<T> {
  entries: T[]
  index: number
}

export function useHistoryState<T>(
  initialValue: T | (() => T),
  { capacity = 100 }: UseHistoryStateOptions = {}
): [T, (value: HistoryStateUpdater<T>) => void, HistoryStateControls<T>] {
  const [initial] = React.useState<T>(() =>
    typeof initialValue === "function"
      ? (initialValue as () => T)()
      : initialValue
  )
  const initialRef = React.useRef(initial)
  const [history, setHistory] = React.useState<HistorySnapshot<T>>(() => ({
    entries: [initial],
    index: 0,
  }))

  const setValue = React.useCallback(
    (updater: HistoryStateUpdater<T>) => {
      setHistory((current) => {
        const previous = current.entries[current.index] as T
        const next =
          typeof updater === "function"
            ? (updater as (value: T) => T)(previous)
            : updater
        if (Object.is(previous, next)) return current
        const entries = [...current.entries.slice(0, current.index + 1), next]
        const bounded = entries.slice(-Math.max(1, capacity))
        return { entries: bounded, index: bounded.length - 1 }
      })
    },
    [capacity]
  )

  const back = React.useCallback(() => {
    setHistory((current) => ({
      ...current,
      index: Math.max(0, current.index - 1),
    }))
  }, [])

  const forward = React.useCallback(() => {
    setHistory((current) => ({
      ...current,
      index: Math.min(current.entries.length - 1, current.index + 1),
    }))
  }, [])

  const reset = React.useCallback((value?: T) => {
    const next = value === undefined ? (initialRef.current as T) : value
    setHistory({ entries: [next], index: 0 })
  }, [])

  return [
    history.entries[history.index] as T,
    setValue,
    {
      back,
      forward,
      reset,
      canUndo: history.index > 0,
      canRedo: history.index < history.entries.length - 1,
    },
  ]
}
