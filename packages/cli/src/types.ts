import type { CodeLanguageName } from "./languages.js"

export const MANIFEST_VERSION = 1 as const

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun"

export type RegistryItemType =
  | "registry:block"
  | "registry:component"
  | "registry:hook"
  | "registry:lib"
  | "registry:page"
  | "registry:style"
  | "registry:theme"
  | "registry:ui"
  | (string & {})

export interface RegistryFile {
  path: string
  type?: RegistryItemType
  target?: string
  content?: string
}

export interface RegistryItem {
  $schema?: string
  name: string
  type: RegistryItemType
  title?: string
  description?: string
  author?: string
  version?: string
  dependencies?: string[]
  devDependencies?: string[]
  registryDependencies?: string[]
  files: RegistryFile[]
  css?: Record<string, unknown>
  cssVars?: Record<string, unknown>
  meta?: Record<string, unknown>
}

export interface RegistryCatalog {
  $schema?: string
  name?: string
  homepage?: string
  items: RegistryItem[]
}

export interface ComponentsConfig {
  $schema?: string
  style?: string
  rsc?: boolean
  tsx?: boolean
  tailwind?: {
    config?: string
    css?: string
    baseColor?: string
    cssVariables?: boolean
    prefix?: string
  }
  aliases: {
    components?: string
    hooks?: string
    lib?: string
    utils?: string
    ui?: string
  }
  iconLibrary?: string
  rtl?: boolean
  registries?: Record<string, string | { url: string; params?: Record<string, string> }>
  /** aq-ui extension used when no scoped registry is configured. */
  registry?: string
}

export interface ManifestFile {
  path: string
  hash: string
}

export interface ManifestItem {
  name: string
  type: RegistryItemType
  version?: string
  registry: string
  installedAt: string
  registryDependencies: string[]
  dependencies: string[]
  devDependencies: string[]
  files: ManifestFile[]
}

export interface AqManifest {
  version: typeof MANIFEST_VERSION
  channel: string
  registry: string
  codeLanguages?: CodeLanguageName[]
  items: Record<string, ManifestItem>
}

export interface GlobalOptions {
  cwd: string
  registry?: string
  channel: string
  packageManager?: PackageManager
  dryRun: boolean
  force: boolean
  json: boolean
  yes: boolean
  skipDeps: boolean
  languages?: CodeLanguageName[]
}

export interface CommandResult<T = unknown> {
  ok: boolean
  command: string
  data: T
  warnings?: string[]
}

export interface FileOperation {
  kind: "write" | "remove"
  path: string
  content?: string
  previousHash?: string
  item: string
}

export interface InstallPlan {
  items: RegistryItem[]
  operations: FileOperation[]
  dependencies: string[]
  devDependencies: string[]
  conflicts: string[]
}

export interface DiffEntry {
  item: string
  path: string
  local: "clean" | "modified" | "missing"
  upstream: "unchanged" | "changed" | "missing" | "unavailable"
}
