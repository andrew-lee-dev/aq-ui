"use client"

import * as React from "react"

import { resolveTarget, type Target } from "@aq-ui/registry/hooks/_target"
import { useIsomorphicLayoutEffect } from "@aq-ui/registry/hooks/use-isomorphic-layout-effect"

export interface UseAutosizeTextareaOptions {
  minRows?: number
  maxRows?: number
}

export function useAutosizeTextarea(
  target: Target<HTMLTextAreaElement>,
  value: string,
  {
    minRows = 1,
    maxRows = Number.POSITIVE_INFINITY,
  }: UseAutosizeTextareaOptions = {}
): number {
  const [height, setHeight] = React.useState(0)

  useIsomorphicLayoutEffect(() => {
    const textarea = resolveTarget(target)
    if (!textarea) return
    const style = getComputedStyle(textarea)
    const lineHeight = Number.parseFloat(style.lineHeight) || 20
    const padding =
      (Number.parseFloat(style.paddingTop) || 0) +
      (Number.parseFloat(style.paddingBottom) || 0)
    const border =
      (Number.parseFloat(style.borderTopWidth) || 0) +
      (Number.parseFloat(style.borderBottomWidth) || 0)
    const minimum = minRows * lineHeight + padding + border
    const maximum = maxRows * lineHeight + padding + border

    textarea.style.height = "0px"
    const nextHeight = Math.max(
      minimum,
      Math.min(textarea.scrollHeight + border, maximum)
    )
    textarea.style.height = nextHeight + "px"
    textarea.style.overflowY =
      textarea.scrollHeight + border > maximum ? "auto" : "hidden"
    setHeight(nextHeight)
  }, [maxRows, minRows, target, value])

  return height
}
