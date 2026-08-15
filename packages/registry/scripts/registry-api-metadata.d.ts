export type RegistryApiKind =
  "class" | "const" | "enum" | "function" | "interface" | "type" | "value"

export type RegistryApiMemberKind =
  "call" | "construct" | "enum" | "index" | "method" | "parameter" | "property"

export interface RegistryApiMember {
  name: string
  kind: RegistryApiMemberKind
  optional?: boolean
  readonly?: boolean
  type?: string
  default?: string
  description?: string
}

/**
 * Rich symbol metadata is emitted in individual `/r/{name}.json` records.
 * The root catalog intentionally keeps only `name`, `kind`, and `line`.
 */
export interface RegistryApiEntry {
  name: string
  kind: RegistryApiKind
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

export interface RegistryApiUsage {
  importPath: string
  importStatement: string
  primaryExport?: string
  example?: string
}
