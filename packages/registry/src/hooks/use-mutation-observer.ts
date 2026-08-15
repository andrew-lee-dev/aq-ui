"use client"

import * as React from "react"

import {
  getMutationObserverOptionsKey,
  subscribeMutationObserver,
} from "@aq-ui/registry/hooks/_observer-pools"
import { resolveTarget, type Target } from "@aq-ui/registry/hooks/_target"
import { useStableCallback } from "@aq-ui/registry/hooks/use-stable-callback"

export interface UseMutationObserverOptions {
  enabled?: boolean
  onMutate?: (records: MutationRecord[]) => void
}

export interface MutationObserverResult {
  records: MutationRecord[]
  supported: boolean
}

export function useMutationObserver<T extends Node>(
  target: Target<T>,
  observerOptions: MutationObserverInit,
  { enabled = true, onMutate }: UseMutationObserverOptions = {}
): MutationObserverResult {
  const [records, setRecords] = React.useState<MutationRecord[]>([])
  const onMutateStable = useStableCallback(onMutate)
  const optionsKey = getMutationObserverOptionsKey(observerOptions)

  React.useEffect(() => {
    if (!enabled) return
    const node = resolveTarget(target)
    if (!node) return
    const unsubscribe = subscribeMutationObserver(
      node,
      observerOptions,
      (nextRecords) => {
        setRecords(nextRecords)
        onMutateStable(nextRecords)
      }
    )
    return unsubscribe ?? undefined
    // Serialized observer options intentionally control re-subscription.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, onMutateStable, optionsKey, target])

  return {
    records,
    supported:
      typeof window !== "undefined" && typeof MutationObserver !== "undefined",
  }
}
