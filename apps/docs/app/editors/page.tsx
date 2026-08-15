import type { Metadata } from "next"
import Link from "next/link"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@aq-ui/registry/components/card"
import { CodeBlock } from "@aq-ui/registry/components/code-block"
import { MarkdownRenderer } from "@aq-ui/registry/components/markdown-renderer"

export const metadata: Metadata = { title: "Content editors" }

const editors = [
  {
    name: "code-editor",
    title: "Code Editor",
    description:
      "CodeMirror 6, lazy JavaScript/TypeScript/JSX/TSX/JSON/HTML/CSS/Markdown/YAML/SQL, compartments, diagnostics, search, folding, and no execution path.",
  },
  {
    name: "markdown-editor",
    title: "Markdown Editor",
    description:
      "Canonical CommonMark/GFM source, write/preview/split modes, responsive toolbar, upload adapter, deferred preview, and sanitized rendering.",
  },
  {
    name: "rich-text-editor",
    title: "Rich Text Editor",
    description:
      "Canonical Tiptap JSON with production formatting, lists, tables, images, attachments, mentions, slash commands, uploads, an SSR-safe static renderer, and server JSON/HTML conversion.",
  },
]

export default function EditorsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight">Content editors</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        The editors share aq-ui tokens and contracts while keeping distinct
        canonical formats. Code is never executed, Markdown HTML stays
        sanitized, and rich text persists structured JSON.
      </p>
      <CodeBlock
        className="mt-6"
        code="aq-ui add code-editor --languages typescript,tsx,json,yaml"
        language="bash"
        copyButton
      />
      <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
        Language loaders are lazy and registry-granular, so the command writes
        and installs only the selected production modules. Use{" "}
        <code>--languages all</code> for the complete built-in set.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {editors.map((editor) => (
          <Link
            key={editor.name}
            href={`/components/${editor.name}/`}
            prefetch={false}
          >
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle>{editor.title}</CardTitle>
                <CardDescription>{editor.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">Static code</h2>
          <CodeBlock
            code={
              'const greeting: string = "Hello aq-ui"\nconsole.log(greeting)'
            }
            language="typescript"
            filename="example.ts"
            lineNumbers
            highlightedLines={[1]}
          />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Sanitized GFM</h2>
          <div className="mt-4 rounded-lg border p-4">
            <MarkdownRenderer
              value={
                "### Preview\n\n- [x] GFM tasks\n- [x] Safe links\n\n| Format | Canonical |\n| --- | --- |\n| Markdown | string |\n| Rich text | JSON |"
              }
            />
          </div>
        </div>
      </section>
    </main>
  )
}
