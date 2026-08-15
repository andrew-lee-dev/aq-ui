"use client"

import * as React from "react"

import { useControllableState } from "@aq-ui/registry/hooks/use-controllable-state"

export interface UseToggleOptions {
  value?: boolean
  defaultValue?: boolean
  onChange?: (value: boolean) => void
}

export interface ToggleControls {
  toggle: () => void
  setOn: () => void
  setOff: () => void
  setValue: (value: boolean) => void
}

export function useToggle({
  value,
  defaultValue = false,
  onChange,
}: UseToggleOptions = {}): [boolean, ToggleControls] {
  const [enabled, setValue] = useControllableState({
    value,
    defaultValue,
    onChange,
  })

  const controls = React.useMemo<ToggleControls>(
    () => ({
      toggle: () => setValue((current) => !current),
      setOn: () => setValue(true),
      setOff: () => setValue(false),
      setValue,
    }),
    [setValue]
  )

  return [enabled, controls]
}
