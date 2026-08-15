import { createHash } from "node:crypto"
import { stat } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { CliError, asError, invariant } from "./errors.js"
import { pathExists, readJsonFile } from "./fs.js"
import {
  DEFAULT_CODE_LANGUAGES,
  codeLanguageItemName,
  codeLanguagePresetContent,
  normalizeCodeLanguageSelection,
} from "./languages.js"
import type { CodeLanguageName } from "./languages.js"
import type { ComponentsConfig, RegistryCatalog, RegistryFile, RegistryItem } from "./types.js"

const MAX_REGISTRY_BYTES = 5 * 1024 * 1024
const REQUEST_TIMEOUT_MS = 15_000

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function stringArray(value: unknown, field: string): string[] {
  if (value === undefined) return []
  invariant(Array.isArray(value), "INVALID_REGISTRY", `${field} must be an array.`)
  invariant(
    value.every((entry) => typeof entry === "string" && entry.length > 0),
    "INVALID_REGISTRY",
    `${field} must contain non-empty strings.`
  )
  return value as string[]
}

function validateRegistryFile(value: unknown, itemName: string): RegistryFile {
  invariant(isRecord(value), "INVALID_REGISTRY", `A file in ${itemName} is not an object.`)
  invariant(
    typeof value.path === "string" && value.path.length > 0,
    "INVALID_REGISTRY",
    `A file in ${itemName} has no path.`
  )
  if (value.target !== undefined) {
    invariant(
      typeof value.target === "string",
      "INVALID_REGISTRY",
      `Invalid target in ${itemName}.`
    )
  }
  if (value.content !== undefined) {
    invariant(
      typeof value.content === "string",
      "INVALID_REGISTRY",
      `Invalid content in ${itemName}.`
    )
  }
  if (value.type !== undefined) {
    invariant(
      typeof value.type === "string",
      "INVALID_REGISTRY",
      `Invalid file type in ${itemName}.`
    )
  }
  return value as unknown as RegistryFile
}

export function validateRegistryItem(value: unknown, expectedName?: string): RegistryItem {
  invariant(isRecord(value), "INVALID_REGISTRY", "Registry item must be an object.")
  invariant(
    typeof value.name === "string" &&
      /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/i.test(value.name),
    "INVALID_REGISTRY",
    "Registry item has an invalid name."
  )
  invariant(
    typeof value.type === "string" && value.type.startsWith("registry:"),
    "INVALID_REGISTRY",
    `Registry item ${value.name} has an invalid type.`
  )
  invariant(
    value.files === undefined || Array.isArray(value.files),
    "INVALID_REGISTRY",
    `Registry item ${value.name} has invalid files.`
  )
  const item = {
    ...value,
    dependencies: stringArray(value.dependencies, `${value.name}.dependencies`),
    devDependencies: stringArray(value.devDependencies, `${value.name}.devDependencies`),
    registryDependencies: stringArray(
      value.registryDependencies,
      `${value.name}.registryDependencies`
    ),
    files: (value.files ?? []).map((file) => validateRegistryFile(file, value.name as string)),
  } as unknown as RegistryItem

  if (expectedName) {
    const expectedLeaf = parseRegistryName(expectedName).leaf
    invariant(
      item.name === expectedName || item.name === expectedLeaf,
      "REGISTRY_NAME_MISMATCH",
      `Requested ${expectedName}, but the registry returned ${item.name}.`
    )
    if (expectedName.startsWith("@")) item.name = expectedName
  }
  return item
}

export function validateRegistryCatalog(value: unknown): RegistryCatalog {
  invariant(isRecord(value), "INVALID_REGISTRY", "Registry catalog must be an object.")
  invariant(Array.isArray(value.items), "INVALID_REGISTRY", "Registry catalog has no items array.")
  return {
    ...(value as object),
    items: value.items.map((item) => validateRegistryItem(item)),
  } as RegistryCatalog
}

function registryDefinition(config: ComponentsConfig, scope: string): string | undefined {
  const definition = config.registries?.[scope]
  if (typeof definition === "string") return definition
  return definition?.url
}

function parseRegistryName(name: string): { scope?: string; leaf: string; directUrl?: string } {
  if (isUrl(name)) {
    const url = new URL(name)
    const leaf = path.posix.basename(url.pathname).replace(/\.json$/i, "")
    invariant(
      /^[a-z0-9][a-z0-9._-]*$/i.test(leaf),
      "INVALID_ITEM_NAME",
      `Invalid item URL: ${name}`
    )
    return { leaf, directUrl: name }
  }
  if (!name.startsWith("@")) {
    invariant(
      /^[a-z0-9][a-z0-9._-]*$/i.test(name),
      "INVALID_ITEM_NAME",
      `Invalid item name: ${name}`
    )
    return { leaf: name }
  }
  const slash = name.indexOf("/")
  invariant(slash > 1 && slash < name.length - 1, "INVALID_ITEM_NAME", `Invalid item name: ${name}`)
  const scope = name.slice(0, slash)
  const leaf = name.slice(slash + 1)
  invariant(
    /^@[a-z0-9][a-z0-9._-]*$/i.test(scope) && /^[a-z0-9][a-z0-9._-]*$/i.test(leaf),
    "INVALID_ITEM_NAME",
    `Invalid item name: ${name}`
  )
  return { scope, leaf }
}

function applyTemplate(source: string, name: string | undefined, channel: string): string {
  return source
    .replaceAll("{channel}", encodeURIComponent(channel))
    .replaceAll("{name}", encodeURIComponent(name ?? "registry"))
}

function isUrl(value: string): boolean {
  return /^[a-z][a-z\d+.-]*:/i.test(value)
}

function resourceLocation(
  base: string,
  itemName: string | undefined,
  channel: string,
  projectRoot: string
): string {
  const hadNameTemplate = base.includes("{name}")
  const templated = applyTemplate(base, itemName, channel)
  if (hadNameTemplate) return templated

  const fileName = itemName ? `${itemName}.json` : "registry.json"
  if (isUrl(templated)) {
    const url = new URL(templated)
    if (url.protocol === "file:") {
      const localPath = fileURLToPath(url)
      return localPath.endsWith(".json")
        ? itemName
          ? path.join(path.dirname(localPath), fileName)
          : localPath
        : path.join(localPath, fileName)
    }
    if (url.pathname.endsWith(".json")) {
      if (!itemName) return url.toString()
      url.pathname = `${url.pathname.slice(0, url.pathname.lastIndexOf("/") + 1)}${fileName}`
      return url.toString()
    }
    url.pathname = `${url.pathname.replace(/\/$/, "")}/${fileName}`
    return url.toString()
  }

  const localPath = path.resolve(projectRoot, templated)
  return localPath.endsWith(".json")
    ? itemName
      ? path.join(path.dirname(localPath), fileName)
      : localPath
    : path.join(localPath, fileName)
}

function parentCatalogLocation(
  base: string,
  channel: string,
  projectRoot: string
): string | undefined {
  const location = resourceLocation(base, undefined, channel, projectRoot)
  if (isUrl(location)) {
    const url = new URL(location)
    if (url.protocol === "file:") {
      const localPath = fileURLToPath(url)
      return path.join(path.dirname(path.dirname(localPath)), "registry.json")
    }
    return new URL("../registry.json", url).toString()
  }
  return path.join(path.dirname(path.dirname(location)), "registry.json")
}

async function fetchJson(location: string): Promise<unknown> {
  if (!isUrl(location) || location.startsWith("file:")) {
    const file = location.startsWith("file:") ? fileURLToPath(location) : location
    const fileStats = await stat(file).catch((error: unknown) => {
      throw new CliError("FILE_READ_FAILED", `Unable to read ${file}.`, asError(error).message)
    })
    invariant(fileStats.isFile(), "INVALID_REGISTRY", `Registry resource is not a file: ${file}`)
    invariant(
      fileStats.size <= MAX_REGISTRY_BYTES,
      "REGISTRY_TOO_LARGE",
      `Registry resource exceeds ${MAX_REGISTRY_BYTES} bytes: ${file}`
    )
    return readJsonFile(file)
  }

  const url = new URL(location)
  const isLocalhost =
    url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1"
  invariant(
    url.protocol === "https:" || (url.protocol === "http:" && isLocalhost),
    "INSECURE_REGISTRY",
    `Registry must use HTTPS: ${url.toString()}`
  )

  let response: Response
  try {
    response = await fetch(url, {
      headers: { accept: "application/json", "user-agent": "aq-ui-cli" },
      redirect: "follow",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    throw new CliError(
      "REGISTRY_UNAVAILABLE",
      `Unable to reach ${url.toString()}.`,
      asError(error).message
    )
  }

  invariant(
    response.ok,
    "REGISTRY_HTTP_ERROR",
    `Registry returned HTTP ${response.status} for ${url}.`
  )
  const finalUrl = new URL(response.url)
  const finalIsLocalhost =
    finalUrl.hostname === "localhost" ||
    finalUrl.hostname === "127.0.0.1" ||
    finalUrl.hostname === "::1"
  invariant(
    finalUrl.protocol === "https:" || (finalUrl.protocol === "http:" && finalIsLocalhost),
    "INSECURE_REGISTRY",
    `Registry redirected to an insecure URL: ${response.url}`
  )
  const contentLength = Number(response.headers.get("content-length") ?? 0)
  invariant(
    !Number.isFinite(contentLength) || contentLength <= MAX_REGISTRY_BYTES,
    "REGISTRY_TOO_LARGE",
    `Registry response exceeds ${MAX_REGISTRY_BYTES} bytes.`
  )
  const text = await response.text()
  invariant(
    Buffer.byteLength(text, "utf8") <= MAX_REGISTRY_BYTES,
    "REGISTRY_TOO_LARGE",
    "Registry response is too large."
  )
  try {
    return JSON.parse(text) as unknown
  } catch (error) {
    throw new CliError(
      "INVALID_REGISTRY",
      `Registry returned invalid JSON from ${url}.`,
      asError(error).message
    )
  }
}

export interface RegistryClientOptions {
  root: string
  base: string
  channel: string
  config: ComponentsConfig
  sources?: Record<string, string>
  codeLanguages?: readonly CodeLanguageName[]
}

export class RegistryClient {
  private readonly catalogs = new Map<string, Promise<RegistryCatalog>>()
  private readonly items = new Map<string, Promise<RegistryItem>>()
  private readonly itemSources = new WeakMap<RegistryItem, string>()
  private readonly codeLanguages: CodeLanguageName[] | undefined

  constructor(private readonly options: RegistryClientOptions) {
    this.codeLanguages = options.codeLanguages
      ? normalizeCodeLanguageSelection(options.codeLanguages)
      : undefined
  }

  getCodeLanguages(): readonly CodeLanguageName[] {
    return this.codeLanguages ?? DEFAULT_CODE_LANGUAGES
  }

  private configureItem(item: RegistryItem): RegistryItem {
    if (item.name !== "code-language-preset" || !this.codeLanguages) {
      return item
    }

    const content = codeLanguagePresetContent(this.codeLanguages)
    return {
      ...item,
      registryDependencies: this.codeLanguages.map(codeLanguageItemName),
      files: item.files.map((file) => ({ ...file, content })),
      meta: {
        ...(item.meta ?? {}),
        integrity: `sha256-${createHash("sha256").update(content).digest("hex")}`,
      },
    }
  }

  getBaseForItem(name: string): string {
    const { scope, directUrl } = parseRegistryName(name)
    if (directUrl) return new URL(".", directUrl).toString()
    const installedSource = this.options.sources?.[name]
    if (installedSource) return installedSource
    if (scope) {
      const scoped = registryDefinition(this.options.config, scope)
      invariant(scoped, "REGISTRY_NOT_CONFIGURED", `No registry configured for ${scope}.`)
      return scoped
    }
    return this.options.base
  }

  getLocation(name?: string): string {
    const parsed = name ? parseRegistryName(name) : undefined
    const base = name ? this.getBaseForItem(name) : this.options.base
    return resourceLocation(base, parsed?.leaf, this.options.channel, this.options.root)
  }

  async catalog(base = this.options.base): Promise<RegistryCatalog> {
    const cached = this.catalogs.get(base)
    if (cached) return cached
    const promise = (async () => {
      const location = resourceLocation(base, undefined, this.options.channel, this.options.root)
      try {
        return validateRegistryCatalog(await fetchJson(location))
      } catch (error) {
        const code = (error as { code?: string }).code
        if (
          code !== "REGISTRY_HTTP_ERROR" &&
          code !== "FILE_READ_FAILED" &&
          code !== "REGISTRY_UNAVAILABLE"
        ) {
          throw error
        }
        const fallback = parentCatalogLocation(base, this.options.channel, this.options.root)
        if (!fallback || fallback === location) throw error
        return validateRegistryCatalog(await fetchJson(fallback))
      }
    })()
    this.catalogs.set(base, promise)
    return promise
  }

  async item(name: string): Promise<RegistryItem> {
    const cached = this.items.get(name)
    if (cached) return cached
    const promise = this.fetchItem(name).then((fetchedItem) => {
      const item = this.configureItem(fetchedItem)
      this.itemSources.set(item, parseRegistryName(name).directUrl ?? this.getBaseForItem(name))
      return item
    })
    this.items.set(name, promise)
    return promise
  }

  private async fetchItem(name: string): Promise<RegistryItem> {
    const parsed = parseRegistryName(name)
    const base = this.getBaseForItem(name)
    const location =
      parsed.directUrl ??
      resourceLocation(base, parsed.leaf, this.options.channel, this.options.root)

    try {
      const value = await fetchJson(location)
      if (isRecord(value) && Array.isArray(value.items)) {
        const catalog = validateRegistryCatalog(value)
        const found = catalog.items.find((item) => item.name === parsed.leaf || item.name === name)
        invariant(found, "ITEM_NOT_FOUND", `Registry item not found: ${name}`)
        return validateRegistryItem(found, name)
      }
      return validateRegistryItem(value, name)
    } catch (error) {
      if (parsed.directUrl) throw error
      const directError = error as { code?: string }
      if (
        directError.code !== "REGISTRY_HTTP_ERROR" &&
        directError.code !== "FILE_READ_FAILED" &&
        directError.code !== "REGISTRY_UNAVAILABLE"
      ) {
        throw error
      }
    }

    const catalog = await this.catalog(base)
    const found = catalog.items.find((item) => item.name === parsed.leaf || item.name === name)
    invariant(found, "ITEM_NOT_FOUND", `Registry item not found: ${name}`)
    const hasContent = found.files.every((file) => typeof file.content === "string")
    invariant(
      hasContent,
      "ITEM_CONTENT_MISSING",
      `Registry catalog contains metadata only for ${name}; ${location} must expose the full item.`
    )
    return validateRegistryItem(found, name)
  }

  async names(): Promise<string[]> {
    const bases = new Map<string, string | undefined>([[this.options.base, undefined]])
    for (const scope of Object.keys(this.options.config.registries ?? {})) {
      const base = registryDefinition(this.options.config, scope)
      if (base) bases.set(base, scope)
    }
    const names: string[] = []
    for (const [base, scope] of bases) {
      const catalog = await this.catalog(base)
      names.push(...catalog.items.map((item) => (scope ? `${scope}/${item.name}` : item.name)))
    }
    return [...new Set(names)].sort()
  }

  async hasLocalCatalog(): Promise<boolean> {
    const location = resourceLocation(
      this.options.base,
      undefined,
      this.options.channel,
      this.options.root
    )
    return !isUrl(location) && pathExists(location)
  }

  getSourceForItem(item: RegistryItem): string {
    return this.itemSources.get(item) ?? this.getBaseForItem(item.name)
  }
}
