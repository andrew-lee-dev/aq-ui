import "server-only"

import { readFileSync } from "node:fs"
import { resolve } from "node:path"

export interface RegistryFile {
  path: string
  type: string
  content?: string
}

export interface RegistryApiMember {
  name: string
  kind:
    | "property"
    | "method"
    | "parameter"
    | "call"
    | "index"
    | "construct"
    | "enum"
  optional?: boolean
  readonly?: boolean
  type?: string
  default?: string
  description?: string
}

export interface RegistryApiEntry {
  name: string
  kind: "class" | "const" | "enum" | "function" | "interface" | "type" | "value"
  line?: number
  signature?: string
  description?: string
  source?: string
  propsType?: string
  props?: RegistryApiMember[]
  members?: RegistryApiMember[]
  parameters?: RegistryApiMember[]
  returns?: string
  usage?: string
}

export interface RegistryUsage {
  importPath: string
  importStatement: string
  primaryExport?: string
  example?: string
}

export interface RegistryItem {
  name: string
  title: string
  description: string
  type: string
  dependencies?: string[]
  registryDependencies?: string[]
  files?: RegistryFile[]
  meta?: {
    api?: RegistryApiEntry[]
    usage?: RegistryUsage
    ssr?: boolean
  }
}
interface RegistryCatalog {
  items: RegistryItem[]
}

let cached: RegistryCatalog | undefined

export function getRegistry() {
  if (!cached) {
    cached = JSON.parse(
      readFileSync(resolve(process.cwd(), "../../registry.json"), "utf8")
    ) as RegistryCatalog
  }
  return cached
}

export function getRegistryItem(name: string) {
  return getRegistry().items.find((item) => item.name === name)
}

export function getRegistryRecord(name: string) {
  if (!/^[a-z0-9][a-z0-9-]*$/u.test(name)) return undefined
  const path = resolve(process.cwd(), `public/r/${name}.json`)
  try {
    return JSON.parse(readFileSync(path, "utf8")) as RegistryItem
  } catch {
    return undefined
  }
}
