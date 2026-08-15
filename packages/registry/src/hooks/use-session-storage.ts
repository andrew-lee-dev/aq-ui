"use client"

import {
  useStorage,
  type StorageOptions,
  type StorageSetter,
} from "@aq-ui/registry/hooks/_storage"

export type SessionStorageOptions<T> = StorageOptions<T>
export type SessionStorageSetter<T> = StorageSetter<T>

export function useSessionStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options?: SessionStorageOptions<T>
): [T, SessionStorageSetter<T>, () => void] {
  return useStorage("sessionStorage", key, initialValue, options)
}
