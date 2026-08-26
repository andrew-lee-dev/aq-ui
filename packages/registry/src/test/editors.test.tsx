import * as React from "react"
import type { Editor } from "@tiptap/core"
import {
  act,
  fireEvent,
  render,
  renderHook,
  waitFor,
} from "@testing-library/react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { CodeBlock } from "@aq-ui/registry/components/code-block"
import { CodeEditor } from "@aq-ui/registry/components/code-editor"
import { MarkdownEditor } from "@aq-ui/registry/components/markdown-editor"
import { MarkdownRenderer } from "@aq-ui/registry/components/markdown-renderer"
import { RichTextEditor } from "@aq-ui/registry/components/rich-text-editor"
import { RichTextRenderer } from "@aq-ui/registry/components/rich-text-renderer"
import type { CodeEditorHandle } from "@aq-ui/registry/hooks/use-code-editor"
import { useRichTextEditor } from "@aq-ui/registry/hooks/use-rich-text-editor"
import { codeHighlightClassName } from "@aq-ui/registry/lib/code-highlighter"
import {
  generateRichTextHTML,
  parseRichTextHTML,
} from "@aq-ui/registry/lib/rich-text-html"
import StarterKit from "@tiptap/starter-kit"

describe("content editor SSR and security contracts", () => {
  it("uses a chromatic syntax palette in light and dark themes", () => {
    expect(codeHighlightClassName).toBe("aq-code-highlight")
  })

  it("round-trips canonical rich-text JSON through HTML on the server", () => {
    const document = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Server-safe ", marks: [{ type: "bold" }] },
            { type: "text", text: "content" },
          ],
        },
      ],
    }
    const extensions = [StarterKit]

    const html = generateRichTextHTML(document, { extensions })

    expect(html).toBe("<p><strong>Server-safe </strong>content</p>")
    expect(parseRichTextHTML(html, { extensions })).toEqual(document)
  })

  it("renders highlighted source without interpreting it as HTML", () => {
    const html = renderToStaticMarkup(
      <CodeBlock
        code={'const value = "<script>alert(1)</script>"'}
        language="tsx"
        copyButton={false}
      />
    )

    expect(html).toContain("hljs-keyword")
    expect(html).not.toContain("<script>")
    expect(globalThis).not.toHaveProperty("compromised")
  })

  it("sanitizes raw Markdown HTML and executable URLs during SSR", () => {
    const html = renderToStaticMarkup(
      <MarkdownRenderer
        value={
          "<script>globalThis.compromised=true</script>\n\n[unsafe](javascript:alert(1))"
        }
        allowHtml
      />
    )

    expect(html).not.toContain("<script>")
    expect(html).not.toContain("javascript:")
    expect(globalThis).not.toHaveProperty("compromised")
  })

  it("renders GFM fixtures and unknown fenced languages safely", () => {
    const html = renderToStaticMarkup(
      <MarkdownRenderer
        value={`| Feature | Ready |
| --- | --- |
| Tables | yes |

- [x] Tasks
- ~~Legacy~~

A note[^1].

[^1]: Footnote body.

\`\`\`unknown-language
mystery-token
\`\`\``}
      />
    )

    expect(html).toContain("<table")
    expect(html).toContain('type="checkbox"')
    expect(html).toContain('aria-label="Completed task"')
    expect(html).toContain("<del>Legacy</del>")
    expect(html).toContain("Footnote body")
    expect(html).toContain("mystery-token")
  })

  it("renders only allowlisted rich-text nodes and URL protocols", () => {
    const html = renderToStaticMarkup(
      <RichTextRenderer
        value={{
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Safe text",
                  marks: [
                    { type: "link", attrs: { href: "javascript:alert(1)" } },
                  ],
                },
              ],
            },
            { type: "image", attrs: { src: "data:text/html,unsafe" } },
            { type: "unknown-script-node", attrs: { source: "alert(1)" } },
          ],
        }}
      />
    )

    expect(html).toContain("Safe text")
    expect(html).not.toContain("javascript:")
    expect(html).not.toContain("data:text/html")
    expect(html).not.toContain("unknown-script-node")
  })
})

describe("interactive editor lifecycle", () => {
  it("contains focus and restores inline constraints around Markdown fullscreen", async () => {
    const { container } = render(
      <div>
        <button type="button" data-testid="outside-control">
          Outside control
        </button>
        <MarkdownEditor
          defaultValue="# Fullscreen"
          minHeight={440}
          maxHeight={600}
          style={{ maxWidth: 720 }}
        />
      </div>
    )
    const root = container.querySelector<HTMLElement>(
      '[data-slot="markdown-editor"]'
    )
    expect(root).not.toBeNull()
    await waitFor(() =>
      expect(root?.querySelector(".cm-editor")).not.toBeNull()
    )
    const codeMirror = root?.querySelector(".cm-editor")
    const enterFullscreen = root?.querySelector<HTMLButtonElement>(
      '[aria-label="Enter fullscreen"]'
    )
    expect(enterFullscreen).not.toBeNull()
    enterFullscreen?.focus()
    fireEvent.click(enterFullscreen!)

    await waitFor(() => expect(root).toHaveAttribute("role", "dialog"))
    expect(root).toHaveAttribute("aria-modal", "true")
    expect(root).toHaveAccessibleName("Fullscreen Markdown editor")
    expect(root?.style.position).toBe("fixed")
    expect(root?.style.width).toBe("100vw")
    expect(root?.style.height).toBe("100dvh")
    expect(root?.style.minHeight).toBe("0px")
    expect(root?.style.maxHeight).toBe("none")
    expect(root?.style.maxWidth).toBe("none")
    expect(document.body.style.overflow).toBe("hidden")

    const outside = container.querySelector<HTMLButtonElement>(
      '[data-testid="outside-control"]'
    )
    outside?.focus()
    expect(root?.contains(document.activeElement)).toBe(true)

    const nestedModal = document.createElement("div")
    nestedModal.setAttribute("role", "dialog")
    nestedModal.setAttribute("aria-modal", "true")
    const nestedControl = document.createElement("button")
    nestedControl.type = "button"
    nestedModal.append(nestedControl)
    root?.append(nestedModal)
    nestedControl.focus()
    fireEvent.keyDown(nestedControl, { key: "Escape" })
    expect(root).toHaveAttribute("role", "dialog")
    nestedModal.remove()

    const markdownSource = root?.querySelector<HTMLElement>(
      '[role="textbox"][aria-label="Markdown source"]'
    )
    expect(markdownSource).not.toBeNull()
    markdownSource?.focus()
    markdownSource?.addEventListener(
      "keydown",
      (event) => event.preventDefault(),
      { once: true }
    )
    fireEvent.keyDown(markdownSource!, { key: "Escape" })
    await waitFor(() => expect(root).not.toHaveAttribute("role", "dialog"))
    await waitFor(() => expect(enterFullscreen).toHaveFocus())
    expect(root).not.toHaveAttribute("aria-modal")
    expect(root?.style.minHeight).toBe("440px")
    expect(root?.style.maxHeight).toBe("600px")
    expect(root?.style.maxWidth).toBe("720px")
    expect(document.body.style.overflow).toBe("")
    expect(root?.querySelector(".cm-editor")).toBe(codeMirror)
  })

  it("keeps rich-text suggestions attached to the focused editor", async () => {
    const editor = { current: null as Editor | null }
    const { container } = render(
      <div>
        <RichTextEditor
          onReady={(nextEditor) => {
            editor.current = nextEditor
          }}
        />
        <input aria-label="External search" />
      </div>
    )

    await waitFor(() => expect(editor.current).not.toBeNull())
    act(() => {
      editor.current?.chain().focus("end").insertContent("/").run()
    })
    const textbox = container.querySelector<HTMLElement>(
      '[data-slot="rich-text-editor"] [role="textbox"]'
    )
    await waitFor(() =>
      expect(container.querySelector('[role="listbox"]')).not.toBeNull()
    )
    const listbox = container.querySelector<HTMLElement>('[role="listbox"]')
    const firstOption = listbox?.querySelector<HTMLElement>('[role="option"]')
    expect(textbox).toHaveAttribute("aria-haspopup", "listbox")
    expect(textbox).toHaveAttribute("aria-expanded", "true")
    expect(textbox).toHaveAttribute("aria-controls", listbox?.id)
    expect(textbox).toHaveAttribute("aria-activedescendant", firstOption?.id)
    expect(firstOption).toHaveAttribute("tabindex", "-1")

    textbox?.focus()
    fireEvent.keyDown(textbox!, { key: "ArrowDown" })
    await waitFor(() =>
      expect(
        listbox?.querySelectorAll<HTMLElement>('[role="option"]')[1]
      ).toHaveAttribute("aria-selected", "true")
    )

    const externalSearch = container.querySelector<HTMLInputElement>(
      '[aria-label="External search"]'
    )
    externalSearch?.focus()
    fireEvent.keyDown(externalSearch!, { key: "ArrowDown" })
    fireEvent.keyDown(externalSearch!, { key: "Enter" })
    await waitFor(() =>
      expect(container.querySelector('[role="listbox"]')).toBeNull()
    )
    expect(textbox).toHaveAttribute("aria-expanded", "false")
    expect(textbox).not.toHaveAttribute("aria-controls")
    expect(editor.current?.getText()).toBe("/")

    act(() => {
      editor.current?.chain().focus("end").insertContent("no-match").run()
    })
    await waitFor(() => expect(container).toHaveTextContent("No results"))
    expect(textbox).toHaveAttribute("aria-expanded", "true")
    expect(textbox).not.toHaveAttribute("aria-activedescendant")
    textbox?.focus()
    fireEvent.keyDown(textbox!, { key: "Escape" })
    await waitFor(() =>
      expect(container.querySelector('[role="listbox"]')).toBeNull()
    )
    expect(textbox).toHaveAttribute("aria-expanded", "false")
  })

  it("does not reparse unchanged Markdown during parent renders", () => {
    const paragraph = vi.fn(({ children }: React.ComponentProps<"p">) => (
      <p>{children}</p>
    ))
    const components = { p: paragraph }
    const { rerender } = render(
      <MarkdownRenderer value="Stable preview" components={components} />
    )

    expect(paragraph).toHaveBeenCalledOnce()
    rerender(
      <MarkdownRenderer value="Stable preview" components={components} />
    )
    expect(paragraph).toHaveBeenCalledOnce()

    rerender(
      <MarkdownRenderer value="Changed preview" components={components} />
    )
    expect(paragraph).toHaveBeenCalledTimes(2)
  })

  it("uses logical positioning for the rich-text placeholder in RTL", async () => {
    const { container } = render(
      <RichTextEditor dir="rtl" placeholder="ابدأ الكتابة" />
    )

    await waitFor(() =>
      expect(container.querySelector(".ProseMirror")).not.toBeNull()
    )
    const content = container.querySelector(
      '[data-slot="rich-text-editor-content"]'
    )

    expect(content).toHaveClass(
      "[&_.is-editor-empty:first-child]:before:float-start"
    )
    expect(content).not.toHaveClass(
      "[&_.is-editor-empty:first-child]:before:float-left"
    )
  })

  it("mounts CodeMirror and destroys its view on unmount", async () => {
    const handle = { current: null as CodeEditorHandle | null }
    const onReady = vi.fn((nextHandle: CodeEditorHandle) => {
      handle.current = nextHandle
    })
    const { container, unmount } = render(
      <CodeEditor
        defaultValue="const answer: number = 42"
        language="typescript"
        onReady={onReady}
      />
    )

    await waitFor(() => expect(onReady).toHaveBeenCalledOnce())
    expect(container.querySelector(".cm-editor")).not.toBeNull()
    expect(handle.current?.getValue()).toBe("const answer: number = 42")

    unmount()
    expect(handle.current?.getView()).toBeNull()
  })

  it("does not commit React work for uncontrolled edits without a status bar", async () => {
    const handle = { current: null as CodeEditorHandle | null }
    let commits = 0
    const { container } = render(
      <React.Profiler
        id="code-editor"
        onRender={() => {
          commits += 1
        }}
      >
        <CodeEditor
          defaultValue="const answer = 42"
          language="plaintext"
          onReady={(nextHandle) => {
            handle.current = nextHandle
          }}
        />
      </React.Profiler>
    )

    await waitFor(() =>
      expect(container.firstElementChild).toHaveAttribute(
        "data-language-status",
        "ready"
      )
    )
    const commitsAfterReady = commits

    act(() => {
      handle.current?.getView()?.dispatch({
        changes: { from: 0, insert: "// edited\n" },
      })
    })

    expect(commits).toBe(commitsAfterReady)
  })

  it("updates code metrics when the status bar is enabled", async () => {
    const handle = { current: null as CodeEditorHandle | null }
    const { container } = render(
      <CodeEditor
        defaultValue="abc"
        language="plaintext"
        statusBar
        onReady={(nextHandle) => {
          handle.current = nextHandle
        }}
      />
    )

    await waitFor(() => expect(container).toHaveTextContent("1 line"))
    expect(container).toHaveTextContent("3 characters")

    act(() => {
      handle.current?.getView()?.dispatch({
        changes: { from: 3, insert: "\ndef" },
      })
    })

    await waitFor(() => expect(container).toHaveTextContent("2 lines"))
    expect(container).toHaveTextContent("7 characters")
  })

  it("reconfigures CodeMirror without recreating the view or losing selection", async () => {
    const handle = { current: null as CodeEditorHandle | null }
    const { rerender } = render(
      <CodeEditor
        value="const answer = 42"
        language="typescript"
        onReady={(nextHandle) => {
          handle.current = nextHandle
        }}
      />
    )

    await waitFor(() => expect(handle.current).not.toBeNull())
    const view = handle.current?.getView()
    view?.dispatch({ selection: { anchor: 6, head: 12 } })

    rerender(
      <CodeEditor
        value="short"
        language="json"
        onReady={(nextHandle) => {
          handle.current = nextHandle
        }}
      />
    )

    await waitFor(() => expect(handle.current?.getValue()).toBe("short"))
    expect(handle.current?.getView()).toBe(view)
    expect(handle.current?.getSelection()).toMatchObject({
      anchor: 5,
      head: 5,
    })
    expect(handle.current?.undo()).toBe(false)
  })

  it("mounts Tiptap with the production preset and destroys it on unmount", async () => {
    const editor = { current: null as Editor | null }
    const onReady = vi.fn((nextEditor: Editor) => {
      editor.current = nextEditor
    })
    const { container, unmount } = render(
      <RichTextEditor
        defaultValue={{
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Hello editor" }],
            },
          ],
        }}
        onReady={onReady}
      />
    )

    await waitFor(() => expect(onReady).toHaveBeenCalled())
    expect(container.querySelector(".ProseMirror")).not.toBeNull()
    expect(container).toHaveTextContent("Hello editor")

    unmount()
    await waitFor(() => expect(editor.current?.isDestroyed).toBe(true))
  })

  it("preserves the rich-text selection across controlled content updates", async () => {
    const editor = { current: null as Editor | null }
    const first = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello world" }],
        },
      ],
    }
    const { rerender } = render(
      <RichTextEditor
        value={first}
        onReady={(nextEditor) => {
          editor.current = nextEditor
        }}
      />
    )

    await waitFor(() => expect(editor.current).not.toBeNull())
    editor.current?.commands.setTextSelection({ from: 2, to: 5 })
    rerender(
      <RichTextEditor
        value={{
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Hello updated world" }],
            },
          ],
        }}
        onReady={(nextEditor) => {
          editor.current = nextEditor
        }}
      />
    )

    await waitFor(() =>
      expect(editor.current?.state.selection).toMatchObject({ from: 2, to: 5 })
    )
  })

  it("uses the shared Lowlight language contract for interactive code blocks", async () => {
    const { container } = render(
      <RichTextEditor
        defaultValue={{
          type: "doc",
          content: [
            {
              type: "codeBlock",
              attrs: { language: "typescript" },
              content: [{ type: "text", text: "const answer: number = 42" }],
            },
          ],
        }}
      />
    )

    await waitFor(() =>
      expect(container.querySelector(".hljs-keyword")).not.toBeNull()
    )
  })

  it("cancels rich-text uploads without inserting a late result", async () => {
    let resolveUpload:
      ((asset: { url: string; mimeType: string }) => void) | undefined
    let uploadSignal: AbortSignal | undefined
    const uploadAdapter = {
      upload: vi.fn(
        (
          _file: File,
          context: {
            signal: AbortSignal
            onProgress: (progress: number) => void
          }
        ) => {
          uploadSignal = context.signal
          context.onProgress(25)
          return new Promise<{ url: string; mimeType: string }>((resolve) => {
            resolveUpload = resolve
          })
        }
      ),
    }
    const { result } = renderHook(() => useRichTextEditor({ uploadAdapter }))
    const file = new File(["image"], "photo.png", { type: "image/png" })

    await waitFor(() => expect(result.current.editor).not.toBeNull())
    let pending: Promise<void> | undefined
    act(() => {
      pending = result.current.uploadFiles([file])
    })
    await waitFor(() => expect(result.current.uploads).toHaveLength(1))

    act(() => result.current.cancelUpload(result.current.uploads[0]!.id))
    expect(uploadSignal?.aborted).toBe(true)
    expect(result.current.uploads[0]?.status).toBe("cancelled")

    resolveUpload?.({ url: "/uploads/photo.png", mimeType: "image/png" })
    await act(async () => pending)

    expect(result.current.uploads[0]?.status).toBe("cancelled")
    expect(JSON.stringify(result.current.editor?.getJSON())).not.toContain(
      "/uploads/photo.png"
    )
  })
})
