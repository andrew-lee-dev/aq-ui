"use client"

import * as React from "react"

interface MediaQueryStore {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => boolean
}

const mediaQueryStores = new Map<string, MediaQueryStore>()

function createMediaQueryStore(query: string): MediaQueryStore {
  let mediaQueryList: MediaQueryList | null = null
  let value = false
  const listeners = new Set<() => void>()

  const ensureList = () => {
    if (!mediaQueryList && typeof window !== "undefined") {
      mediaQueryList = window.matchMedia(query)
      value = mediaQueryList.matches
    }
    return mediaQueryList
  }

  const onChange = (event: MediaQueryListEvent) => {
    value = event.matches
    listeners.forEach((listener) => listener())
  }

  return {
    subscribe(listener) {
      listeners.add(listener)
      const list = ensureList()
      if (listeners.size === 1) list?.addEventListener("change", onChange)

      return () => {
        listeners.delete(listener)
        if (listeners.size === 0 && mediaQueryList) {
          mediaQueryList.removeEventListener("change", onChange)
          mediaQueryList = null
        }
      }
    },
    getSnapshot() {
      const list = ensureList()
      if (list) value = list.matches
      return value
    },
  }
}

function getMediaQueryStore(query: string) {
  let store = mediaQueryStores.get(query)
  if (!store) {
    store = createMediaQueryStore(query)
    mediaQueryStores.set(query, store)
  }
  return store
}

export interface UseMediaQueryOptions {
  defaultValue?: boolean
}

export function useMediaQuery(
  query: string,
  { defaultValue = false }: UseMediaQueryOptions = {}
): boolean {
  const store = React.useMemo(() => getMediaQueryStore(query), [query])
  return React.useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    () => defaultValue
  )
}
