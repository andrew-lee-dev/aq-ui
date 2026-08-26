import type { Metadata } from "next"

import { CodeBlock } from "@aq-ui/registry/components/code-block"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@aq-ui/registry/components/table"

export const metadata: Metadata = { title: "CLI reference" }

const commands = [
  ["init", "Detect the project and create the aq-ui configuration and theme."],
  [
    "add",
    "Resolve the dependency graph, select editor languages, and install source atomically.",
  ],
  [
    "list / search / info",
    "Explore registry metadata without mutating the project.",
  ],
  [
    "diff",
    "Compare installed hashes, local source, and current upstream records.",
  ],
  ["update", "Update clean files while protecting local modifications."],
  ["remove", "Remove owned files only when changes are safe or forced."],
  [
    "doctor",
    "Validate aliases, manifests, files, dependencies, and registry access.",
  ],
  ["theme", "Install or update the aq-neutral OKLCH token block."],
  [
    "migrate",
    "Normalize an existing shadcn-compatible configuration for aq-ui.",
  ],
]

export default function CliPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight">CLI reference</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        The public ESM package supports pnpm, npm, yarn, and bun; TypeScript and
        JavaScript output; scoped registries; JSON output; dry runs; and
        explicit conflict handling.
      </p>
      <CodeBlock
        className="mt-8"
        code="pnpm dlx aq-ui@alpha --help"
        language="bash"
        copyButton
      />
      <div className="mt-10 overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Command</TableHead>
              <TableHead>Purpose</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commands.map(([command, purpose]) => (
              <TableRow key={command}>
                <TableCell className="font-mono">aq-ui {command}</TableCell>
                <TableCell>{purpose}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Granular editor languages</h2>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          CodeMirror language loaders are separate registry items. The default
          production preset installs plaintext, JavaScript, TypeScript, JSX,
          TSX, JSON, HTML, CSS, and Markdown; YAML and SQL are opt-in. A
          Markdown editor always keeps its required Markdown loader.
        </p>
        <CodeBlock
          className="mt-4"
          code={
            "pnpm dlx aq-ui@alpha add code-editor --languages typescript,json,yaml\n" +
            "pnpm dlx aq-ui@alpha add markdown-editor --languages typescript,sql\n" +
            "pnpm dlx aq-ui@alpha add code-editor --languages all"
          }
          language="bash"
          copyButton
        />
      </section>
      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Safety model</h2>
        <ul className="mt-4 list-disc space-y-2 ps-6 text-muted-foreground">
          <li>
            HTTPS is required except for explicit localhost and local-file
            development registries.
          </li>
          <li>
            Paths are normalized and checked for traversal, absolute targets,
            and symlink escapes.
          </li>
          <li>
            Writes are transactional and roll back if a later operation fails.
          </li>
          <li>
            Lifecycle scripts are disabled during dependency installation.
          </li>
          <li>
            Local modifications require an explicit <code>--force</code> before
            overwrite or removal.
          </li>
        </ul>
      </section>
    </main>
  )
}
