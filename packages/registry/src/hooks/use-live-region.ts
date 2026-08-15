"use client"

import * as React from "react"

import { useHydrated } from "@aq-ui/registry/hooks/use-hydrated"
import { useStableCallback } from "@aq-ui/registry/hooks/use-stable-callback"

export type LiveRegionPoliteness = "polite" | "assertive"

export interface UseLiveRegionOptions {
  politeness?: LiveRegionPoliteness
  clearAfter?: number
}

export interface LiveRegionControls {
  announce: (message: string) => void
  clear: () => void
  supported: boolean
}

interface LiveRegionRecord {
  element: HTMLDivElement
  consumers: number
}

const liveRegions = new WeakMap<
  Document,
  Map<LiveRegionPoliteness, LiveRegionRecord>
>()

function acquireRegion(
  document: Document,
  politeness: LiveRegionPoliteness
): LiveRegionRecord {
  let regions = liveRegions.get(document)
  if (!regions) {
    regions = new Map()
    liveRegions.set(document, regions)
  }
  let record = regions.get(politeness)
  if (!record) {
    const element = document.createElement("div")
    element.setAttribute(
      "role",
      politeness === "assertive" ? "alert" : "status"
    )
    element.setAttribute("aria-live", politeness)
    element.setAttribute("aria-atomic", "true")
    Object.assign(element.style, {
      border: "0",
      clip: "rect(0 0 0 0)",
      clipPath: "inset(50%)",
      height: "1px",
      margin: "-1px",
      overflow: "hidden",
      padding: "0",
      position: "absolute",
      whiteSpace: "nowrap",
      width: "1px",
    })
    document.body.append(element)
    record = { element, consumers: 0 }
    regions.set(politeness, record)
  }
  record.consumers += 1
  return record
}

export function useLiveRegion({
  politeness = "polite",
  clearAfter = 7_000,
}: UseLiveRegionOptions = {}): LiveRegionControls {
  const regionRef = React.useRef<LiveRegionRecord | null>(null)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const supported = useHydrated()

  const clear = useStableCallback(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current)
    timerRef.current = null
    if (regionRef.current) regionRef.current.element.textContent = ""
  })

  const announce = useStableCallback((message: string) => {
    const record = regionRef.current
    if (!record) return
    clear()
    // Clearing first ensures identical consecutive messages are announced.
    requestAnimationFrame(() => {
      if (!regionRef.current) return
      record.element.textContent = message
      if (clearAfter > 0) {
        timerRef.current = setTimeout(clear, clearAfter)
      }
    })
  })

  React.useEffect(() => {
    if (typeof document === "undefined") return
    const record = acquireRegion(document, politeness)
    regionRef.current = record
    return () => {
      clear()
      regionRef.current = null
      record.consumers -= 1
      if (record.consumers === 0) {
        record.element.remove()
        liveRegions.get(document)?.delete(politeness)
      }
    }
  }, [clear, politeness])

  return { announce, clear, supported }
}
