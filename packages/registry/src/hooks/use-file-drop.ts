"use client"

import * as React from "react"

import { useStableCallback } from "@aq-ui/registry/hooks/use-stable-callback"

export interface FileDropRejection {
  file: File
  reason: "type" | "size" | "multiple"
}

export interface UseFileDropOptions {
  accept?: string[]
  multiple?: boolean
  maxSize?: number
  disabled?: boolean
  onDrop?: (files: File[]) => void
  onReject?: (rejections: FileDropRejection[]) => void
}

export interface FileDropBind<T extends HTMLElement> {
  isDragging: boolean
  files: File[]
  rejections: FileDropRejection[]
  reset: () => void
  rootProps: {
    onDragEnter: React.DragEventHandler<T>
    onDragOver: React.DragEventHandler<T>
    onDragLeave: React.DragEventHandler<T>
    onDrop: React.DragEventHandler<T>
  }
}

const EMPTY_ACCEPT: string[] = []

function acceptsFile(file: File, accepted: string[]) {
  if (accepted.length === 0) return true
  return accepted.some((pattern) => {
    if (pattern.startsWith(".")) {
      return file.name.toLowerCase().endsWith(pattern.toLowerCase())
    }
    if (pattern.endsWith("/*")) {
      return file.type.startsWith(pattern.slice(0, -1))
    }
    return file.type === pattern
  })
}

export function useFileDrop<T extends HTMLElement>({
  accept = EMPTY_ACCEPT,
  multiple = true,
  maxSize = Number.POSITIVE_INFINITY,
  disabled = false,
  onDrop,
  onReject,
}: UseFileDropOptions = {}): FileDropBind<T> {
  const [isDragging, setIsDragging] = React.useState(false)
  const [files, setFiles] = React.useState<File[]>([])
  const [rejections, setRejections] = React.useState<FileDropRejection[]>([])
  const dragDepthRef = React.useRef(0)
  const onDropStable = useStableCallback(onDrop)
  const onRejectStable = useStableCallback(onReject)

  const reset = React.useCallback(() => {
    dragDepthRef.current = 0
    setIsDragging(false)
    setFiles([])
    setRejections([])
  }, [])

  const rootProps = React.useMemo(
    () => ({
      onDragEnter(event: React.DragEvent<T>) {
        if (disabled) return
        event.preventDefault()
        dragDepthRef.current += 1
        if (event.dataTransfer.types.includes("Files")) setIsDragging(true)
      },
      onDragOver(event: React.DragEvent<T>) {
        if (disabled) return
        event.preventDefault()
        event.dataTransfer.dropEffect = "copy"
      },
      onDragLeave(event: React.DragEvent<T>) {
        if (disabled) return
        event.preventDefault()
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
        if (dragDepthRef.current === 0) setIsDragging(false)
      },
      onDrop(event: React.DragEvent<T>) {
        if (disabled) return
        event.preventDefault()
        dragDepthRef.current = 0
        setIsDragging(false)
        const dropped = Array.from(event.dataTransfer.files)
        const acceptedFiles: File[] = []
        const rejectedFiles: FileDropRejection[] = []

        dropped.forEach((file, index) => {
          if (!multiple && index > 0) {
            rejectedFiles.push({ file, reason: "multiple" })
          } else if (file.size > maxSize) {
            rejectedFiles.push({ file, reason: "size" })
          } else if (!acceptsFile(file, accept)) {
            rejectedFiles.push({ file, reason: "type" })
          } else {
            acceptedFiles.push(file)
          }
        })

        setFiles(acceptedFiles)
        setRejections(rejectedFiles)
        if (acceptedFiles.length) onDropStable(acceptedFiles)
        if (rejectedFiles.length) onRejectStable(rejectedFiles)
      },
    }),
    [accept, disabled, maxSize, multiple, onDropStable, onRejectStable]
  )

  return { isDragging, files, rejections, reset, rootProps }
}
