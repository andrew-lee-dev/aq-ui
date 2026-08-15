"use client"

import * as React from "react"

import type {
  EditorAssetUploadAdapter,
  UploadedAsset,
} from "@aq-ui/registry/lib/upload"
import { useLatest } from "@aq-ui/registry/hooks/use-latest"
import { useStableCallback } from "@aq-ui/registry/hooks/use-stable-callback"

export type FileUploadStatus =
  "idle" | "uploading" | "complete" | "error" | "canceled"

export interface FileUploadEntry {
  id: string
  file: File
  progress: number
  status: FileUploadStatus
  asset?: UploadedAsset
  error?: string
}

export interface FileUploadRejection {
  file: File
  reason: "type" | "size" | "max-files" | "multiple"
  message: string
}

export interface UseFileUploadOptions {
  value?: File[]
  defaultValue?: File[]
  onValueChange?: (files: File[]) => void
  uploadAdapter?: EditorAssetUploadAdapter
  autoUpload?: boolean
  accept?: string | string[]
  multiple?: boolean
  maxFiles?: number
  maxSize?: number
  disabled?: boolean
  onReject?: (rejections: FileUploadRejection[]) => void
  onUploadComplete?: (assets: UploadedAsset[]) => void
}

export interface FileUploadControls {
  inputRef: { current: HTMLInputElement | null }
  entries: FileUploadEntry[]
  files: File[]
  rejections: FileUploadRejection[]
  isDragging: boolean
  isUploading: boolean
  addFiles: (files: Iterable<File>) => FileUploadRejection[]
  remove: (id: string) => void
  clear: () => void
  upload: (id: string) => Promise<UploadedAsset | undefined>
  uploadAll: () => Promise<UploadedAsset[]>
  retry: (id: string) => Promise<UploadedAsset | undefined>
  cancel: (id: string) => void
  cancelAll: () => void
  open: () => void
  inputProps: React.InputHTMLAttributes<HTMLInputElement>
  rootProps: {
    onDragEnter: React.DragEventHandler<HTMLElement>
    onDragOver: React.DragEventHandler<HTMLElement>
    onDragLeave: React.DragEventHandler<HTMLElement>
    onDrop: React.DragEventHandler<HTMLElement>
  }
}

const EMPTY_FILES: File[] = []

export function createFileUploadId(file: File) {
  return [file.name, file.size, file.lastModified, file.type].join(":")
}

function normalizeAccept(accept: string | string[] | undefined) {
  if (!accept) return []
  return (Array.isArray(accept) ? accept : accept.split(","))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
}

function matchesAccept(file: File, patterns: string[]) {
  if (!patterns.length) return true
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return patterns.some((pattern) => {
    if (pattern.startsWith(".")) return name.endsWith(pattern)
    if (pattern.endsWith("/*")) return type.startsWith(pattern.slice(0, -1))
    return type === pattern
  })
}

function createEntry(file: File): FileUploadEntry {
  return {
    id: createFileUploadId(file),
    file,
    progress: 0,
    status: "idle",
  }
}

export function useFileUpload({
  value,
  defaultValue = EMPTY_FILES,
  onValueChange,
  uploadAdapter,
  autoUpload = true,
  accept,
  multiple = true,
  maxFiles = Number.POSITIVE_INFINITY,
  maxSize = Number.POSITIVE_INFINITY,
  disabled = false,
  onReject,
  onUploadComplete,
}: UseFileUploadOptions = {}): FileUploadControls {
  const controlled = value !== undefined
  const inputRef = React.useRef<HTMLInputElement>(null)
  const controllersRef = React.useRef(new Map<string, AbortController>())
  const dragDepthRef = React.useRef(0)
  const [isDragging, setIsDragging] = React.useState(false)
  const [rejections, setRejections] = React.useState<FileUploadRejection[]>([])
  const [internalEntries, setInternalEntries] = React.useState<
    FileUploadEntry[]
  >(() => defaultValue.map(createEntry))
  const patterns = React.useMemo(() => normalizeAccept(accept), [accept])
  const entries = React.useMemo(
    () =>
      controlled
        ? value.map(
            (file) =>
              internalEntries.find(
                (entry) => entry.id === createFileUploadId(file)
              ) ?? createEntry(file)
          )
        : internalEntries,
    [controlled, internalEntries, value]
  )
  const entriesRef = useLatest(entries)
  const onValueChangeStable = useStableCallback(onValueChange)
  const onRejectStable = useStableCallback(onReject)
  const onUploadCompleteStable = useStableCallback(onUploadComplete)

  const commit = React.useCallback(
    (
      updater: (current: FileUploadEntry[]) => FileUploadEntry[],
      notifyValueChange = false
    ) => {
      const next = updater(entriesRef.current)
      entriesRef.current = next
      setInternalEntries(next)
      if (notifyValueChange) {
        onValueChangeStable(next.map((entry) => entry.file))
      }
      return next
    },
    [entriesRef, onValueChangeStable]
  )

  const cancel = React.useCallback(
    (id: string) => {
      controllersRef.current.get(id)?.abort()
      controllersRef.current.delete(id)
      commit((current) =>
        current.map((entry) =>
          entry.id === id && entry.status === "uploading"
            ? { ...entry, status: "canceled", error: undefined }
            : entry
        )
      )
    },
    [commit]
  )

  const upload = React.useCallback(
    async (id: string): Promise<UploadedAsset | undefined> => {
      if (!uploadAdapter || disabled) return undefined
      const entry = entriesRef.current.find((item) => item.id === id)
      if (!entry) return undefined

      controllersRef.current.get(id)?.abort()
      const controller = new AbortController()
      controllersRef.current.set(id, controller)
      commit((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "uploading",
                progress: 0,
                error: undefined,
              }
            : item
        )
      )

      try {
        const asset = await uploadAdapter.upload(entry.file, {
          signal: controller.signal,
          onProgress(progress) {
            if (controller.signal.aborted) return
            commit((current) =>
              current.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      progress: Math.min(100, Math.max(0, progress)),
                    }
                  : item
              )
            )
          },
        })
        if (controller.signal.aborted) return undefined

        const next = commit((current) =>
          current.map((item) =>
            item.id === id
              ? { ...item, status: "complete", progress: 100, asset }
              : item
          )
        )
        if (
          next.length > 0 &&
          next.every((item) => item.status === "complete" && item.asset)
        ) {
          onUploadCompleteStable(
            next.flatMap((item) => (item.asset ? [item.asset] : []))
          )
        }
        return asset
      } catch (error) {
        if (!controller.signal.aborted) {
          commit((current) =>
            current.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status: "error",
                    error:
                      error instanceof Error ? error.message : "Upload failed",
                  }
                : item
            )
          )
        }
        return undefined
      } finally {
        if (controllersRef.current.get(id) === controller) {
          controllersRef.current.delete(id)
        }
      }
    },
    [commit, disabled, entriesRef, onUploadCompleteStable, uploadAdapter]
  )

  const addFiles = React.useCallback(
    (incoming: Iterable<File>) => {
      if (disabled) return []
      const current = entriesRef.current
      const known = new Set(current.map((entry) => entry.id))
      const accepted: FileUploadEntry[] = []
      const rejected: FileUploadRejection[] = []

      Array.from(incoming).forEach((file) => {
        const id = createFileUploadId(file)
        if (!multiple && current.length + accepted.length > 0) {
          rejected.push({
            file,
            reason: "multiple",
            message: "Only one file is allowed",
          })
        } else if (current.length + accepted.length >= maxFiles) {
          rejected.push({
            file,
            reason: "max-files",
            message: "The maximum file count has been reached",
          })
        } else if (file.size > maxSize) {
          rejected.push({
            file,
            reason: "size",
            message: "The file exceeds the maximum size",
          })
        } else if (!matchesAccept(file, patterns)) {
          rejected.push({
            file,
            reason: "type",
            message: "The file type is not accepted",
          })
        } else if (!known.has(id)) {
          known.add(id)
          accepted.push(createEntry(file))
        }
      })

      if (accepted.length) {
        commit(
          (existing) =>
            multiple ? [...existing, ...accepted] : accepted.slice(0, 1),
          true
        )
        if (autoUpload && uploadAdapter) {
          queueMicrotask(() => {
            accepted.forEach((entry) => void upload(entry.id))
          })
        }
      }
      setRejections(rejected)
      if (rejected.length) onRejectStable(rejected)
      return rejected
    },
    [
      autoUpload,
      commit,
      disabled,
      entriesRef,
      maxFiles,
      maxSize,
      multiple,
      onRejectStable,
      patterns,
      upload,
      uploadAdapter,
    ]
  )

  const remove = React.useCallback(
    (id: string) => {
      controllersRef.current.get(id)?.abort()
      controllersRef.current.delete(id)
      commit((current) => current.filter((entry) => entry.id !== id), true)
    },
    [commit]
  )

  const cancelAll = React.useCallback(() => {
    Array.from(controllersRef.current.keys()).forEach(cancel)
  }, [cancel])

  const clear = React.useCallback(() => {
    cancelAll()
    commit(() => [], true)
    setRejections([])
  }, [cancelAll, commit])

  const uploadAll = React.useCallback(async () => {
    const pending = entriesRef.current.filter(
      (entry) =>
        entry.status === "idle" ||
        entry.status === "error" ||
        entry.status === "canceled"
    )
    const assets = await Promise.all(pending.map((entry) => upload(entry.id)))
    return assets.filter((asset): asset is UploadedAsset => Boolean(asset))
  }, [entriesRef, upload])

  React.useEffect(() => {
    const controllers = controllersRef.current
    return () => controllers.forEach((controller) => controller.abort())
  }, [])

  const inputProps = React.useMemo<React.InputHTMLAttributes<HTMLInputElement>>(
    () => ({
      type: "file",
      accept: Array.isArray(accept) ? accept.join(",") : accept,
      multiple,
      disabled,
      onChange(event) {
        addFiles(Array.from(event.currentTarget.files ?? []))
        event.currentTarget.value = ""
      },
    }),
    [accept, addFiles, disabled, multiple]
  )

  const rootProps = React.useMemo(
    () => ({
      onDragEnter(event: React.DragEvent<HTMLElement>) {
        if (disabled) return
        event.preventDefault()
        dragDepthRef.current += 1
        if (event.dataTransfer.types.includes("Files")) setIsDragging(true)
      },
      onDragOver(event: React.DragEvent<HTMLElement>) {
        if (disabled) return
        event.preventDefault()
        event.dataTransfer.dropEffect = "copy"
      },
      onDragLeave(event: React.DragEvent<HTMLElement>) {
        if (disabled) return
        event.preventDefault()
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
        if (dragDepthRef.current === 0) setIsDragging(false)
      },
      onDrop(event: React.DragEvent<HTMLElement>) {
        if (disabled) return
        event.preventDefault()
        dragDepthRef.current = 0
        setIsDragging(false)
        addFiles(Array.from(event.dataTransfer.files))
      },
    }),
    [addFiles, disabled]
  )

  return {
    inputRef,
    entries,
    files: entries.map((entry) => entry.file),
    rejections,
    isDragging,
    isUploading: entries.some((entry) => entry.status === "uploading"),
    addFiles,
    remove,
    clear,
    upload,
    uploadAll,
    retry: upload,
    cancel,
    cancelAll,
    open: () => {
      if (!disabled) inputRef.current?.click()
    },
    inputProps,
    rootProps,
  }
}
