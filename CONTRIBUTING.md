# Contributing

## Setup

Use Node.js 22 or 24 and pnpm 11.18. Run `pnpm install --frozen-lockfile`, then `pnpm registry:build`.

## Source ownership

- Edit components, hooks, libraries, and styles only under `packages/registry/src/`.
- Edit CLI source only under `packages/cli/src/`.
- Do not edit generated registry JSON or CLI `dist/` files manually.
- Keep registry IDs and files kebab-case, React exports PascalCase, and hooks camelCase.
- Public components must expose `data-slot`, accept `className` and native props, and preserve refs where the underlying element supports one.
- Browser APIs must be SSR-safe. Shared browser state should use `useSyncExternalStore`; expensive observers should use the shared pools.

## Validation

Before opening a pull request, run `pnpm check`. New public APIs require source-level documentation, registry metadata, type coverage, behavior tests, and explicit dependency declarations.

Use a Changeset for user-visible changes:

```bash
pnpm changeset
```
