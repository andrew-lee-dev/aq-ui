"use client"

import * as React from "react"

import { useControllableState } from "@aq-ui/registry/hooks/use-controllable-state"

export interface UseDisclosureOptions {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export interface DisclosureControls {
  open: () => void
  close: () => void
  toggle: () => void
  setOpen: (open: boolean) => void
}

export function useDisclosure({
  open,
  defaultOpen = false,
  onOpenChange,
}: UseDisclosureOptions = {}): [boolean, DisclosureControls] {
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })

  const controls = React.useMemo<DisclosureControls>(
    () => ({
      open: () => setOpen(true),
      close: () => setOpen(false),
      toggle: () => setOpen((current) => !current),
      setOpen,
    }),
    [setOpen]
  )

  return [isOpen, controls]
}
