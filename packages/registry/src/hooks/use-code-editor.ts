"use client"

import "@aq-ui/registry/lib/code-language-preset"

import * as React from "react"
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete"
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab as indentWithTabCommand,
  redo,
  undo,
} from "@codemirror/commands"
import {
  bracketMatching,
  defaultHighlightStyle,
  foldGutter as createFoldGutter,
  foldKeymap,
  indentUnit,
  syntaxHighlighting,
} from "@codemirror/language"
import { type Diagnostic, lintGutter, setDiagnostics } from "@codemirror/lint"
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search"
import {
  Compartment,
  Annotation,
  EditorSelection,
  EditorState,
  Transaction,
  type Extension,
} from "@codemirror/state"
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine as createHighlightActiveLine,
  highlightSpecialChars,
  keymap,
  lineNumbers as createLineNumbers,
  placeholder as createPlaceholder,
  rectangularSelection,
} from "@codemirror/view"
import {
  loadCodeLanguage,
  normalizeCodeLanguage,
  registerCodeLanguage,
} from "@aq-ui/registry/lib/code-language-registry"
import type {
  BuiltInCodeLanguage,
  CodeLanguage,
  CodeLanguageLoader,
} from "@aq-ui/registry/lib/code-language-registry"

type CodeDiagnostic = Diagnostic

interface CodeSelection {
  from: number
  to: number
  anchor: number
  head: number
  text: string
}

interface CodeEditorHandle {
  focus: () => void
  getValue: () => string
  setValue: (value: string) => void
  getSelection: () => CodeSelection
  replaceSelection: (
    value: string,
    selection?: { anchor: number; head?: number }
  ) => void
  undo: () => boolean
  redo: () => boolean
  getView: () => EditorView | null
  getScrollElement: () => HTMLElement | null
}

const externalDocumentUpdate = Annotation.define<boolean>()
const emptyCodeExtensions: readonly Extension[] = []
const emptyCodeDiagnostics: readonly CodeDiagnostic[] = []

const aqEditorTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent",
    color: "var(--foreground)",
    fontSize: "0.875rem",
    height: "100%",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily:
      "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)",
    lineHeight: "1.6",
    minHeight: "inherit",
    maxHeight: "inherit",
  },
  ".cm-content": { caretColor: "var(--foreground)", padding: "0.75rem 0" },
  ".cm-line": { padding: "0 0.875rem" },
  ".cm-gutters": {
    backgroundColor: "color-mix(in oklch, var(--muted) 45%, transparent)",
    borderRight: "1px solid var(--border)",
    color: "var(--muted-foreground)",
  },
  ".cm-activeLine, .cm-activeLineGutter": {
    backgroundColor: "color-mix(in oklch, var(--muted) 55%, transparent)",
  },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection":
    {
      backgroundColor:
        "color-mix(in oklch, var(--primary) 24%, transparent) !important",
    },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--foreground)" },
  ".cm-panels": {
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
  },
  ".cm-tooltip": {
    backgroundColor: "var(--popover)",
    border: "1px solid var(--border)",
    color: "var(--popover-foreground)",
  },
  ".cm-diagnostic-error": { borderLeftColor: "var(--destructive)" },
  ".cm-placeholder": { color: "var(--muted-foreground)" },
})

interface UseCodeEditorOptions {
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
  diagnostics?: readonly CodeDiagnostic[]
  extensions?: readonly Extension[]
  ariaLabel?: string
  onReady?: (handle: CodeEditorHandle) => void
  onLanguageError?: (error: Error) => void
}

type CodeLanguageStatus = "idle" | "loading" | "ready" | "error"

function useCodeEditor({
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
  diagnostics = emptyCodeDiagnostics,
  extensions = emptyCodeExtensions,
  ariaLabel = "Code editor",
  onReady,
  onLanguageError,
}: UseCodeEditorOptions = {}) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const viewRef = React.useRef<EditorView | null>(null)
  const onChangeRef = React.useRef(onChange)
  const onReadyRef = React.useRef(onReady)
  const onLanguageErrorRef = React.useRef(onLanguageError)
  const initialDocumentRef = React.useRef(value ?? defaultValue)
  const [view, setView] = React.useState<EditorView | null>(null)
  const [languageStatus, setLanguageStatus] =
    React.useState<CodeLanguageStatus>("idle")
  const [languageError, setLanguageError] = React.useState<Error | null>(null)

  const compartmentsRef = React.useRef({
    language: new Compartment(),
    editable: new Compartment(),
    attributes: new Compartment(),
    lines: new Compartment(),
    wrapping: new Compartment(),
    folding: new Compartment(),
    activeLine: new Compartment(),
    indentation: new Compartment(),
    keymap: new Compartment(),
    placeholder: new Compartment(),
    custom: new Compartment(),
  })

  React.useEffect(() => {
    onChangeRef.current = onChange
    onReadyRef.current = onReady
    onLanguageErrorRef.current = onLanguageError
  })

  const getHandle = React.useCallback((): CodeEditorHandle => {
    return {
      focus() {
        viewRef.current?.focus()
      },
      getValue() {
        return viewRef.current?.state.doc.toString() ?? ""
      },
      setValue(nextValue) {
        const currentView = viewRef.current
        if (!currentView) return
        const current = currentView.state.doc.toString()
        if (current === nextValue) return
        currentView.dispatch({
          changes: { from: 0, to: current.length, insert: nextValue },
        })
      },
      getSelection() {
        const currentView = viewRef.current
        if (!currentView) {
          return { from: 0, to: 0, anchor: 0, head: 0, text: "" }
        }
        const { anchor, head, from, to } = currentView.state.selection.main
        return {
          anchor,
          head,
          from,
          to,
          text: currentView.state.sliceDoc(from, to),
        }
      },
      replaceSelection(nextValue, nextSelection) {
        const currentView = viewRef.current
        if (!currentView) return
        const { from, to } = currentView.state.selection.main
        const anchor = nextSelection?.anchor ?? from + nextValue.length
        const head = nextSelection?.head ?? anchor
        currentView.dispatch({
          changes: { from, to, insert: nextValue },
          selection: EditorSelection.single(anchor, head),
          scrollIntoView: true,
        })
        currentView.focus()
      },
      undo() {
        return viewRef.current ? undo(viewRef.current) : false
      },
      redo() {
        return viewRef.current ? redo(viewRef.current) : false
      },
      getView() {
        return viewRef.current
      },
      getScrollElement() {
        return viewRef.current?.scrollDOM ?? null
      },
    }
  }, [])

  React.useEffect(() => {
    const parent = containerRef.current
    if (!parent) return

    const compartments = compartmentsRef.current
    const editable = !(readOnly || disabled)
    const state = EditorState.create({
      doc: initialDocumentRef.current,
      extensions: [
        highlightSpecialChars(),
        history(),
        drawSelection(),
        dropCursor(),
        rectangularSelection(),
        crosshairCursor(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        highlightSelectionMatches(),
        lintGutter(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        aqEditorTheme,
        compartments.keymap.of(
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            ...foldKeymap,
            ...completionKeymap,
            ...(indentWithTab ? [indentWithTabCommand] : []),
          ])
        ),
        compartments.language.of([]),
        compartments.editable.of([
          EditorState.readOnly.of(!editable),
          EditorView.editable.of(editable),
        ]),
        compartments.attributes.of(
          EditorView.contentAttributes.of({
            "aria-label": ariaLabel,
            "aria-disabled": disabled ? "true" : "false",
            "aria-readonly": !editable ? "true" : "false",
            spellcheck: "false",
            tabindex: disabled ? "-1" : "0",
          })
        ),
        compartments.lines.of(lineNumbers ? createLineNumbers() : []),
        compartments.wrapping.of(lineWrapping ? EditorView.lineWrapping : []),
        compartments.folding.of(foldGutter ? createFoldGutter() : []),
        compartments.activeLine.of(
          highlightActiveLine ? createHighlightActiveLine() : []
        ),
        compartments.indentation.of([
          indentUnit.of(" ".repeat(tabSize)),
          EditorState.tabSize.of(tabSize),
        ]),
        compartments.placeholder.of(
          placeholder ? createPlaceholder(placeholder) : []
        ),
        compartments.custom.of([...extensions]),
        EditorView.updateListener.of((update) => {
          const external = update.transactions.some((transaction) =>
            transaction.annotation(externalDocumentUpdate)
          )
          if (update.docChanged && !external) {
            onChangeRef.current?.(update.state.doc.toString())
          }
        }),
      ],
    })

    const nextView = new EditorView({ state, parent })
    viewRef.current = nextView
    setView(nextView)

    const handle = getHandle()
    onReadyRef.current?.(handle)
    if (autofocus && !disabled) {
      queueMicrotask(() => nextView.focus())
    }

    return () => {
      nextView.destroy()
      viewRef.current = null
      setView(null)
    }
    // EditorView must be created once. Dynamic options are reconfigured below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (!view || value === undefined) return
    const currentValue = view.state.doc.toString()
    if (currentValue === value) return
    const selection = EditorSelection.create(
      view.state.selection.ranges.map((range) =>
        EditorSelection.range(
          Math.min(range.anchor, value.length),
          Math.min(range.head, value.length)
        )
      ),
      view.state.selection.mainIndex
    )

    view.dispatch({
      changes: { from: 0, to: currentValue.length, insert: value },
      selection,
      annotations: [
        externalDocumentUpdate.of(true),
        Transaction.addToHistory.of(false),
      ],
    })
  }, [value, view])

  React.useEffect(() => {
    if (!view) return
    const compartments = compartmentsRef.current
    const editable = !(readOnly || disabled)

    view.dispatch({
      effects: [
        compartments.editable.reconfigure([
          EditorState.readOnly.of(!editable),
          EditorView.editable.of(editable),
        ]),
        compartments.attributes.reconfigure(
          EditorView.contentAttributes.of({
            "aria-label": ariaLabel,
            "aria-disabled": disabled ? "true" : "false",
            "aria-readonly": !editable ? "true" : "false",
            spellcheck: "false",
            tabindex: disabled ? "-1" : "0",
          })
        ),
      ],
    })
  }, [ariaLabel, disabled, readOnly, view])

  React.useEffect(() => {
    if (!view) return
    const compartments = compartmentsRef.current
    view.dispatch({
      effects: [
        compartments.lines.reconfigure(lineNumbers ? createLineNumbers() : []),
        compartments.wrapping.reconfigure(
          lineWrapping ? EditorView.lineWrapping : []
        ),
        compartments.folding.reconfigure(foldGutter ? createFoldGutter() : []),
        compartments.activeLine.reconfigure(
          highlightActiveLine ? createHighlightActiveLine() : []
        ),
      ],
    })
  }, [foldGutter, highlightActiveLine, lineNumbers, lineWrapping, view])

  React.useEffect(() => {
    if (!view) return
    const compartments = compartmentsRef.current
    view.dispatch({
      effects: [
        compartments.indentation.reconfigure([
          indentUnit.of(" ".repeat(Math.max(1, tabSize))),
          EditorState.tabSize.of(Math.max(1, tabSize)),
        ]),
        compartments.keymap.reconfigure(
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            ...foldKeymap,
            ...completionKeymap,
            ...(indentWithTab ? [indentWithTabCommand] : []),
          ])
        ),
        compartments.placeholder.reconfigure(
          placeholder ? createPlaceholder(placeholder) : []
        ),
        compartments.custom.reconfigure([...extensions]),
      ],
    })
  }, [extensions, indentWithTab, placeholder, tabSize, view])

  React.useEffect(() => {
    if (!view) return
    let active = true
    queueMicrotask(() => {
      if (!active) return
      setLanguageStatus("loading")
      setLanguageError(null)
    })

    loadCodeLanguage(language)
      .then((extension) => {
        if (!active || viewRef.current !== view) return
        view.dispatch({
          effects: compartmentsRef.current.language.reconfigure(extension),
        })
        setLanguageStatus("ready")
      })
      .catch((reason: unknown) => {
        if (!active) return
        const error =
          reason instanceof Error
            ? reason
            : new Error("Failed to load language")
        view.dispatch({
          effects: compartmentsRef.current.language.reconfigure([]),
        })
        setLanguageError(error)
        setLanguageStatus("error")
        onLanguageErrorRef.current?.(error)
      })

    return () => {
      active = false
    }
  }, [language, view])

  React.useEffect(() => {
    if (!view) return
    view.dispatch(setDiagnostics(view.state, [...diagnostics]))
  }, [diagnostics, view])

  const handle = React.useMemo(() => getHandle(), [getHandle])

  return {
    containerRef,
    view,
    handle,
    language: normalizeCodeLanguage(language),
    languageStatus,
    languageError,
  }
}

export {
  loadCodeLanguage,
  normalizeCodeLanguage,
  registerCodeLanguage,
  useCodeEditor,
}
export type {
  BuiltInCodeLanguage,
  CodeDiagnostic,
  CodeEditorHandle,
  CodeLanguage,
  CodeLanguageLoader,
  CodeLanguageStatus,
  CodeSelection,
  UseCodeEditorOptions,
}
