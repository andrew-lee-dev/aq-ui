"use client"

import {
  useStorage,
  type StorageOptions,
  type StorageSetter,
} from "@aq-ui/registry/hooks/_storage"

export type LocalStorageOptions<T> = StorageOptions<T>
export type LocalStorageSetter<T> = StorageSetter<T>

export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options?: LocalStorageOptions<T>
): [T, LocalStorageSetter<T>, () => void] {
  return useStorage("localStorage", key, initialValue, options)
}
