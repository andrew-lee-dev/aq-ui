"use client"

import { useMediaQuery } from "@aq-ui/registry/hooks/use-media-query"

export type PreferredColorScheme = "light" | "dark"

export function usePreferredColorScheme(
  defaultValue: PreferredColorScheme = "light"
): PreferredColorScheme {
  const dark = useMediaQuery("(prefers-color-scheme: dark)", {
    defaultValue: defaultValue === "dark",
  })
  return dark ? "dark" : "light"
}
