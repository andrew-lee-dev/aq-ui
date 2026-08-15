"use client"

import * as React from "react"
import {
  mergeAttributes,
  Node,
  type AnyExtension,
  type Editor,
  type JSONContent,
} from "@tiptap/core"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import FileHandler from "@tiptap/extension-file-handler"
import Highlight from "@tiptap/extension-highlight"
import Image from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import Mention from "@tiptap/extension-mention"
import { TableKit } from "@tiptap/extension-table"
import TextAlign from "@tiptap/extension-text-align"
import { CharacterCount, Placeholder } from "@tiptap/extensions"
import { useEditor, useEditorState } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

import { codeLowlight } from "@aq-ui/registry/lib/code-highlighter"
import type {
  EditorAssetUploadAdapter,
  UploadedAsset,
} from "@aq-ui/registry/lib/upload"

type RichTextDocument = JSONContent

const emptyTiptapExtensions: readonly AnyExtension[] = []
const emptyExtensionNames: readonly string[] = []

interface RichTextMentionItem {
  id: string
  label: string
  description?: string
  avatarUrl?: string
  [key: string]: unknown
}

type RichTextMentionProvider = (
  query: string,
  context: { signal: AbortSignal }
) => Promise<readonly RichTextMentionItem[]> | readonly RichTextMentionItem[]

type RichTextUploadStatus = "uploading" | "error" | "done" | "cancelled"

interface RichTextUpload {
  id: string
  file: File
  position?: number
  progress: number
  status: RichTextUploadStatus
  error?: Error
  asset?: UploadedAsset
}

interface CreateRichTextExtensionsOptions {
  placeholder?: string
  maxLength?: number
  extensions?: readonly AnyExtension[]
  overrideExtensionNames?: readonly string[]
  onFiles?: (editor: Editor, files: readonly File[], position?: number) => void
  onDuplicateExtension?: (name: string) => void
}

const attachmentNode = Node.create({
  name: "attachment",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      url: {
        default: null,
        parseHTML: (element) => element.getAttribute("href"),
        renderHTML: () => ({}),
      },
      name: {
        default: "Attachment",
        parseHTML: (element) => element.textContent ?? "Attachment",
        renderHTML: () => ({}),
      },
      mimeType: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-mime-type"),
        renderHTML: () => ({}),
      },
      size: {
        default: null,
        parseHTML: (element) => {
          const value = element.getAttribute("data-size")
          return value ? Number(value) : null
        },
        renderHTML: () => ({}),
      },
    }
  },

  parseHTML() {
    return [{ tag: "a[data-aq-attachment]" }]
  },

  renderHTML({ node, HTMLAttributes }) {
    const href = safeEditorAssetUrl(String(node.attrs.url ?? "")) ?? "#"
    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        href,
        "data-aq-attachment": "",
        "data-mime-type": node.attrs.mimeType || undefined,
        "data-size": node.attrs.size || undefined,
        rel: "noopener noreferrer",
        target: "_blank",
      }),
      String(node.attrs.name ?? "Attachment"),
    ]
  },
})

const starterExtensionNames = new Set([
  "blockquote",
  "bold",
  "bulletList",
  "code",
  "codeBlock",
  "document",
  "dropCursor",
  "gapCursor",
  "hardBreak",
  "heading",
  "horizontalRule",
  "italic",
  "link",
  "listItem",
  "listKeymap",
  "orderedList",
  "paragraph",
  "strike",
  "text",
  "trailingNode",
  "underline",
  "undoRedo",
])

function createRichTextExtensions({
  placeholder = "Write something…",
  maxLength,
  extensions = emptyTiptapExtensions,
  overrideExtensionNames = emptyExtensionNames,
  onFiles,
  onDuplicateExtension,
}: CreateRichTextExtensionsOptions = {}) {
  const overrides = new Set(overrideExtensionNames)
  const customNames = new Set<string>()
  const customExtensions: AnyExtension[] = []

  for (const extension of extensions) {
    if (customNames.has(extension.name)) {
      onDuplicateExtension?.(extension.name)
      console.warn(
        `[aq-ui] Duplicate Tiptap extension "${extension.name}" was ignored.`
      )
      continue
    }

    const conflictsWithPreset =
      starterExtensionNames.has(extension.name) ||
      [
        "attachment",
        "characterCount",
        "fileHandler",
        "highlight",
        "image",
        "mention",
        "placeholder",
        "table",
        "tableCell",
        "tableHeader",
        "tableRow",
        "taskItem",
        "taskList",
        "textAlign",
      ].includes(extension.name)

    if (conflictsWithPreset && !overrides.has(extension.name)) {
      onDuplicateExtension?.(extension.name)
      console.warn(
        `[aq-ui] Tiptap extension "${extension.name}" already exists in the preset. ` +
          "Add its name to overrideExtensionNames to replace it."
      )
      continue
    }

    customNames.add(extension.name)
    customExtensions.push(extension)
  }

  const starterKit = StarterKit.configure({
    blockquote: overrides.has("blockquote") ? false : undefined,
    bold: overrides.has("bold") ? false : undefined,
    bulletList: overrides.has("bulletList") ? false : undefined,
    code: overrides.has("code") ? false : undefined,
    codeBlock: false,
    document: overrides.has("document") ? false : undefined,
    hardBreak: overrides.has("hardBreak") ? false : undefined,
    heading: overrides.has("heading") ? false : { levels: [1, 2, 3, 4, 5, 6] },
    horizontalRule: overrides.has("horizontalRule") ? false : undefined,
    italic: overrides.has("italic") ? false : undefined,
    link: overrides.has("link")
      ? false
      : {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto"],
          HTMLAttributes: { rel: "noopener noreferrer" },
        },
    listItem: overrides.has("listItem") ? false : undefined,
    orderedList: overrides.has("orderedList") ? false : undefined,
    paragraph: overrides.has("paragraph") ? false : undefined,
    strike: overrides.has("strike") ? false : undefined,
    text: overrides.has("text") ? false : undefined,
    underline: overrides.has("underline") ? false : undefined,
    undoRedo: overrides.has("undoRedo") ? false : undefined,
  })

  const preset: AnyExtension[] = [
    starterKit,
    CodeBlockLowlight.configure({ lowlight: codeLowlight }),
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    TaskList,
    TaskItem.configure({ nested: true }),
    TableKit.configure({
      table: {
        resizable: true,
        HTMLAttributes: { class: "aq-rich-text-table" },
      },
      tableCell: { HTMLAttributes: { class: "aq-rich-text-table-cell" } },
      tableHeader: { HTMLAttributes: { class: "aq-rich-text-table-header" } },
    }),
    Image.configure({ allowBase64: false }),
    attachmentNode,
    Mention.configure({
      HTMLAttributes: { class: "aq-rich-text-mention" },
      renderText({ node }) {
        return `@${String(node.attrs.label ?? node.attrs.id ?? "mention")}`
      },
    }),
    Placeholder.configure({ placeholder }),
    CharacterCount.configure({ limit: maxLength }),
    FileHandler.configure({
      onDrop(editor, files, position) {
        onFiles?.(editor, files, position)
      },
      onPaste(editor, files) {
        onFiles?.(editor, files)
      },
    }),
  ]

  const filteredPreset = preset.filter((extension) => {
    if (extension.name === "starterKit") return true
    return !overrides.has(extension.name)
  })

  return [...filteredPreset, ...customExtensions]
}

function safeEditorAssetUrl(value: string) {
  const url = value.trim()
  if (!url) return null
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

function safeEditorLinkUrl(value: string) {
  const url = value.trim()
  if (!url) return null
  if (
    url.startsWith("#") ||
    (url.startsWith("/") && !url.startsWith("//")) ||
    url.startsWith("./") ||
    url.startsWith("../")
  ) {
    return url
  }

  try {
    const parsed = new URL(url)
    return ["https:", "http:", "mailto:"].includes(parsed.protocol) ? url : null
  } catch {
    return null
  }
}

interface UseRichTextEditorOptions {
  value?: RichTextDocument
  defaultValue?: RichTextDocument
  onChange?: (document: RichTextDocument) => void
  readOnly?: boolean
  disabled?: boolean
  placeholder?: string
  maxLength?: number
  autofocus?: boolean
  extensions?: readonly AnyExtension[]
  overrideExtensionNames?: readonly string[]
  uploadAdapter?: EditorAssetUploadAdapter
  mentionProvider?: RichTextMentionProvider
  onReady?: (editor: Editor) => void
  onDuplicateExtension?: (name: string) => void
}

const emptyRichTextDocument: RichTextDocument = {
  type: "doc",
  content: [{ type: "paragraph" }],
}

function useRichTextEditor({
  value,
  defaultValue = emptyRichTextDocument,
  onChange,
  readOnly = false,
  disabled = false,
  placeholder,
  maxLength,
  autofocus = false,
  extensions = emptyTiptapExtensions,
  overrideExtensionNames = emptyExtensionNames,
  uploadAdapter,
  mentionProvider,
  onReady,
  onDuplicateExtension,
}: UseRichTextEditorOptions = {}) {
  const initialContent = React.useRef(value ?? defaultValue)
  const editorRef = React.useRef<Editor | null>(null)
  const onChangeRef = React.useRef(onChange)
  const uploadAdapterRef = React.useRef(uploadAdapter)
  const mentionProviderRef = React.useRef(mentionProvider)
  const uploadsRef = React.useRef(new Map<string, AbortController>())
  const [uploads, setUploads] = React.useState<RichTextUpload[]>([])

  React.useEffect(() => {
    onChangeRef.current = onChange
    uploadAdapterRef.current = uploadAdapter
    mentionProviderRef.current = mentionProvider
  })

  const uploadFiles = React.useCallback(
    async (
      files: readonly File[],
      position?: number,
      targetEditor = editorRef.current
    ) => {
      const adapter = uploadAdapterRef.current
      if (!adapter || !targetEditor || files.length === 0) return

      for (const file of files) {
        const id =
          globalThis.crypto?.randomUUID?.() ??
          `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`
        const abortController = new AbortController()
        uploadsRef.current.set(id, abortController)
        setUploads((current) => [
          ...current,
          { id, file, position, progress: 0, status: "uploading" },
        ])

        try {
          const asset = await adapter.upload(file, {
            signal: abortController.signal,
            onProgress(progress) {
              if (abortController.signal.aborted) return
              setUploads((current) =>
                current.map((upload) =>
                  upload.id === id
                    ? {
                        ...upload,
                        progress: Math.min(100, Math.max(0, progress)),
                      }
                    : upload
                )
              )
            },
          })

          if (abortController.signal.aborted) {
            setUploads((current) =>
              current.map((upload) =>
                upload.id === id
                  ? {
                      ...upload,
                      status: "cancelled",
                      error: undefined,
                    }
                  : upload
              )
            )
            continue
          }
          const url = safeEditorAssetUrl(asset.url)
          if (!url)
            throw new Error("The upload adapter returned an unsafe URL.")

          const content = (asset.mimeType ?? file.type).startsWith("image/")
            ? {
                type: "image",
                attrs: {
                  src: url,
                  alt: asset.alt ?? asset.name ?? file.name,
                  title: asset.name ?? file.name,
                },
              }
            : {
                type: "attachment",
                attrs: {
                  url,
                  name: asset.name ?? file.name,
                  mimeType: asset.mimeType ?? file.type,
                  size: asset.size ?? file.size,
                },
              }

          const chain = targetEditor.chain().focus()
          if (typeof position === "number") {
            chain.insertContentAt(position, content).run()
          } else {
            chain.insertContent(content).run()
          }
          setUploads((current) =>
            current.map((upload) =>
              upload.id === id
                ? { ...upload, progress: 100, status: "done", asset }
                : upload
            )
          )
        } catch (reason) {
          setUploads((current) =>
            current.map((upload) =>
              upload.id === id
                ? {
                    ...upload,
                    status: abortController.signal.aborted
                      ? "cancelled"
                      : "error",
                    error: abortController.signal.aborted
                      ? undefined
                      : reason instanceof Error
                        ? reason
                        : new Error("Upload failed."),
                  }
                : upload
            )
          )
        } finally {
          uploadsRef.current.delete(id)
        }
      }
    },
    []
  )

  const richTextExtensions = React.useMemo(
    () =>
      createRichTextExtensions({
        placeholder,
        maxLength,
        extensions,
        overrideExtensionNames,
        onDuplicateExtension,
        onFiles(editor, files, position) {
          void uploadFiles(files, position, editor)
        },
      }),
    [
      extensions,
      maxLength,
      onDuplicateExtension,
      overrideExtensionNames,
      placeholder,
      uploadFiles,
    ]
  )

  const editor = useEditor({
    extensions: richTextExtensions,
    content: initialContent.current,
    editable: !(readOnly || disabled),
    autofocus,
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": "Rich text editor",
        class: "aq-rich-text-prosemirror",
      },
    },
    onCreate({ editor: nextEditor }) {
      editorRef.current = nextEditor
    },
    onUpdate({ editor: nextEditor }) {
      onChangeRef.current?.(nextEditor.getJSON())
    },
    onDestroy() {
      editorRef.current = null
    },
  })

  React.useEffect(() => {
    editorRef.current = editor
    if (editor) onReady?.(editor)
  }, [editor, onReady])

  React.useEffect(() => {
    editor?.setEditable(!(readOnly || disabled))
    if (editor) {
      editor.view.dom.setAttribute("aria-disabled", disabled ? "true" : "false")
      editor.view.dom.setAttribute(
        "aria-readonly",
        readOnly || disabled ? "true" : "false"
      )
    }
  }, [disabled, editor, readOnly])

  React.useEffect(() => {
    if (!editor || value === undefined) return
    if (JSON.stringify(editor.getJSON()) === JSON.stringify(value)) return
    const { from, to } = editor.state.selection
    editor.commands.setContent(value, { emitUpdate: false })
    const maxPosition = editor.state.doc.content.size
    editor.commands.setTextSelection({
      from: Math.min(from, maxPosition),
      to: Math.min(to, maxPosition),
    })
  }, [editor, value])

  React.useEffect(() => {
    const activeUploads = uploadsRef.current
    return () => {
      activeUploads.forEach((controller) => controller.abort())
      activeUploads.clear()
    }
  }, [])

  const editorState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      characters: currentEditor?.storage.characterCount?.characters?.() ?? 0,
      words: currentEditor?.storage.characterCount?.words?.() ?? 0,
      canUndo: currentEditor?.can().chain().focus().undo().run() ?? false,
      canRedo: currentEditor?.can().chain().focus().redo().run() ?? false,
    }),
  })

  const cancelUpload = React.useCallback((id: string) => {
    uploadsRef.current.get(id)?.abort()
    setUploads((current) =>
      current.map((upload) =>
        upload.id === id
          ? { ...upload, status: "cancelled", error: undefined }
          : upload
      )
    )
  }, [])

  const retryUpload = React.useCallback(
    (id: string) => {
      const upload = uploads.find((item) => item.id === id)
      if (!upload || upload.status !== "error") return
      setUploads((current) => current.filter((item) => item.id !== id))
      void uploadFiles([upload.file], upload.position)
    },
    [uploadFiles, uploads]
  )

  const dismissUpload = React.useCallback((id: string) => {
    uploadsRef.current.get(id)?.abort()
    setUploads((current) => current.filter((upload) => upload.id !== id))
  }, [])

  return {
    editor,
    editorState,
    uploads,
    uploadFiles,
    cancelUpload,
    retryUpload,
    dismissUpload,
    mentionProvider: mentionProviderRef.current,
  }
}

export {
  attachmentNode,
  createRichTextExtensions,
  emptyRichTextDocument,
  safeEditorAssetUrl,
  safeEditorLinkUrl,
  useRichTextEditor,
}
export type {
  CreateRichTextExtensionsOptions,
  RichTextDocument,
  RichTextMentionItem,
  RichTextMentionProvider,
  RichTextUpload,
  RichTextUploadStatus,
  UseRichTextEditorOptions,
}
