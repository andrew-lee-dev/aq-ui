"use client"

import * as React from "react"

export interface UseDocumentTitleOptions {
  restoreOnUnmount?: boolean
}

export function useDocumentTitle(
  title: string,
  { restoreOnUnmount = true }: UseDocumentTitleOptions = {}
): void {
  const originalTitleRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (typeof document === "undefined") return
    if (originalTitleRef.current === null) {
      originalTitleRef.current = document.title
    }
    document.title = title

    return () => {
      if (restoreOnUnmount && originalTitleRef.current !== null) {
        document.title = originalTitleRef.current
      }
    }
  }, [restoreOnUnmount, title])
}
