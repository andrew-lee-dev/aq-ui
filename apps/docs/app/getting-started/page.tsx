import type { Metadata } from "next"
import Link from "next/link"

import { CodeBlock } from "@aq-ui/registry/components/code-block"

export const metadata: Metadata = { title: "Getting started" }

const config = `{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "aq-neutral",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "css": "src/app/globals.css",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "ui": "@/components/ui",
    "hooks": "@/hooks",
    "lib": "@/lib",
    "utils": "@/lib/utils"
  }
}`

export default function GettingStartedPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight">Getting started</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        aq-ui installs editable source into React applications. There is no
        monolithic component runtime to wrap your project.
      </p>
      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Requirements</h2>
        <p className="mt-3 text-muted-foreground">
          React 18.3 or 19, Tailwind CSS 4, and a project built with Next.js,
          Vite, or React Router.
        </p>
      </section>
      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Initialize</h2>
        <CodeBlock
          code="pnpm dlx aq-ui@alpha init"
          language="bash"
          copyButton
        />
        <p className="text-muted-foreground">
          The command detects your package manager and aliases, creates{" "}
          <code>components.json</code>, installs the neutral token foundation,
          and records source hashes.
        </p>
        <CodeBlock
          code={config}
          language="json"
          filename="components.json"
          lineNumbers
        />
      </section>
      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Add open code</h2>
        <CodeBlock
          code="pnpm dlx aq-ui@alpha add button dialog data-grid"
          language="bash"
          copyButton
        />
        <p className="text-muted-foreground">
          Only declared transitive registry items and npm packages are
          installed. Local edits are protected during diff, update, and remove
          operations.
        </p>
      </section>
      <p className="mt-12 text-muted-foreground">
        Continue with the{" "}
        <Link
          href="/components/"
          className="font-medium text-primary underline underline-offset-4"
        >
          component catalog
        </Link>
        ,{" "}
        <Link
          href="/hooks/"
          className="font-medium text-primary underline underline-offset-4"
        >
          hook catalog
        </Link>
        , or{" "}
        <Link
          href="/cli/"
          className="font-medium text-primary underline underline-offset-4"
        >
          CLI reference
        </Link>
        .
      </p>
    </main>
  )
}
