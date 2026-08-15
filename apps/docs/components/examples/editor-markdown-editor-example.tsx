"use client"

import { MarkdownEditor } from "@aq-ui/registry/components/markdown-editor"

const markdownExample = `## Release checklist

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

function MarkdownEditorExample() {
  return (
    <div className="w-full max-w-5xl">
      <MarkdownEditor
        defaultValue={markdownExample}
        defaultMode="split"
        minHeight={440}
        maxHeight={600}
      />
    </div>
  )
}

export default MarkdownEditorExample
