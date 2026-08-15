# aq-ui

aq-ui is a registry-first, open-code React UI system inspired by the distribution model of shadcn/ui. It combines accessible components, reusable browser hooks, and production-oriented content editors while keeping the installed source inside the consumer's project.

## What is included

- 75 component families: the current shadcn/ui catalog, six aq-ui advanced components, and CodeMirror, Markdown, and Tiptap editor families.
- 72 public hooks: 60 general-purpose hooks and 12 component/editor controllers.
- `aq-ui` CLI with `init`, `add`, `list`, `search`, `info`, `diff`, `update`, `remove`, `doctor`, `theme`, and `migrate` commands.
- React 18.3/19 conventions, Tailwind CSS 4, Base UI behavior, OKLCH tokens, dark mode, RTL-safe logical properties, reduced motion, and SSR-safe browser hooks.
- Static Next.js + MDX documentation and shadcn-compatible registry artifacts for GitHub Pages.

## Workspace

```text
apps/docs          Next.js static documentation and registry host
packages/registry  Source of truth for components, hooks, styles, and metadata
packages/cli       Public ESM command-line package
```

Generated files in `registry.json`, `apps/docs/public/registry.json`, and `apps/docs/public/r/` must not be edited by hand.

## Local development

Requirements: Node.js 22 or 24, Corepack, and pnpm 11.18.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm registry:build
pnpm dev
```

Run the complete quality gate with:

```bash
pnpm check
```

## CLI

During development:

```bash
pnpm --filter aq-ui build
node packages/cli/dist/index.js list --registry ./apps/docs/public/r
```

After publication, consumers can install only what they need:

```bash
pnpm dlx aq-ui init
pnpm dlx aq-ui add button data-grid
pnpm dlx aq-ui add code-editor markdown-editor rich-text-editor
pnpm dlx aq-ui add code-editor --languages typescript,tsx,json,yaml
```

The CLI tracks installed hashes in `.aq-ui/manifest.json`, validates registry paths and HTTPS, writes files transactionally, pins generated dependencies to tested version ranges, and preserves local edits unless `--force` is explicitly supplied.

## Editors

- `CodeEditor` uses CodeMirror 6 compartments and lazy language loaders. It never executes code.
- CodeMirror language source and packages are registry-granular. The CLI stores the selected preset in `.aq-ui/manifest.json`; use `--languages all` for every built-in loader.
- `CodeBlock` is a static SSR-compatible Lowlight renderer and does not install CodeMirror.
- `MarkdownEditor` stores CommonMark/GFM source and uses the same CodeMirror foundation.
- `MarkdownRenderer` disables raw HTML by default and always sanitizes the HTML-enabled pipeline.
- `RichTextEditor` stores Tiptap JSON, supports transport-neutral uploads, and uses `immediatelyRender: false` for SSR integration.
- `generateRichTextHTML` and `parseRichTextHTML` convert Tiptap JSON and HTML without creating an editor instance; callers pass the exact extension schema used by their document.

## License

MIT. See [LICENSE](./LICENSE) and [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
