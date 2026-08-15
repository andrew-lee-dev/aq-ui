import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { MarkdownRenderer } from "@aq-ui/registry/components/markdown-renderer"

const markdown = `# Release checklist

aq-ui renders **CommonMark** with GitHub Flavored Markdown while keeping raw HTML disabled by default.

> Content is sanitized before it reaches the page.

## Quality gates

- [x] Keyboard navigation
- [x] Light and dark themes
- [x] Server rendering
- [ ] Publish the release

| Package | Status |
| :--- | :---: |
| Registry | Ready |
| CLI | In progress |

\`\`\`tsx
import { Button } from "@/components/ui/button"

export function SaveButton() {
  return <Button>Save changes</Button>
}
\`\`\`

[Read the documentation](https://example.com/docs).
`

const meta = {
  title: "Content/Markdown Renderer",
  component: MarkdownRenderer,
  tags: ["autodocs"],
  args: {
    value: markdown,
  },
  parameters: {
    docs: {
      description: {
        component:
          "An SSR-compatible GFM renderer with mandatory sanitization, safe link protocols, and CodeBlock-powered fences.",
      },
    },
  },
} satisfies Meta<typeof MarkdownRenderer>

export default meta
type Story = StoryObj<typeof meta>

export const GfmDocument: Story = {
  decorators: [
    (Story) => (
      <article className="mx-auto w-full max-w-3xl rounded-xl border bg-card p-6">
        <Story />
      </article>
    ),
  ],
}

export const UnsafeHtmlIsRemoved: Story = {
  args: {
    value: `# Safe by default

<script>alert("unsafe")</script>

<img src=x onerror=alert(1)>

[Unsafe protocol](javascript:alert(1))`,
  },
  decorators: [
    (Story) => (
      <article className="mx-auto w-full max-w-2xl rounded-xl border bg-card p-6">
        <Story />
      </article>
    ),
  ],
}
