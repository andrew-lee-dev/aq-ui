"use client"

import { useMediaQuery } from "@aq-ui/registry/hooks/use-media-query"

export function useReducedMotion(defaultValue = false): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)", { defaultValue })
}
