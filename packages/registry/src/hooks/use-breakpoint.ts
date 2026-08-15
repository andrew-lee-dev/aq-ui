"use client"

import { useMediaQuery } from "@aq-ui/registry/hooks/use-media-query"

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const

export type Breakpoint = keyof typeof breakpoints

export interface UseBreakpointOptions {
  direction?: "up" | "down"
  defaultValue?: boolean
}

export function useBreakpoint(
  breakpoint: Breakpoint | number,
  { direction = "up", defaultValue = false }: UseBreakpointOptions = {}
): boolean {
  const width =
    typeof breakpoint === "number" ? breakpoint : breakpoints[breakpoint]
  const query =
    direction === "up"
      ? "(min-width: " + width + "px)"
      : "(max-width: " + Math.max(0, width - 0.02) + "px)"

  return useMediaQuery(query, { defaultValue })
}
