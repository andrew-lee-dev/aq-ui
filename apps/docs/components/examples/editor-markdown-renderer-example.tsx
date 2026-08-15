"use client"

import { MarkdownRenderer } from "@aq-ui/registry/components/markdown-renderer"

const markdownExample = `# Release checklist

aq-ui renders **CommonMark** with GitHub Flavored Markdown.

> Preview content is sanitized before it reaches the page.

- [x] Keyboard navigation
- [x] Light and dark themes
- [x] Server rendering
- [ ] Publish the alpha

| Package | Status |
| :--- | :---: |
| Registry | Ready |
| CLI | Ready |

\`\`\`tsx
import { Button } from "@/components/ui/button"

export function SaveButton() {
  return <Button>Save changes</Button>
}
\`\`\`
`

function MarkdownRendererExample() {
  return (
    <article className="w-full max-w-3xl rounded-xl border bg-card p-6">
      <MarkdownRenderer value={markdownExample} />
    </article>
  )
}

export default MarkdownRendererExample
