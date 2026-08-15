"use client"

import * as React from "react"

import type { CodeEditorHandle } from "@aq-ui/registry/hooks/use-code-editor"

type MarkdownEditorMode = "write" | "preview" | "split"

type MarkdownCommand =
  | "bold"
  | "italic"
  | "strike"
  | "heading"
  | "bullet-list"
  | "ordered-list"
  | "task-list"
  | "quote"
  | "link"
  | "image"
  | "table"
  | "code"

interface UseMarkdownEditorOptions {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  mode?: MarkdownEditorMode
  defaultMode?: MarkdownEditorMode
  onModeChange?: (mode: MarkdownEditorMode) => void
  maxLength?: number
}

function countWords(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed.split(/\s+/u).length : 0
}

function useMarkdownEditor({
  value,
  defaultValue = "",
  onChange,
  mode,
  defaultMode = "write",
  onModeChange,
  maxLength,
}: UseMarkdownEditorOptions = {}) {
  const controlled = value !== undefined
  const modeControlled = mode !== undefined
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const [internalMode, setInternalMode] =
    React.useState<MarkdownEditorMode>(defaultMode)
  const [fullscreen, setFullscreen] = React.useState(false)
  const currentValue = controlled ? value : internalValue
  const currentMode = modeControlled ? mode : internalMode

  const setValue = React.useCallback(
    (nextValue: string) => {
      const limited =
        typeof maxLength === "number"
          ? nextValue.slice(0, Math.max(0, maxLength))
          : nextValue
      if (!controlled) setInternalValue(limited)
      if (limited !== currentValue) onChange?.(limited)
    },
    [controlled, currentValue, maxLength, onChange]
  )

  const setMode = React.useCallback(
    (nextMode: MarkdownEditorMode) => {
      if (!modeControlled) setInternalMode(nextMode)
      if (nextMode !== currentMode) onModeChange?.(nextMode)
    },
    [currentMode, modeControlled, onModeChange]
  )

  const toggleFullscreen = React.useCallback(() => {
    setFullscreen((current) => !current)
  }, [])

  const runCommand = React.useCallback(
    (command: MarkdownCommand, editor: CodeEditorHandle | null) => {
      if (!editor) return
      const selection = editor.getSelection()
      const selected = selection.text

      const replace = (
        content: string,
        selectedFrom: number,
        selectedTo = selectedFrom
      ) => {
        editor.replaceSelection(content, {
          anchor: selection.from + selectedFrom,
          head: selection.from + selectedTo,
        })
      }

      const wrap = (before: string, after: string, fallback: string) => {
        const content = selected || fallback
        replace(
          `${before}${content}${after}`,
          before.length,
          before.length + content.length
        )
      }

      const prefixLines = (prefix: string, fallback: string) => {
        const content = selected || fallback
        const prefixed = content
          .split("\n")
          .map((line, index) =>
            prefix.includes("{n}")
              ? `${prefix.replace("{n}", String(index + 1))}${line}`
              : `${prefix}${line}`
          )
          .join("\n")
        replace(prefixed, 0, prefixed.length)
      }

      switch (command) {
        case "bold":
          wrap("**", "**", "bold text")
          break
        case "italic":
          wrap("_", "_", "italic text")
          break
        case "strike":
          wrap("~~", "~~", "strikethrough text")
          break
        case "heading":
          prefixLines("## ", "Heading")
          break
        case "bullet-list":
          prefixLines("- ", "List item")
          break
        case "ordered-list":
          prefixLines("{n}. ", "List item")
          break
        case "task-list":
          prefixLines("- [ ] ", "Task")
          break
        case "quote":
          prefixLines("> ", "Quote")
          break
        case "link":
          wrap("[", "](https://example.com)", "link text")
          break
        case "image":
          wrap("![", "](https://example.com/image.png)", "image description")
          break
        case "table": {
          const table =
            "| Column 1 | Column 2 |\n| --- | --- |\n| Value 1 | Value 2 |"
          replace(table, 0, table.length)
          break
        }
        case "code":
          if (selected.includes("\n")) {
            wrap("```\n", "\n```", "code")
          } else {
            wrap("`", "`", "code")
          }
          break
      }
    },
    []
  )

  return {
    value: currentValue,
    setValue,
    mode: currentMode,
    setMode,
    fullscreen,
    setFullscreen,
    toggleFullscreen,
    runCommand,
    characters: currentValue.length,
    words: countWords(currentValue),
    limitReached:
      typeof maxLength === "number" && currentValue.length >= maxLength,
  }
}

export { countWords, useMarkdownEditor }
export type { MarkdownCommand, MarkdownEditorMode, UseMarkdownEditorOptions }
