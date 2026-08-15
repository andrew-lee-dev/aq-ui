"use client"

import * as React from "react"
import type { AnyExtension, Editor } from "@tiptap/core"
import {
  EditorContent as TiptapEditorContent,
  useEditorState,
} from "@tiptap/react"
import {
  BubbleMenu as TiptapBubbleMenu,
  FloatingMenu as TiptapFloatingMenu,
} from "@tiptap/react/menus"
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  BracesIcon,
  Code2Icon,
  Heading2Icon,
  HighlighterIcon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListChecksIcon,
  ListIcon,
  ListOrderedIcon,
  Loader2Icon,
  QuoteIcon,
  Redo2Icon,
  StrikethroughIcon,
  Table2Icon,
  UnderlineIcon,
  Undo2Icon,
  XIcon,
} from "lucide-react"

import { Button } from "@aq-ui/registry/components/button"
import { Separator } from "@aq-ui/registry/components/separator"
import {
  createRichTextExtensions,
  safeEditorLinkUrl,
  useRichTextEditor,
  type RichTextDocument,
  type RichTextMentionItem,
  type RichTextMentionProvider,
  type RichTextUpload,
} from "@aq-ui/registry/hooks/use-rich-text-editor"
import type { EditorAssetUploadAdapter } from "@aq-ui/registry/lib/upload"
import { cn } from "@aq-ui/registry/lib/utils"

interface RichTextEditorContextValue {
  editor: Editor | null
  disabled: boolean
  readOnly: boolean
  uploads: readonly RichTextUpload[]
  uploadFiles: (files: readonly File[]) => Promise<void>
  cancelUpload: (id: string) => void
  retryUpload: (id: string) => void
  dismissUpload: (id: string) => void
  mentionProvider?: RichTextMentionProvider
  canUpload: boolean
}

const RichTextEditorContext =
  React.createContext<RichTextEditorContextValue | null>(null)

function useRichTextEditorContext() {
  return React.useContext(RichTextEditorContext)
}

interface ToolbarButtonProps extends React.ComponentProps<typeof Button> {
  label: string
  active?: boolean
}

function ToolbarButton({
  label,
  active,
  className,
  ...props
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon-sm"
      className={cn("shrink-0", className)}
      aria-label={label}
      aria-pressed={active}
      title={label}
      {...props}
    />
  )
}

interface RichTextEditorToolbarProps extends React.ComponentProps<"div"> {
  compact?: boolean
}

function RichTextEditorToolbar({
  className,
  compact = false,
  children,
  ...props
}: RichTextEditorToolbarProps) {
  const context = useRichTextEditorContext()
  const editor = context?.editor ?? null
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current?.isActive("bold") ?? false,
      italic: current?.isActive("italic") ?? false,
      underline: current?.isActive("underline") ?? false,
      strike: current?.isActive("strike") ?? false,
      code: current?.isActive("code") ?? false,
      highlight: current?.isActive("highlight") ?? false,
      heading: current?.isActive("heading", { level: 2 }) ?? false,
      bulletList: current?.isActive("bulletList") ?? false,
      orderedList: current?.isActive("orderedList") ?? false,
      taskList: current?.isActive("taskList") ?? false,
      blockquote: current?.isActive("blockquote") ?? false,
      codeBlock: current?.isActive("codeBlock") ?? false,
      link: current?.isActive("link") ?? false,
      alignLeft: current?.isActive({ textAlign: "left" }) ?? false,
      alignCenter: current?.isActive({ textAlign: "center" }) ?? false,
      alignRight: current?.isActive({ textAlign: "right" }) ?? false,
      table: current?.isActive("table") ?? false,
      canUndo: current?.can().chain().focus().undo().run() ?? false,
      canRedo: current?.can().chain().focus().redo().run() ?? false,
    }),
  })
  const unavailable = !editor || context?.disabled || context?.readOnly
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const setLink = () => {
    if (!editor) return
    const previous = String(editor.getAttributes("link").href ?? "")
    const requested = window.prompt("Link URL", previous || "https://")
    if (requested === null) return
    if (requested.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }

    const href = requested.trim()
    const safe = safeEditorLinkUrl(href)
    if (!safe) return
    editor.chain().focus().extendMarkRange("link").setLink({ href: safe }).run()
  }

  return (
    <div
      data-slot="rich-text-editor-toolbar"
      role="toolbar"
      aria-label="Rich text formatting"
      className={cn(
        "flex min-h-10 max-w-full items-center gap-0.5 overflow-x-auto border-b bg-muted/30 p-1",
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          <ToolbarButton
            label="Bold"
            active={state?.bold}
            disabled={unavailable}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <BoldIcon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            active={state?.italic}
            disabled={unavailable}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <ItalicIcon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Underline"
            active={state?.underline}
            disabled={unavailable}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Strikethrough"
            active={state?.strike}
            disabled={unavailable}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
          >
            <StrikethroughIcon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Inline code"
            active={state?.code}
            disabled={unavailable}
            onClick={() => editor?.chain().focus().toggleCode().run()}
          >
            <Code2Icon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Highlight"
            active={state?.highlight}
            disabled={unavailable}
            onClick={() => editor?.chain().focus().toggleHighlight().run()}
          >
            <HighlighterIcon aria-hidden="true" />
          </ToolbarButton>

          <Separator orientation="vertical" className="mx-1 h-5" />

          <ToolbarButton
            label="Heading 2"
            active={state?.heading}
            disabled={unavailable}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2Icon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Bullet list"
            active={state?.bulletList}
            disabled={unavailable}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <ListIcon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Ordered list"
            active={state?.orderedList}
            disabled={unavailable}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <ListOrderedIcon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Task list"
            active={state?.taskList}
            disabled={unavailable}
            onClick={() => editor?.chain().focus().toggleTaskList().run()}
          >
            <ListChecksIcon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Blockquote"
            active={state?.blockquote}
            disabled={unavailable}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          >
            <QuoteIcon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Code block"
            active={state?.codeBlock}
            disabled={unavailable}
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          >
            <BracesIcon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Link"
            active={state?.link}
            disabled={unavailable}
            onClick={setLink}
          >
            <LinkIcon aria-hidden="true" />
          </ToolbarButton>

          {!compact ? (
            <>
              <Separator orientation="vertical" className="mx-1 h-5" />
              <ToolbarButton
                label="Align left"
                active={state?.alignLeft}
                disabled={unavailable}
                onClick={() =>
                  editor?.chain().focus().setTextAlign("left").run()
                }
              >
                <AlignLeftIcon aria-hidden="true" />
              </ToolbarButton>
              <ToolbarButton
                label="Align center"
                active={state?.alignCenter}
                disabled={unavailable}
                onClick={() =>
                  editor?.chain().focus().setTextAlign("center").run()
                }
              >
                <AlignCenterIcon aria-hidden="true" />
              </ToolbarButton>
              <ToolbarButton
                label="Align right"
                active={state?.alignRight}
                disabled={unavailable}
                onClick={() =>
                  editor?.chain().focus().setTextAlign("right").run()
                }
              >
                <AlignRightIcon aria-hidden="true" />
              </ToolbarButton>
              <ToolbarButton
                label={state?.table ? "Delete table" : "Insert table"}
                active={state?.table}
                disabled={unavailable}
                onClick={() => {
                  if (state?.table) editor?.chain().focus().deleteTable().run()
                  else
                    editor
                      ?.chain()
                      .focus()
                      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                      .run()
                }}
              >
                <Table2Icon aria-hidden="true" />
              </ToolbarButton>
              <ToolbarButton
                label="Upload image or file"
                disabled={unavailable || !context?.canUpload}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon aria-hidden="true" />
              </ToolbarButton>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="sr-only"
                tabIndex={-1}
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? [])
                  if (files.length > 0) void context?.uploadFiles(files)
                  event.target.value = ""
                }}
              />
            </>
          ) : null}

          <Separator orientation="vertical" className="mx-1 h-5" />
          <ToolbarButton
            label="Undo"
            disabled={unavailable || !state?.canUndo}
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <Undo2Icon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Redo"
            disabled={unavailable || !state?.canRedo}
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <Redo2Icon aria-hidden="true" />
          </ToolbarButton>
        </>
      )}
    </div>
  )
}

interface RichTextEditorContentProps extends Omit<
  React.ComponentProps<typeof TiptapEditorContent>,
  "editor"
> {
  editor?: Editor | null
}

function RichTextEditorContent({
  editor: editorProp,
  className,
  ...props
}: RichTextEditorContentProps) {
  const context = useRichTextEditorContext()
  const editor = editorProp ?? context?.editor ?? null
  return (
    <TiptapEditorContent
      editor={editor}
      data-slot="rich-text-editor-content"
      className={cn(
        "min-h-48 overflow-auto text-sm",
        "[&_.ProseMirror]:min-h-48 [&_.ProseMirror]:px-4 [&_.ProseMirror]:py-3 [&_.ProseMirror]:outline-none",
        "[&_.ProseMirror_h1]:my-5 [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h2]:my-5 [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h3]:my-4 [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_p]:my-3",
        "[&_.ProseMirror_blockquote]:my-4 [&_.ProseMirror_blockquote]:border-s-4 [&_.ProseMirror_blockquote]:ps-4 [&_.ProseMirror_blockquote]:text-muted-foreground [&_.ProseMirror_blockquote]:italic",
        "[&_.ProseMirror_ol]:my-3 [&_.ProseMirror_ol]:ms-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ul]:my-3 [&_.ProseMirror_ul]:ms-6 [&_.ProseMirror_ul]:list-disc",
        "[&_.ProseMirror_pre]:my-4 [&_.ProseMirror_pre]:overflow-auto [&_.ProseMirror_pre]:rounded-lg [&_.ProseMirror_pre]:bg-muted [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:font-mono",
        "[&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:font-mono",
        "[&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:underline-offset-4 [&_.ProseMirror_img]:my-4 [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded-lg [&_.ProseMirror_img]:border",
        "[&_.ProseMirror_table]:my-4 [&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_td]:border [&_.ProseMirror_td]:p-2 [&_.ProseMirror_th]:border [&_.ProseMirror_th]:bg-muted/50 [&_.ProseMirror_th]:p-2",
        "[&_.is-editor-empty:first-child]:before:pointer-events-none [&_.is-editor-empty:first-child]:before:float-start [&_.is-editor-empty:first-child]:before:h-0 [&_.is-editor-empty:first-child]:before:text-muted-foreground [&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
        className
      )}
      {...props}
    />
  )
}

interface RichTextEditorBubbleMenuProps extends Omit<
  React.ComponentProps<typeof TiptapBubbleMenu>,
  "editor"
> {
  editor?: Editor | null
}

function RichTextEditorBubbleMenu({
  editor: editorProp,
  className,
  children,
  ...props
}: RichTextEditorBubbleMenuProps) {
  const context = useRichTextEditorContext()
  const editor = editorProp ?? context?.editor ?? null
  if (!editor) return null

  return (
    <TiptapBubbleMenu
      editor={editor}
      className={cn(
        "flex items-center gap-0.5 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md",
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          <ToolbarButton
            label="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <BoldIcon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <ItalicIcon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Link"
            active={editor.isActive("link")}
            onClick={() => {
              const href = window.prompt("Link URL", "https://")
              const safe = href ? safeEditorLinkUrl(href) : null
              if (safe) editor.chain().focus().setLink({ href: safe }).run()
            }}
          >
            <LinkIcon aria-hidden="true" />
          </ToolbarButton>
        </>
      )}
    </TiptapBubbleMenu>
  )
}

interface RichTextEditorFloatingMenuProps extends Omit<
  React.ComponentProps<typeof TiptapFloatingMenu>,
  "editor"
> {
  editor?: Editor | null
}

function RichTextEditorFloatingMenu({
  editor: editorProp,
  className,
  children,
  ...props
}: RichTextEditorFloatingMenuProps) {
  const context = useRichTextEditorContext()
  const editor = editorProp ?? context?.editor ?? null
  if (!editor) return null

  return (
    <TiptapFloatingMenu
      editor={editor}
      className={cn(
        "flex items-center gap-0.5 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md",
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          <ToolbarButton
            label="Heading 2"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2Icon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Bullet list"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <ListIcon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Blockquote"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <QuoteIcon aria-hidden="true" />
          </ToolbarButton>
        </>
      )}
    </TiptapFloatingMenu>
  )
}

interface RichTextEditorStatusBarProps extends React.ComponentProps<"div"> {
  characters?: number
  words?: number
  maxLength?: number
  uploads?: readonly RichTextUpload[]
}

function RichTextEditorStatusBar({
  className,
  characters = 0,
  words = 0,
  maxLength,
  uploads: uploadsProp,
  children,
  ...props
}: RichTextEditorStatusBarProps) {
  const context = useRichTextEditorContext()
  const uploads = uploadsProp ?? context?.uploads ?? []
  const active = uploads.filter((upload) => upload.status === "uploading")
  const failed = uploads.filter((upload) => upload.status === "error")

  return (
    <div
      data-slot="rich-text-editor-status-bar"
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-8 flex-wrap items-center gap-3 border-t bg-muted/30 px-3 py-1 text-xs text-muted-foreground",
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
          {active.map((upload) => (
            <span
              key={upload.id}
              className="ms-auto inline-flex items-center gap-1.5"
            >
              <Loader2Icon className="size-3 animate-spin" aria-hidden="true" />
              {upload.file.name} · {Math.round(upload.progress)}%
              <button
                type="button"
                className="rounded-sm p-0.5 hover:bg-muted"
                aria-label={`Cancel ${upload.file.name}`}
                onClick={() => context?.cancelUpload(upload.id)}
              >
                <XIcon className="size-3" aria-hidden="true" />
              </button>
            </span>
          ))}
          {failed.map((upload) => (
            <span
              key={upload.id}
              className="ms-auto inline-flex items-center gap-1 text-destructive"
            >
              {upload.file.name} failed
              <button
                type="button"
                className="font-medium underline underline-offset-2"
                onClick={() => context?.retryUpload(upload.id)}
              >
                Retry
              </button>
              <button
                type="button"
                className="rounded-sm p-0.5 hover:bg-muted"
                aria-label={`Dismiss ${upload.file.name}`}
                onClick={() => context?.dismissUpload(upload.id)}
              >
                <XIcon className="size-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </>
      )}
    </div>
  )
}

interface TriggerMatch {
  from: number
  to: number
  query: string
}

function findTrigger(editor: Editor, trigger: "@" | "/"): TriggerMatch | null {
  const { $from } = editor.state.selection
  if (!$from.parent.isTextblock) return null
  const before = $from.parent.textBetween(0, $from.parentOffset, "\n", "\ufffc")
  const escaped = trigger === "@" ? "@" : "\\/"
  const match = new RegExp(`(?:^|\\s)${escaped}([^\\s${escaped}]*)$`, "u").exec(
    before
  )
  if (!match) return null
  const query = match[1] ?? ""
  const to = editor.state.selection.from
  return { from: to - query.length - 1, to, query }
}

interface SuggestionPosition {
  left: number
  top: number
}

function suggestionPosition(
  editor: Editor,
  position: number
): SuggestionPosition {
  const coordinates = editor.view.coordsAtPos(position)
  return { left: coordinates.left, top: coordinates.bottom + 6 }
}

function RichTextSuggestionMenus() {
  const context = useRichTextEditorContext()
  const editor = context?.editor ?? null
  const [mention, setMention] = React.useState<TriggerMatch | null>(null)
  const [slash, setSlash] = React.useState<TriggerMatch | null>(null)
  const [mentionItems, setMentionItems] = React.useState<
    readonly RichTextMentionItem[]
  >([])
  const [mentionLoading, setMentionLoading] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const mentionProvider = context?.mentionProvider

  React.useEffect(() => {
    if (!editor) return
    const update = () => {
      setMention(mentionProvider ? findTrigger(editor, "@") : null)
      setSlash(findTrigger(editor, "/"))
    }
    editor.on("transaction", update)
    editor.on("selectionUpdate", update)
    update()
    return () => {
      editor.off("transaction", update)
      editor.off("selectionUpdate", update)
    }
  }, [editor, mentionProvider])

  React.useEffect(() => {
    if (!mention || !mentionProvider) {
      return
    }
    const abortController = new AbortController()
    queueMicrotask(() => {
      if (!abortController.signal.aborted) setMentionLoading(true)
    })
    Promise.resolve()
      .then(() =>
        mentionProvider(mention.query, { signal: abortController.signal })
      )
      .then((items) => {
        if (!abortController.signal.aborted) {
          setMentionItems(items)
          setActiveIndex(0)
        }
      })
      .catch(() => {
        if (!abortController.signal.aborted) setMentionItems([])
      })
      .finally(() => {
        if (!abortController.signal.aborted) setMentionLoading(false)
      })
    return () => abortController.abort()
  }, [mention, mentionProvider])

  const slashCommands = React.useMemo(
    () =>
      [
        {
          label: "Heading 2",
          keywords: "heading title",
          run: (current: Editor) =>
            current.chain().focus().toggleHeading({ level: 2 }).run(),
        },
        {
          label: "Bullet list",
          keywords: "bullet unordered list",
          run: (current: Editor) =>
            current.chain().focus().toggleBulletList().run(),
        },
        {
          label: "Ordered list",
          keywords: "number ordered list",
          run: (current: Editor) =>
            current.chain().focus().toggleOrderedList().run(),
        },
        {
          label: "Task list",
          keywords: "task todo checklist",
          run: (current: Editor) =>
            current.chain().focus().toggleTaskList().run(),
        },
        {
          label: "Quote",
          keywords: "blockquote quote",
          run: (current: Editor) =>
            current.chain().focus().toggleBlockquote().run(),
        },
        {
          label: "Code block",
          keywords: "code pre",
          run: (current: Editor) =>
            current.chain().focus().toggleCodeBlock().run(),
        },
        {
          label: "Table",
          keywords: "table grid",
          run: (current: Editor) =>
            current
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run(),
        },
      ].filter((command) =>
        `${command.label} ${command.keywords}`
          .toLowerCase()
          .includes(slash?.query.toLowerCase() ?? "")
      ),
    [slash?.query]
  )

  const visibleItems = mention ? mentionItems : slash ? slashCommands : []

  React.useEffect(() => {
    if (!editor || visibleItems.length === 0) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault()
        setActiveIndex((index) => (index + 1) % visibleItems.length)
      } else if (event.key === "ArrowUp") {
        event.preventDefault()
        setActiveIndex(
          (index) => (index - 1 + visibleItems.length) % visibleItems.length
        )
      } else if (event.key === "Escape") {
        event.preventDefault()
        setMention(null)
        setSlash(null)
      } else if (event.key === "Enter") {
        event.preventDefault()
        if (mention) {
          const item = mentionItems[activeIndex]
          if (item) {
            editor
              .chain()
              .focus()
              .deleteRange({ from: mention.from, to: mention.to })
              .insertContent([
                { type: "mention", attrs: { id: item.id, label: item.label } },
                { type: "text", text: " " },
              ])
              .run()
          }
        } else if (slash) {
          const command = slashCommands[activeIndex]
          if (command) {
            editor
              .chain()
              .focus()
              .deleteRange({ from: slash.from, to: slash.to })
              .run()
            command.run(editor)
          }
        }
      }
    }
    window.addEventListener("keydown", onKeyDown, true)
    return () => window.removeEventListener("keydown", onKeyDown, true)
  }, [
    activeIndex,
    editor,
    mention,
    mentionItems,
    slash,
    slashCommands,
    visibleItems.length,
  ])

  if (!editor || (!mention && !slash)) return null
  const position = suggestionPosition(editor, (mention ?? slash)?.from ?? 0)

  return (
    <div
      data-slot={mention ? "rich-text-mention-menu" : "rich-text-slash-menu"}
      role="listbox"
      aria-label={mention ? "Mention suggestions" : "Insert block"}
      className="fixed z-50 min-w-52 overflow-hidden rounded-lg border bg-popover p-1 text-sm text-popover-foreground shadow-md"
      style={{ left: position.left, top: position.top }}
    >
      {mentionLoading ? (
        <div className="flex items-center gap-2 px-2 py-1.5 text-muted-foreground">
          <Loader2Icon className="size-3.5 animate-spin" aria-hidden="true" />
          Loading…
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="px-2 py-1.5 text-muted-foreground">No results</div>
      ) : mention ? (
        mentionItems.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={index === activeIndex}
            className="flex w-full flex-col rounded-md px-2 py-1.5 text-start hover:bg-muted aria-selected:bg-muted"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              editor
                .chain()
                .focus()
                .deleteRange({ from: mention.from, to: mention.to })
                .insertContent([
                  {
                    type: "mention",
                    attrs: { id: item.id, label: item.label },
                  },
                  { type: "text", text: " " },
                ])
                .run()
            }}
          >
            <span className="font-medium">{item.label}</span>
            {item.description ? (
              <span className="text-xs text-muted-foreground">
                {item.description}
              </span>
            ) : null}
          </button>
        ))
      ) : (
        slashCommands.map((command, index) => (
          <button
            key={command.label}
            type="button"
            role="option"
            aria-selected={index === activeIndex}
            className="block w-full rounded-md px-2 py-1.5 text-start hover:bg-muted aria-selected:bg-muted"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (!slash) return
              editor
                .chain()
                .focus()
                .deleteRange({ from: slash.from, to: slash.to })
                .run()
              command.run(editor)
            }}
          >
            {command.label}
          </button>
        ))
      )}
    </div>
  )
}

interface RichTextEditorProps extends Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onChange"
> {
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
  toolbar?: boolean
  bubbleMenu?: boolean
  floatingMenu?: boolean
  statusBar?: boolean
  contentClassName?: string
  onReady?: (editor: Editor) => void
  onDuplicateExtension?: (name: string) => void
}

const RichTextEditor = React.forwardRef<HTMLDivElement, RichTextEditorProps>(
  function RichTextEditor(
    {
      value,
      defaultValue,
      onChange,
      readOnly = false,
      disabled = false,
      placeholder = "Write something…",
      maxLength,
      autofocus = false,
      extensions,
      overrideExtensionNames,
      uploadAdapter,
      mentionProvider,
      toolbar = true,
      bubbleMenu = true,
      floatingMenu = true,
      statusBar = true,
      contentClassName,
      onReady,
      onDuplicateExtension,
      className,
      ...props
    },
    forwardedRef
  ) {
    const controller = useRichTextEditor({
      value,
      defaultValue,
      onChange,
      readOnly,
      disabled,
      placeholder,
      maxLength,
      autofocus,
      extensions,
      overrideExtensionNames,
      uploadAdapter,
      mentionProvider,
      onReady,
      onDuplicateExtension,
    })

    const context = React.useMemo<RichTextEditorContextValue>(
      () => ({
        editor: controller.editor,
        disabled,
        readOnly,
        uploads: controller.uploads,
        uploadFiles: controller.uploadFiles,
        cancelUpload: controller.cancelUpload,
        retryUpload: controller.retryUpload,
        dismissUpload: controller.dismissUpload,
        mentionProvider,
        canUpload: Boolean(uploadAdapter),
      }),
      [
        controller.cancelUpload,
        controller.dismissUpload,
        controller.editor,
        controller.retryUpload,
        controller.uploadFiles,
        controller.uploads,
        disabled,
        mentionProvider,
        readOnly,
        uploadAdapter,
      ]
    )

    return (
      <RichTextEditorContext.Provider value={context}>
        <div
          ref={forwardedRef}
          data-slot="rich-text-editor"
          data-disabled={disabled ? "" : undefined}
          data-readonly={readOnly ? "" : undefined}
          className={cn(
            "relative flex min-w-0 flex-col overflow-hidden rounded-lg border bg-background text-foreground shadow-xs focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 data-disabled:pointer-events-none data-disabled:opacity-50",
            className
          )}
          {...props}
        >
          {toolbar ? <RichTextEditorToolbar /> : null}
          <RichTextEditorContent className={contentClassName} />
          {bubbleMenu && !readOnly && !disabled ? (
            <RichTextEditorBubbleMenu />
          ) : null}
          {floatingMenu && !readOnly && !disabled ? (
            <RichTextEditorFloatingMenu />
          ) : null}
          {!readOnly && !disabled ? <RichTextSuggestionMenus /> : null}
          {statusBar ? (
            <RichTextEditorStatusBar
              characters={controller.editorState?.characters ?? 0}
              words={controller.editorState?.words ?? 0}
              maxLength={maxLength}
            />
          ) : null}
        </div>
      </RichTextEditorContext.Provider>
    )
  }
)

export {
  RichTextEditor,
  RichTextEditorBubbleMenu,
  RichTextEditorContent,
  RichTextEditorFloatingMenu,
  RichTextEditorStatusBar,
  RichTextEditorToolbar,
  createRichTextExtensions,
  useRichTextEditor,
}
export type {
  EditorAssetUploadAdapter,
  RichTextDocument,
  RichTextEditorBubbleMenuProps,
  RichTextEditorContentProps,
  RichTextEditorFloatingMenuProps,
  RichTextEditorProps,
  RichTextEditorStatusBarProps,
  RichTextEditorToolbarProps,
  RichTextMentionItem,
  RichTextMentionProvider,
}
