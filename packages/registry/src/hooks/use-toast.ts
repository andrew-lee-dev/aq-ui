"use client"

import * as React from "react"
import type {
  ToastManager,
  ToastManagerAddOptions,
  ToastManagerPromiseOptions,
  ToastManagerUpdateOptions,
} from "@base-ui/react/toast"

import { toast as defaultToastManager } from "@aq-ui/registry/components/toast"

export type ToastInput<Data extends object> =
  React.ReactNode | ToastManagerAddOptions<Data>

export interface ToastController<Data extends object> {
  show: (options: ToastManagerAddOptions<Data>) => string
  success: (input: ToastInput<Data>) => string
  info: (input: ToastInput<Data>) => string
  warning: (input: ToastInput<Data>) => string
  error: (input: ToastInput<Data>) => string
  loading: (input: ToastInput<Data>) => string
  update: (id: string, options: ToastManagerUpdateOptions<Data>) => void
  dismiss: (id?: string) => void
  promise: <Value>(
    promise: Promise<Value>,
    options: ToastManagerPromiseOptions<Value, Data>
  ) => Promise<Value>
}

function normalizeToast<Data extends object>(
  input: ToastInput<Data>,
  type: string
): ToastManagerAddOptions<Data> {
  if (
    input !== null &&
    typeof input === "object" &&
    !React.isValidElement(input)
  ) {
    return { ...(input as ToastManagerAddOptions<Data>), type }
  }
  return { title: input, type }
}

export function useToast<Data extends object = Record<string, unknown>>(
  manager: ToastManager<Data> = defaultToastManager as ToastManager<Data>
): ToastController<Data> {
  return React.useMemo(
    () => ({
      show: (options) => manager.add(options),
      success: (input) => manager.add(normalizeToast(input, "success")),
      info: (input) => manager.add(normalizeToast(input, "info")),
      warning: (input) => manager.add(normalizeToast(input, "warning")),
      error: (input) => manager.add(normalizeToast(input, "error")),
      loading: (input) =>
        manager.add({ ...normalizeToast(input, "loading"), timeout: 0 }),
      update: (id, options) => manager.update(id, options),
      dismiss: (id) => manager.close(id),
      promise: (promise, options) => manager.promise(promise, options),
    }),
    [manager]
  )
}
