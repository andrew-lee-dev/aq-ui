import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { CodeBlock } from "@aq-ui/registry/components/code-block"

const typescriptExample = `type RegistryItem = {
  name: string
  dependencies: string[]
}

export function install(item: RegistryItem) {
  return item.dependencies.map((dependency) => ({
    dependency,
    source: \`https://aq-ui.dev/r/\${dependency}.json\`,
  }))
}`

const meta = {
  title: "Content/Code Block",
  component: CodeBlock,
  tags: ["autodocs"],
  args: {
    code: typescriptExample,
    copyButton: true,
    filename: "registry.ts",
    language: "typescript",
    lineNumbers: true,
  },
  argTypes: {
    diff: {
      control: "select",
      options: ["none", "added", "removed", "mixed"],
    },
    language: {
      control: "select",
      options: [
        "plaintext",
        "javascript",
        "typescript",
        "json",
        "html",
        "css",
        "markdown",
        "yaml",
        "sql",
      ],
    },
  },
} satisfies Meta<typeof CodeBlock>

export default meta
type Story = StoryObj<typeof meta>

export const TypeScript: Story = {}

export const HighlightedLines: Story = {
  args: {
    highlightedLines: [1, 7, 8],
  },
}

export const MixedDiff: Story = {
  args: {
    code: ` const tokens = createTokens({
-  radius: "8px",
+  radius: "10px",
   colorSpace: "oklch",
 })`,
    diff: "mixed",
    filename: "theme.ts",
    language: "typescript",
  },
}

export const WrappedPlainText: Story = {
  args: {
    code: "A long plain-text line demonstrates wrapping without initializing a client-side code editor. This keeps documentation and server-rendered content lightweight.",
    filename: "notes.txt",
    language: "plaintext",
    lineNumbers: false,
    wrapLines: true,
  },
}
