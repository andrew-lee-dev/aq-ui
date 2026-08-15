import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { CodeEditor } from "@aq-ui/registry/components/code-editor"
import { MarkdownEditor } from "@aq-ui/registry/components/markdown-editor"
import {
  RichTextEditor,
  type RichTextDocument,
} from "@aq-ui/registry/components/rich-text-editor"

const code = `interface Theme {
  name: string
  radius: number
  dark: boolean
}

const neutral: Theme = {
  name: "aq-neutral",
  radius: 10,
  dark: false,
}`

const markdown = `# Edit Markdown

Use the toolbar or familiar keyboard shortcuts.

- Write with **GFM**
- Switch to preview
- Try split view on a wide canvas

\`\`\`ts
const secureByDefault = true
\`\`\``

const richDocument: RichTextDocument = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Rich text editor" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Select text to open the bubble menu, or type " },
        { type: "text", marks: [{ type: "code" }], text: "/" },
        { type: "text", text: " to insert a block." },
      ],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Canonical Tiptap JSON" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "SSR-safe initialization" }],
            },
          ],
        },
      ],
    },
  ],
}

const meta = {
  title: "Content/Editor Shells",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Interactive CodeMirror, Markdown, and Tiptap shells share aq-ui tokens and controlled/uncontrolled conventions.",
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const CodeMirror: Story = {
  render: () => (
    <div className="w-full max-w-4xl">
      <CodeEditor
        defaultValue={code}
        language="typescript"
        minHeight={300}
        statusBar
        aria-label="TypeScript theme example"
      />
    </div>
  ),
}

export const Markdown: Story = {
  render: () => (
    <div className="w-full max-w-6xl">
      <MarkdownEditor
        defaultValue={markdown}
        defaultMode="split"
        minHeight={420}
      />
    </div>
  ),
  parameters: {
    viewport: { defaultViewport: "responsive" },
  },
}

export const RichText: Story = {
  render: () => (
    <div className="w-full max-w-4xl">
      <RichTextEditor
        defaultValue={richDocument}
        contentClassName="min-h-72"
        placeholder="Write a release note…"
      />
    </div>
  ),
}

export const ReadOnlyStates: Story = {
  render: () => (
    <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-2">
      <CodeEditor value={code} language="typescript" readOnly statusBar />
      <RichTextEditor value={richDocument} readOnly toolbar={false} />
    </div>
  ),
}
