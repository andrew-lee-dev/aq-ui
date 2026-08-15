"use client"

import * as React from "react"
import type { Extension } from "@codemirror/state"

import { cn } from "@aq-ui/registry/lib/utils"
import {
  loadCodeLanguage,
  registerCodeLanguage,
  useCodeEditor,
  type CodeDiagnostic,
  type CodeEditorHandle,
  type CodeLanguage,
  type CodeLanguageLoader,
} from "@aq-ui/registry/hooks/use-code-editor"

interface CodeEditorStatusBarProps extends React.ComponentProps<"div"> {
  characters?: number
  lines?: number
  language?: CodeLanguage
  languageStatus?: "idle" | "loading" | "ready" | "error"
  error?: Error | null
}

function CodeEditorStatusBar({
  className,
  characters,
  lines,
  language,
  languageStatus,
  error,
  children,
  ...props
}: CodeEditorStatusBarProps) {
  return (
    <div
      data-slot="code-editor-status-bar"
      className={cn(
        "flex min-h-8 items-center gap-3 border-t bg-muted/30 px-3 text-xs text-muted-foreground",
        className
      )}
      role="status"
      aria-live="polite"
      {...props}
    >
      {children ?? (
        <>
          {language ? <span>{language}</span> : null}
          {typeof lines === "number" ? (
            <span>
              {lines} {lines === 1 ? "line" : "lines"}
            </span>
          ) : null}
          {typeof characters === "number" ? (
            <span>{characters.toLocaleString()} characters</span>
          ) : null}
          {languageStatus === "loading" ? (
            <span className="ms-auto">Loading language…</span>
          ) : null}
          {languageStatus === "error" ? (
            <span className="ms-auto text-destructive" title={error?.message}>
              Plain-text fallback
            </span>
          ) : null}
        </>
      )}
    </div>
  )
}

interface CodeEditorProps extends Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onChange"
> {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  language?: CodeLanguage
  readOnly?: boolean
  disabled?: boolean
  lineNumbers?: boolean
  lineWrapping?: boolean
  foldGutter?: boolean
  highlightActiveLine?: boolean
  tabSize?: number
  indentWithTab?: boolean
  autofocus?: boolean
  placeholder?: string
  minHeight?: string | number
  maxHeight?: string | number
  diagnostics?: readonly CodeDiagnostic[]
  extensions?: readonly Extension[]
  statusBar?: boolean
  onReady?: (handle: CodeEditorHandle) => void
  onLanguageError?: (error: Error) => void
}

interface CodeEditorMetrics {
  characters: number
  lines: number
}

const emptyCodeEditorMetrics: CodeEditorMetrics = { characters: 0, lines: 1 }

function getCodeEditorMetrics(value: string): CodeEditorMetrics {
  let lines = 1
  let index = value.indexOf("\n")

  while (index !== -1) {
    lines += 1
    index = value.indexOf("\n", index + 1)
  }

  return { characters: value.length, lines }
}

const CodeEditor = React.forwardRef<CodeEditorHandle, CodeEditorProps>(
  function CodeEditor(
    {
      value,
      defaultValue = "",
      onChange,
      language = "plaintext",
      readOnly = false,
      disabled = false,
      lineNumbers = true,
      lineWrapping = false,
      foldGutter = true,
      highlightActiveLine = true,
      tabSize = 2,
      indentWithTab = false,
      autofocus = false,
      placeholder = "",
      minHeight = 160,
      maxHeight,
      diagnostics,
      extensions,
      statusBar = false,
      onReady,
      onLanguageError,
      className,
      style,
      "aria-label": ariaLabel = "Code editor",
      ...props
    },
    forwardedRef
  ) {
    const initialValue = value ?? defaultValue
    const [metrics, setMetrics] = React.useState(() =>
      statusBar ? getCodeEditorMetrics(initialValue) : emptyCodeEditorMetrics
    )

    const handleChange = React.useCallback(
      (nextValue: string) => {
        if (statusBar && value === undefined) {
          setMetrics(getCodeEditorMetrics(nextValue))
        }
        onChange?.(nextValue)
      },
      [onChange, statusBar, value]
    )

    const {
      containerRef,
      handle,
      language: normalizedLanguage,
      languageStatus,
      languageError,
    } = useCodeEditor({
      value,
      defaultValue,
      onChange: handleChange,
      language,
      readOnly,
      disabled,
      lineNumbers,
      lineWrapping,
      foldGutter,
      highlightActiveLine,
      tabSize,
      indentWithTab,
      autofocus,
      placeholder,
      diagnostics,
      extensions,
      ariaLabel,
      onReady,
      onLanguageError,
    })

    React.useImperativeHandle(forwardedRef, () => handle, [handle])

    React.useEffect(() => {
      if (!statusBar || value !== undefined) return
      const nextMetrics = getCodeEditorMetrics(handle.getValue())
      let active = true
      queueMicrotask(() => {
        if (!active) return
        setMetrics((current) =>
          current.characters === nextMetrics.characters &&
          current.lines === nextMetrics.lines
            ? current
            : nextMetrics
        )
      })
      return () => {
        active = false
      }
    }, [handle, statusBar, value])

    const controlledMetrics = React.useMemo(
      () =>
        statusBar && value !== undefined ? getCodeEditorMetrics(value) : null,
      [statusBar, value]
    )
    const displayedMetrics = controlledMetrics ?? metrics

    const editorStyle: React.CSSProperties = {
      minHeight,
      maxHeight,
      ...style,
    }

    return (
      <div
        data-slot="code-editor"
        data-language={normalizedLanguage}
        data-language-status={languageStatus}
        data-disabled={disabled ? "" : undefined}
        data-readonly={readOnly ? "" : undefined}
        className={cn(
          "overflow-hidden rounded-lg border bg-background text-foreground shadow-xs transition-[border-color,box-shadow] outline-none focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 data-disabled:pointer-events-none data-disabled:opacity-50",
          className
        )}
        style={editorStyle}
        {...props}
      >
        <div
          ref={containerRef}
          data-slot="code-editor-content"
          className="max-h-[inherit] min-h-[inherit] overflow-hidden [&_.cm-editor]:max-h-[inherit] [&_.cm-editor]:min-h-[inherit] [&_.cm-scroller]:overflow-auto"
        />
        {statusBar ? (
          <CodeEditorStatusBar
            characters={displayedMetrics.characters}
            lines={displayedMetrics.lines}
            language={normalizedLanguage}
            languageStatus={languageStatus}
            error={languageError}
          />
        ) : null}
      </div>
    )
  }
)

export {
  CodeEditor,
  CodeEditorStatusBar,
  loadCodeLanguage,
  registerCodeLanguage,
  useCodeEditor,
}
export type {
  CodeDiagnostic,
  CodeEditorHandle,
  CodeEditorProps,
  CodeEditorStatusBarProps,
  CodeLanguage,
  CodeLanguageLoader,
}
