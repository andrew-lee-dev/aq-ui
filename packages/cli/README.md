# aq-ui CLI

The `aq-ui` CLI installs open-code React components, hooks, utilities, and themes from a
shadcn-compatible registry.

```bash
pnpm dlx aq-ui init
pnpm dlx aq-ui add button dialog
pnpm dlx aq-ui add code-editor --languages typescript,tsx,json,yaml
pnpm dlx aq-ui diff
pnpm dlx aq-ui update
```

## Commands

- `init` detects TypeScript, RSC, source aliases, and the Tailwind CSS entry point, then creates
  `components.json`, `.aq-ui/manifest.json`, and the `aq-neutral` theme.
- `add`, `update`, and `remove` resolve registry dependencies and protect locally edited files.
- `add --languages <csv|all>` installs only the selected lazy CodeMirror language loaders and records the preset for future updates.
- `list`, `search`, and `info` inspect the configured registry.
- `diff` compares local hashes with the installed and upstream copies.
- `doctor` validates configuration, aliases, manifest integrity, and registry connectivity.
- `theme` installs the semantic OKLCH token block.
- `migrate` upgrades aq-ui configuration and manifest formats.

All commands support `--cwd`, `--json`, and `--dry-run` where applicable. Mutating commands also
support `--force`. Use `--registry` for an HTTPS URL or a local registry directory and
`--skip-deps` when dependency installation is managed separately.

## Safety model

Registry responses are size-limited and structurally validated. Remote registries must use HTTPS
(HTTP is accepted only for localhost development). File targets reject absolute paths, traversal,
duplicate targets, and symlink ancestors. Writes and removals are staged and rolled back as one
filesystem transaction. Package lifecycle scripts are disabled during dependency installation.

When `components.json` sets `tsx: false`, TypeScript and TSX registry files are converted to
JavaScript and JSX with the TypeScript compiler API rather than text-based type stripping.
