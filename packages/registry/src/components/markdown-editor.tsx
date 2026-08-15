"use client"

import "@aq-ui/registry/lib/code-language-markdown"

import * as React from "react"
import type { PluggableList } from "unified"
import type { Schema } from "hast-util-sanitize"
import {
  BoldIcon,
  BracesIcon,
  Columns2Icon,
  EyeIcon,
  Heading2Icon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListChecksIcon,
  ListIcon,
  ListOrderedIcon,
  Loader2Icon,
  Maximize2Icon,
  Minimize2Icon,
  PencilIcon,
  QuoteIcon,
  StrikethroughIcon,
  TableIcon,
} from "lucide-react"

import { Button } from "@aq-ui/registry/components/button"
import { CodeEditor } from "@aq-ui/registry/components/code-editor"
import {
  MarkdownRenderer,
  type MarkdownRendererProps,
} from "@aq-ui/registry/components/markdown-renderer"
import type { CodeEditorHandle } from "@aq-ui/registry/hooks/use-code-editor"
import {
  useMarkdownEditor,
  type MarkdownCommand,
  type MarkdownEditorMode,
} from "@aq-ui/registry/hooks/use-markdown-editor"
import type { EditorAssetUploadAdapter } from "@aq-ui/registry/lib/upload"
import { cn } from "@aq-ui/registry/lib/utils"

interface MarkdownEditorContextValue {
  editor: CodeEditorHandle | null
  mode: MarkdownEditorMode
  setMode: (mode: MarkdownEditorMode) => void
  runCommand: (command: MarkdownCommand) => void
  fullscreen: boolean
  toggleFullscreen: () => void
  disabled: boolean
  readOnly: boolean
  uploading: boolean
}

const MarkdownEditorContext =
  React.createContext<MarkdownEditorContextValue | null>(null)

const emptyMarkdownPlugins: PluggableList = []

function safeUploadedMarkdownUrl(value: string) {
  const url = value.trim()
  if (url.startsWith("/") && !url.startsWith("//")) return url

  try {
    const parsed = new URL(url)
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? url
      : null
  } catch {
    return null
  }
}

function useMarkdownEditorContext() {
  return React.useContext(MarkdownEditorContext)
}

const toolbarCommands: Array<{
  command: MarkdownCommand
  label: string
  icon: React.ComponentType<{
    className?: string
    "aria-hidden"?: React.AriaAttributes["aria-hidden"]
  }>
}> = [
  { command: "bold", label: "Bold", icon: BoldIcon },
  { command: "italic", label: "Italic", icon: ItalicIcon },
  { command: "strike", label: "Strikethrough", icon: StrikethroughIcon },
  { command: "heading", label: "Heading", icon: Heading2Icon },
  { command: "bullet-list", label: "Bullet list", icon: ListIcon },
  { command: "ordered-list", label: "Ordered list", icon: ListOrderedIcon },
  { command: "task-list", label: "Task list", icon: ListChecksIcon },
  { command: "quote", label: "Quote", icon: QuoteIcon },
  { command: "link", label: "Link", icon: LinkIcon },
  { command: "image", label: "Image", icon: ImageIcon },
  { command: "table", label: "Table", icon: TableIcon },
  { command: "code", label: "Code", icon: BracesIcon },
]

interface MarkdownEditorToolbarProps extends React.ComponentProps<"div"> {
  hideModeSwitcher?: boolean
  hideFullscreen?: boolean
}

function MarkdownEditorToolbar({
  className,
  hideModeSwitcher = false,
  hideFullscreen = false,
  children,
  ...props
}: MarkdownEditorToolbarProps) {
  const context = useMarkdownEditorContext()

  return (
    <div
      data-slot="markdown-editor-toolbar"
      role="toolbar"
      aria-label="Markdown formatting"
      className={cn(
        "flex min-h-10 flex-wrap items-center gap-0.5 border-b bg-muted/30 p-1",
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          {toolbarCommands.map(({ command, label, icon: Icon }) => (
            <Button
              key={command}
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={label}
              title={label}
              disabled={!context || context.disabled || context.readOnly}
              onClick={() => context?.runCommand(command)}
            >
              <Icon aria-hidden={true} />
            </Button>
          ))}

          {!hideModeSwitcher ? (
            <div
              className="ms-auto flex items-center gap-0.5"
              role="group"
              aria-label="View mode"
            >
              <Button
                type="button"
                variant={context?.mode === "write" ? "secondary" : "ghost"}
                size="icon-sm"
                aria-label="Write mode"
                title="Write mode"
                onClick={() => context?.setMode("write")}
              >
                <PencilIcon aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant={context?.mode === "split" ? "secondary" : "ghost"}
                size="icon-sm"
                aria-label="Split mode"
                title="Split mode"
                onClick={() => context?.setMode("split")}
              >
                <Columns2Icon aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant={context?.mode === "preview" ? "secondary" : "ghost"}
                size="icon-sm"
                aria-label="Preview mode"
                title="Preview mode"
                onClick={() => context?.setMode("preview")}
              >
                <EyeIcon aria-hidden="true" />
              </Button>
            </div>
          ) : null}

          {!hideFullscreen ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={hideModeSwitcher ? "ms-auto" : undefined}
              aria-label={
                context?.fullscreen ? "Exit fullscreen" : "Enter fullscreen"
              }
              title={
                context?.fullscreen ? "Exit fullscreen" : "Enter fullscreen"
              }
              onClick={() => context?.toggleFullscreen()}
            >
              {context?.fullscreen ? (
                <Minimize2Icon aria-hidden="true" />
              ) : (
                <Maximize2Icon aria-hidden="true" />
              )}
            </Button>
          ) : null}
        </>
      )}
    </div>
  )
}

interface MarkdownEditorPreviewProps extends MarkdownRendererProps {
  emptyLabel?: string
}

const MarkdownEditorPreview = React.forwardRef<
  HTMLDivElement,
  MarkdownEditorPreviewProps
>(function MarkdownEditorPreview(
  { value, className, emptyLabel = "Nothing to preview", ...props },
  ref
) {
  return (
    <div
      ref={ref}
      data-slot="markdown-editor-preview"
      className={cn("min-h-0 overflow-auto p-4", className)}
      tabIndex={0}
      aria-label="Markdown preview"
    >
      {value ? (
        <MarkdownRenderer value={value} {...props} />
      ) : (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  )
})

interface MarkdownEditorStatusBarProps extends React.ComponentProps<"div"> {
  characters?: number
  words?: number
  maxLength?: number
  uploading?: boolean
  error?: Error | null
}

function MarkdownEditorStatusBar({
  className,
  characters = 0,
  words = 0,
  maxLength,
  uploading = false,
  error,
  children,
  ...props
}: MarkdownEditorStatusBarProps) {
  return (
    <div
      data-slot="markdown-editor-status-bar"
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-8 items-center gap-3 border-t bg-muted/30 px-3 text-xs text-muted-foreground",
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          <span>{words.toLocaleString()} words</span>
          <span>
            {characters.toLocaleString()}
            {typeof maxLength === "number"
              ? ` / ${maxLength.toLocaleString()}`
              : ""}{" "}
            characters
          </span>
          {uploading ? (
            <span className="ms-auto inline-flex items-center gap-1.5">
              <Loader2Icon className="size-3 animate-spin" aria-hidden="true" />
              Uploading…
            </span>
          ) : null}
          {error ? (
            <span className="ms-auto text-destructive" title={error.message}>
              Upload failed
            </span>
          ) : null}
        </>
      )}
    </div>
  )
}

interface MarkdownEditorProps extends Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onChange"
> {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  mode?: MarkdownEditorMode
  defaultMode?: MarkdownEditorMode
  onModeChange?: (mode: MarkdownEditorMode) => void
  readOnly?: boolean
  disabled?: boolean
  placeholder?: string
  maxLength?: number
  autofocus?: boolean
  minHeight?: string | number
  maxHeight?: string | number
  uploadAdapter?: EditorAssetUploadAdapter
  remarkPlugins?: PluggableList
  rehypePlugins?: PluggableList
  sanitizeSchema?: Schema
  allowHtml?: boolean
  toolbar?: boolean
  statusBar?: boolean
}

const MarkdownEditor = React.forwardRef<HTMLDivElement, MarkdownEditorProps>(
  function MarkdownEditor(
    {
      value,
      defaultValue = "",
      onChange,
      mode,
      defaultMode = "write",
      onModeChange,
      readOnly = false,
      disabled = false,
      placeholder = "Write Markdown…",
      maxLength,
      autofocus = false,
      minHeight = 320,
      maxHeight,
      uploadAdapter,
      remarkPlugins = emptyMarkdownPlugins,
      rehypePlugins = emptyMarkdownPlugins,
      sanitizeSchema,
      allowHtml = false,
      toolbar = true,
      statusBar = true,
      className,
      style,
      onKeyDownCapture,
      onPasteCapture,
      onDropCapture,
      ...props
    },
    forwardedRef
  ) {
    const controller = useMarkdownEditor({
      value,
      defaultValue,
      onChange,
      mode,
      defaultMode,
      onModeChange,
      maxLength,
    })
    const {
      value: markdownValue,
      setValue: setMarkdownValue,
      mode: editorMode,
      setMode: setEditorMode,
      fullscreen,
      setFullscreen,
      toggleFullscreen,
      runCommand: runMarkdownCommand,
      characters,
      words,
    } = controller
    const editorRef = React.useRef<CodeEditorHandle>(null)
    const previewRef = React.useRef<HTMLDivElement>(null)
    const [editorHandle, setEditorHandle] =
      React.useState<CodeEditorHandle | null>(null)
    const [uploading, setUploading] = React.useState(0)
    const [uploadError, setUploadError] = React.useState<Error | null>(null)
    const uploadsRef = React.useRef(new Set<AbortController>())
    const deferredValue = React.useDeferredValue(markdownValue)

    const handleValueChange = React.useCallback(
      (nextValue: string) => {
        const limited =
          typeof maxLength === "number"
            ? nextValue.slice(0, Math.max(0, maxLength))
            : nextValue
        setMarkdownValue(limited)

        if (limited !== nextValue) {
          queueMicrotask(() => {
            if (editorRef.current?.getValue() !== limited) {
              editorRef.current?.setValue(limited)
            }
          })
        }
      },
      [maxLength, setMarkdownValue]
    )

    const runCommand = React.useCallback(
      (command: MarkdownCommand) => {
        runMarkdownCommand(command, editorRef.current)
      },
      [runMarkdownCommand]
    )

    const handleFiles = React.useCallback(
      async (files: readonly File[]) => {
        if (!uploadAdapter || disabled || readOnly || files.length === 0) return
        setUploadError(null)

        for (const file of files) {
          const abortController = new AbortController()
          uploadsRef.current.add(abortController)
          setUploading((count) => count + 1)

          try {
            const asset = await uploadAdapter.upload(file, {
              signal: abortController.signal,
              onProgress: () => undefined,
            })
            if (abortController.signal.aborted) continue
            const url = safeUploadedMarkdownUrl(asset.url)
            if (!url)
              throw new Error("The upload adapter returned an unsafe URL.")
            const isImage = (asset.mimeType ?? file.type).startsWith("image/")
            const label = asset.alt ?? asset.name ?? file.name
            const markdown = isImage
              ? `![${label}](${url})`
              : `[${asset.name ?? file.name}](${url})`
            editorRef.current?.replaceSelection(markdown)
          } catch (reason) {
            if (!abortController.signal.aborted) {
              setUploadError(
                reason instanceof Error ? reason : new Error("Upload failed.")
              )
            }
          } finally {
            uploadsRef.current.delete(abortController)
            setUploading((count) => Math.max(0, count - 1))
          }
        }
      },
      [disabled, readOnly, uploadAdapter]
    )

    React.useEffect(() => {
      const uploads = uploadsRef.current
      return () => {
        uploads.forEach((uploadController) => uploadController.abort())
        uploads.clear()
      }
    }, [])

    React.useEffect(() => {
      if (!fullscreen) return
      const previousOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") setFullscreen(false)
      }
      document.addEventListener("keydown", onKeyDown)
      return () => {
        document.body.style.overflow = previousOverflow
        document.removeEventListener("keydown", onKeyDown)
      }
    }, [fullscreen, setFullscreen])

    React.useEffect(() => {
      if (editorMode !== "split" || !editorHandle || !previewRef.current) return
      const source = editorHandle.getScrollElement()
      const preview = previewRef.current
      if (!source) return
      let syncing = false
      let frame = 0

      const syncScroll = (origin: HTMLElement, target: HTMLElement) => {
        if (syncing) return
        syncing = true
        const available = origin.scrollHeight - origin.clientHeight
        const ratio = available > 0 ? origin.scrollTop / available : 0
        target.scrollTop =
          ratio * Math.max(0, target.scrollHeight - target.clientHeight)
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => {
          syncing = false
        })
      }

      const fromSource = () => syncScroll(source, preview)
      const fromPreview = () => syncScroll(preview, source)
      source.addEventListener("scroll", fromSource, { passive: true })
      preview.addEventListener("scroll", fromPreview, { passive: true })
      return () => {
        cancelAnimationFrame(frame)
        source.removeEventListener("scroll", fromSource)
        preview.removeEventListener("scroll", fromPreview)
      }
    }, [editorHandle, editorMode])

    const context = React.useMemo<MarkdownEditorContextValue>(
      () => ({
        editor: editorHandle,
        mode: editorMode,
        setMode: setEditorMode,
        runCommand,
        fullscreen,
        toggleFullscreen,
        disabled,
        readOnly,
        uploading: uploading > 0,
      }),
      [
        disabled,
        editorHandle,
        editorMode,
        fullscreen,
        readOnly,
        runCommand,
        setEditorMode,
        toggleFullscreen,
        uploading,
      ]
    )

    const handleKeyboardShortcut = (
      event: React.KeyboardEvent<HTMLDivElement>
    ) => {
      onKeyDownCapture?.(event)
      if (
        event.defaultPrevented ||
        readOnly ||
        disabled ||
        !(event.metaKey || event.ctrlKey)
      ) {
        return
      }

      const shortcuts: Partial<Record<string, MarkdownCommand>> = {
        b: "bold",
        i: "italic",
        k: "link",
      }
      const command = shortcuts[event.key.toLowerCase()]
      if (command) {
        event.preventDefault()
        runCommand(command)
      }
    }

    const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
      onPasteCapture?.(event)
      if (event.defaultPrevented || !uploadAdapter) return
      const files = Array.from(event.clipboardData.files)
      if (files.length > 0) {
        event.preventDefault()
        void handleFiles(files)
      }
    }

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
      onDropCapture?.(event)
      if (event.defaultPrevented || !uploadAdapter) return
      const files = Array.from(event.dataTransfer.files)
      if (files.length > 0) {
        event.preventDefault()
        const view = editorRef.current?.getView()
        const position = view?.posAtCoords({
          x: event.clientX,
          y: event.clientY,
        })
        if (view && typeof position === "number") {
          view.dispatch({ selection: { anchor: position } })
        }
        void handleFiles(files)
      }
    }

    return (
      <MarkdownEditorContext.Provider value={context}>
        <div
          ref={forwardedRef}
          data-slot="markdown-editor"
          data-mode={editorMode}
          data-fullscreen={fullscreen ? "" : undefined}
          data-disabled={disabled ? "" : undefined}
          className={cn(
            "flex min-w-0 flex-col overflow-hidden rounded-lg border bg-background text-foreground shadow-xs focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 data-fullscreen:fixed data-fullscreen:inset-0 data-fullscreen:z-50 data-fullscreen:rounded-none data-disabled:opacity-50",
            className
          )}
          style={{ minHeight, maxHeight, ...style }}
          onKeyDownCapture={handleKeyboardShortcut}
          onPasteCapture={handlePaste}
          onDropCapture={handleDrop}
          {...props}
        >
          {toolbar ? <MarkdownEditorToolbar /> : null}
          <div
            data-slot="markdown-editor-body"
            className={cn(
              "grid min-h-0 flex-1",
              editorMode === "split" &&
                "grid-cols-1 divide-y md:grid-cols-2 md:divide-x md:divide-y-0"
            )}
          >
            {editorMode !== "preview" ? (
              <CodeEditor
                ref={editorRef}
                value={markdownValue}
                onChange={handleValueChange}
                onReady={(handle) => setEditorHandle(handle)}
                language="markdown"
                readOnly={readOnly}
                disabled={disabled}
                lineNumbers={false}
                foldGutter={false}
                highlightActiveLine={false}
                lineWrapping
                autofocus={autofocus}
                placeholder={placeholder}
                minHeight="100%"
                maxHeight="100%"
                aria-label="Markdown source"
                className="min-h-0 rounded-none border-0 shadow-none focus-within:ring-0"
              />
            ) : null}
            {editorMode !== "write" ? (
              <MarkdownEditorPreview
                ref={previewRef}
                value={deferredValue}
                allowHtml={allowHtml}
                sanitizeSchema={sanitizeSchema}
                remarkPlugins={remarkPlugins}
                rehypePlugins={rehypePlugins}
              />
            ) : null}
          </div>
          {statusBar ? (
            <MarkdownEditorStatusBar
              characters={characters}
              words={words}
              maxLength={maxLength}
              uploading={uploading > 0}
              error={uploadError}
            />
          ) : null}
        </div>
      </MarkdownEditorContext.Provider>
    )
  }
)

export {
  MarkdownEditor,
  MarkdownEditorPreview,
  MarkdownEditorStatusBar,
  MarkdownEditorToolbar,
  MarkdownRenderer,
  useMarkdownEditor,
}
export type {
  EditorAssetUploadAdapter,
  MarkdownEditorMode,
  MarkdownEditorPreviewProps,
  MarkdownEditorProps,
  MarkdownEditorStatusBarProps,
  MarkdownEditorToolbarProps,
}
