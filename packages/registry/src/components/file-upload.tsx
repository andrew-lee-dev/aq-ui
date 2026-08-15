"use client"

import * as React from "react"
import {
  FileIcon,
  LoaderCircleIcon,
  RotateCcwIcon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@aq-ui/registry/components/button"
import { Progress } from "@aq-ui/registry/components/progress"
import {
  useFileUpload,
  type FileUploadEntry as ControllerFileUploadEntry,
  type FileUploadRejection,
  type FileUploadStatus,
} from "@aq-ui/registry/hooks/use-file-upload"
import { cn } from "@aq-ui/registry/lib/utils"
import type {
  EditorAssetUploadAdapter,
  UploadedAsset,
} from "@aq-ui/registry/lib/upload"

type UploadStatus = FileUploadStatus
type FileUploadEntry = ControllerFileUploadEntry

interface FileUploadProps extends Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onChange"
> {
  value?: File[]
  defaultValue?: File[]
  onValueChange?: (files: File[]) => void
  onUploadComplete?: (assets: UploadedAsset[]) => void
  uploadAdapter?: EditorAssetUploadAdapter
  autoUpload?: boolean
  accept?: string
  multiple?: boolean
  maxFiles?: number
  maxSize?: number
  disabled?: boolean
  onReject?: (rejections: FileUploadRejection[]) => void
  name?: string
  label?: React.ReactNode
  description?: React.ReactNode
}

const FileUpload = React.forwardRef<React.ComponentRef<"div">, FileUploadProps>(
  function FileUpload(
    {
      value,
      defaultValue = [],
      onValueChange,
      onUploadComplete,
      uploadAdapter,
      autoUpload = true,
      accept,
      multiple = true,
      maxFiles = Number.POSITIVE_INFINITY,
      maxSize = Number.POSITIVE_INFINITY,
      disabled,
      onReject,
      name,
      label = "Drop files here or choose files",
      description,
      className,
      ...props
    },
    ref
  ) {
    const {
      inputRef,
      inputProps,
      rootProps,
      entries,
      isDragging,
      open,
      remove,
      retry,
    } = useFileUpload({
      value,
      defaultValue,
      onValueChange,
      onUploadComplete,
      uploadAdapter,
      autoUpload,
      accept,
      multiple,
      maxFiles,
      maxSize,
      disabled,
      onReject,
    })

    return (
      <div
        ref={ref}
        data-slot="file-upload"
        className={cn("flex flex-col gap-3", className)}
        {...props}
      >
        <input
          ref={inputRef}
          data-slot="file-upload-input"
          type="file"
          name={name}
          {...inputProps}
          hidden
          tabIndex={-1}
        />
        <button
          type="button"
          data-slot="file-upload-dropzone"
          data-dragging={isDragging || undefined}
          disabled={disabled}
          className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 p-6 text-center transition-colors outline-none hover:bg-muted/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[dragging=true]:border-primary data-[dragging=true]:bg-primary/5"
          onClick={open}
          {...rootProps}
        >
          <UploadCloudIcon className="size-8 text-muted-foreground" />
          <span className="font-medium">{label}</span>
          {description ? (
            <span className="text-sm text-muted-foreground">{description}</span>
          ) : null}
        </button>
        {entries.length ? (
          <ul
            data-slot="file-upload-list"
            className="flex flex-col gap-2"
            aria-live="polite"
          >
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <FileIcon className="size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {entry.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(entry.file.size)}
                    {entry.error ? ` · ${entry.error}` : ""}
                  </p>
                  {entry.status === "uploading" ? (
                    <Progress value={entry.progress} className="mt-2 h-1.5" />
                  ) : null}
                </div>
                {entry.status === "uploading" ? (
                  <LoaderCircleIcon
                    className="size-4 animate-spin"
                    aria-label="Uploading"
                  />
                ) : null}
                {entry.status === "error" && uploadAdapter ? (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => void retry(entry.id)}
                    aria-label={`Retry ${entry.file.name}`}
                  >
                    <RotateCcwIcon />
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => remove(entry.id)}
                  aria-label={`Remove ${entry.file.name}`}
                >
                  <XIcon />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    )
  }
)
FileUpload.displayName = "FileUpload"

function formatBytes(bytes: number) {
  if (!bytes) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  )
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`
}

export {
  FileUpload,
  type FileUploadEntry,
  type FileUploadProps,
  type UploadStatus,
}
