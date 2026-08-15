"use client"

import * as React from "react"

import { resolveTarget, type Target } from "@aq-ui/registry/hooks/_target"

export interface UsePortalContainerOptions {
  parent?: Target<HTMLElement>
  id?: string
  className?: string
  attributes?: Record<string, string>
  enabled?: boolean
}

export function usePortalContainer({
  parent,
  id,
  className,
  attributes,
  enabled = true,
}: UsePortalContainerOptions = {}): HTMLElement | null {
  const [container, setContainer] = React.useState<HTMLElement | null>(null)
  const attributesKey = JSON.stringify(attributes)

  React.useEffect(() => {
    if (!enabled || typeof document === "undefined") {
      // The state mirrors ownership of the external portal node.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setContainer(null)
      return
    }
    const host = resolveTarget(parent) ?? document.body
    const element = document.createElement("div")
    element.dataset.slot = "portal-container"
    if (id) element.id = id
    if (className) element.className = className
    Object.entries(attributes ?? {}).forEach(([name, value]) => {
      element.setAttribute(name, value)
    })
    host.append(element)
    setContainer(element)

    return () => {
      element.remove()
      setContainer((current) => (current === element ? null : current))
    }
    // Serialized attributes intentionally control container recreation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attributesKey, className, enabled, id, parent])

  return container
}
