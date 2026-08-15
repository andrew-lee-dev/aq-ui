"use client"

import * as React from "react"

import { useLatest } from "@aq-ui/registry/hooks/use-latest"

export type AsyncStatus = "idle" | "pending" | "success" | "error"

export interface AsyncState<T> {
  status: AsyncStatus
  data: T | undefined
  error: unknown
}

export interface UseAsyncOptions<T, TArgs extends unknown[]> {
  initialData?: T
  immediate?: boolean
  initialArgs?: TArgs
}

export interface AsyncControls<
  T,
  TArgs extends unknown[],
> extends AsyncState<T> {
  execute: (...args: TArgs) => Promise<T | undefined>
  cancel: () => void
  reset: () => void
}

export function useAsync<T, TArgs extends unknown[] = []>(
  task: (signal: AbortSignal, ...args: TArgs) => Promise<T>,
  {
    initialData,
    immediate = false,
    initialArgs,
  }: UseAsyncOptions<T, TArgs> = {}
): AsyncControls<T, TArgs> {
  const taskRef = useLatest(task)
  const initialArgsRef = useLatest(initialArgs)
  const initialDataRef = React.useRef(initialData)
  const controllerRef = React.useRef<AbortController | null>(null)
  const invocationRef = React.useRef(0)
  const mountedRef = React.useRef(true)
  const [state, setState] = React.useState<AsyncState<T>>({
    status: "idle",
    data: initialData,
    error: undefined,
  })

  const cancel = React.useCallback(() => {
    invocationRef.current += 1
    controllerRef.current?.abort()
    controllerRef.current = null
    if (mountedRef.current) {
      setState((current) => ({
        ...current,
        status: current.status === "pending" ? "idle" : current.status,
      }))
    }
  }, [])

  const reset = React.useCallback(() => {
    cancel()
    setState({
      status: "idle",
      data: initialDataRef.current,
      error: undefined,
    })
  }, [cancel])

  const execute = React.useCallback(
    async (...args: TArgs): Promise<T | undefined> => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      const invocation = ++invocationRef.current
      setState((current) => ({
        status: "pending",
        data: current.data,
        error: undefined,
      }))

      try {
        const data = await taskRef.current(controller.signal, ...args)
        if (
          mountedRef.current &&
          invocationRef.current === invocation &&
          !controller.signal.aborted
        ) {
          setState({ status: "success", data, error: undefined })
        }
        return controller.signal.aborted ? undefined : data
      } catch (error) {
        if (
          mountedRef.current &&
          invocationRef.current === invocation &&
          !controller.signal.aborted
        ) {
          setState((current) => ({ ...current, status: "error", error }))
        }
        if (!controller.signal.aborted) throw error
        return undefined
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null
      }
    },
    [taskRef]
  )

  React.useEffect(() => {
    mountedRef.current = true
    if (immediate) {
      void execute(...(initialArgsRef.current ?? ([] as unknown as TArgs)))
    }
    return () => {
      mountedRef.current = false
      controllerRef.current?.abort()
    }
  }, [execute, immediate, initialArgsRef])

  return { ...state, execute, cancel, reset }
}
