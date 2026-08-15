"use client"

import * as React from "react"

export type PermissionStatusValue =
  PermissionState | "unsupported" | "unavailable"

export interface PermissionResult {
  state: PermissionStatusValue
  supported: boolean
  error: unknown
}

export function usePermission(
  descriptor: PermissionDescriptor
): PermissionResult {
  const [state, setState] = React.useState<PermissionStatusValue>("unavailable")
  const [error, setError] = React.useState<unknown>()
  const descriptorKey = JSON.stringify(descriptor)

  React.useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions) {
      return
    }

    let active = true
    let permissionStatus: PermissionStatus | undefined
    let update: (() => void) | undefined

    void navigator.permissions
      .query(descriptor)
      .then((status) => {
        if (!active) return
        permissionStatus = status
        update = () => setState(status.state)
        update()
        status.addEventListener("change", update)
      })
      .catch((permissionError: unknown) => {
        if (!active) return
        setError(permissionError)
        setState("unavailable")
      })

    return () => {
      active = false
      if (permissionStatus && update) {
        permissionStatus.removeEventListener("change", update)
      }
    }
    // The serialized descriptor intentionally controls re-subscription.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [descriptorKey])

  return {
    state,
    supported:
      typeof navigator !== "undefined" && Boolean(navigator.permissions),
    error,
  }
}
