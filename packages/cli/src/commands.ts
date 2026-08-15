import { access, constants } from "node:fs/promises"
import path from "node:path"

import {
  COMPONENTS_FILE,
  DEFAULT_REGISTRY,
  MANIFEST_FILE,
  inferComponentsConfig,
  loadComponentsConfig,
  loadManifest,
  resolveAliasDirectory,
} from "./config.js"
import { CliError, asError, invariant } from "./errors.js"
import {
  commitFileOperations,
  currentFileHash,
  pathExists,
  readJsonFile,
  stringifyJson,
} from "./fs.js"
import { diffItems, installItems, removeItems } from "./installer.js"
import { DEFAULT_CODE_LANGUAGES } from "./languages.js"
import { RegistryClient } from "./registry.js"
import { installTheme } from "./theme.js"
import { MANIFEST_VERSION } from "./types.js"
import type {
  AqManifest,
  CommandResult,
  ComponentsConfig,
  FileOperation,
  GlobalOptions,
  RegistryItem,
} from "./types.js"

export interface ParsedCommand {
  name: string
  args: string[]
  all: boolean
  options: GlobalOptions
}

async function createClient(
  options: GlobalOptions,
  useInstalledSources = false
): Promise<{
  config: ComponentsConfig
  base: string
  client: RegistryClient
}> {
  const config = await loadComponentsConfig(options.cwd)
  const base = options.registry ?? config.registry ?? DEFAULT_REGISTRY
  const manifest = await loadManifest(options.cwd, {
    registry: base,
    channel: options.channel,
  })
  const sources = useInstalledSources
    ? Object.fromEntries(
        Object.entries(manifest.items).map(([name, item]) => [name, item.registry])
      )
    : undefined
  return {
    config,
    base,
    client: new RegistryClient({
      root: options.cwd,
      base,
      channel: options.channel,
      config,
      codeLanguages: options.languages ?? manifest.codeLanguages ?? DEFAULT_CODE_LANGUAGES,
      ...(sources ? { sources } : {}),
    }),
  }
}

async function createCatalogClient(options: GlobalOptions): Promise<RegistryClient> {
  const config = (await pathExists(path.join(options.cwd, COMPONENTS_FILE)))
    ? await loadComponentsConfig(options.cwd)
    : { aliases: {} }
  const base = options.registry ?? config.registry ?? DEFAULT_REGISTRY
  return new RegistryClient({
    root: options.cwd,
    base,
    channel: options.channel,
    config,
  })
}

function reconcileProjectRegistry(
  explicitRegistry: string | undefined,
  configRegistry: unknown,
  manifestRegistry: unknown
): string {
  if (explicitRegistry) return explicitRegistry
  if (
    typeof manifestRegistry === "string" &&
    manifestRegistry !== DEFAULT_REGISTRY &&
    (typeof configRegistry !== "string" || configRegistry === DEFAULT_REGISTRY)
  ) {
    return manifestRegistry
  }
  if (typeof configRegistry === "string") return configRegistry
  if (typeof manifestRegistry === "string") return manifestRegistry
  return DEFAULT_REGISTRY
}

async function initCommand(options: GlobalOptions): Promise<CommandResult> {
  invariant(await pathExists(options.cwd), "INVALID_CWD", `Directory not found: ${options.cwd}`)
  const configPath = path.join(options.cwd, COMPONENTS_FILE)
  const configExists = await pathExists(configPath)
  const currentConfig =
    configExists && !options.force
      ? await loadComponentsConfig(options.cwd)
      : await inferComponentsConfig(options.cwd)
  const manifestPath = path.join(options.cwd, MANIFEST_FILE)
  const manifestExists = await pathExists(manifestPath)
  const provisionalRegistry = options.registry ?? currentConfig.registry ?? DEFAULT_REGISTRY
  const currentManifest: AqManifest = manifestExists
    ? await loadManifest(options.cwd, {
        registry: provisionalRegistry,
        channel: options.channel,
      })
    : {
        version: MANIFEST_VERSION,
        channel: options.channel,
        registry: provisionalRegistry,
        items: {},
      }
  const registry = reconcileProjectRegistry(
    options.registry,
    currentConfig.registry,
    currentManifest.registry
  )
  const config =
    currentConfig.registry === registry ? currentConfig : { ...currentConfig, registry }
  const manifest =
    currentManifest.registry === registry ? currentManifest : { ...currentManifest, registry }
  const operations: FileOperation[] = []
  if (!configExists || options.force || currentConfig.registry !== registry) {
    operations.push({
      kind: "write",
      path: COMPONENTS_FILE,
      content: stringifyJson(config),
      item: "@aq-ui/config",
    })
  }
  if (!manifestExists || currentManifest.registry !== registry) {
    operations.push({
      kind: "write",
      path: MANIFEST_FILE,
      content: stringifyJson(manifest),
      item: "@aq-ui/manifest",
    })
  }
  await commitFileOperations(options.cwd, operations, options.dryRun)

  // Theme is initialized after components.json has been committed. In dry-run mode
  // report its destination without attempting to read a config that does not exist yet.
  let theme: unknown
  if (!options.dryRun || configExists) {
    theme = await installTheme(options.cwd, "aq-neutral", options)
  } else {
    theme = { preset: "aq-neutral", file: config.tailwind?.css, changed: true, dryRun: true }
  }
  return {
    ok: true,
    command: "init",
    data: {
      created: operations.map((operation) => operation.path),
      config: COMPONENTS_FILE,
      manifest: MANIFEST_FILE,
      theme,
      dryRun: options.dryRun,
    },
  }
}

async function listCommand(options: GlobalOptions): Promise<CommandResult> {
  const client = await createCatalogClient(options)
  const names = await client.names()
  return { ok: true, command: "list", data: { items: names, count: names.length } }
}

async function searchCommand(
  options: GlobalOptions,
  queryParts: readonly string[]
): Promise<CommandResult> {
  const query = queryParts.join(" ").trim().toLocaleLowerCase()
  invariant(query.length > 0, "QUERY_REQUIRED", "Provide a search query.")
  const client = await createCatalogClient(options)
  const catalog = await client.catalog()
  const items = catalog.items
    .filter((item) =>
      [item.name, item.title, item.description]
        .filter((value): value is string => typeof value === "string")
        .some((value) => value.toLocaleLowerCase().includes(query))
    )
    .map(itemSummary)
  return { ok: true, command: "search", data: { query, items, count: items.length } }
}

function itemSummary(item: RegistryItem): Record<string, unknown> {
  return {
    name: item.name,
    type: item.type,
    ...(item.title ? { title: item.title } : {}),
    ...(item.description ? { description: item.description } : {}),
    dependencies: item.dependencies ?? [],
    registryDependencies: item.registryDependencies ?? [],
  }
}

async function infoCommand(
  options: GlobalOptions,
  names: readonly string[]
): Promise<CommandResult> {
  invariant(names.length > 0, "ITEM_REQUIRED", "Provide at least one registry item.")
  const client = await createCatalogClient(options)
  const items = await Promise.all(names.map(async (name) => itemSummary(await client.item(name))))
  return { ok: true, command: "info", data: { items } }
}

async function addCommand(
  options: GlobalOptions,
  names: readonly string[],
  all: boolean
): Promise<CommandResult> {
  const { client } = await createClient(options)
  const requested = all
    ? (await client.catalog()).items
        .filter((item) => item.type !== "registry:style")
        .map((item) => item.name)
    : [...names]
  const data = await installItems({ options, client }, requested)
  return { ok: true, command: "add", data }
}

async function updateCommand(
  options: GlobalOptions,
  names: readonly string[]
): Promise<CommandResult> {
  const { client, base } = await createClient(options, !options.registry)
  const manifest = await loadManifest(options.cwd, { registry: base, channel: options.channel })
  const requested = names.length > 0 ? [...names] : Object.keys(manifest.items)
  invariant(requested.length > 0, "NOTHING_TO_UPDATE", "No aq-ui items are installed.")
  const data = await installItems({ options, client }, requested)
  return { ok: true, command: "update", data }
}

async function diffCommand(
  options: GlobalOptions,
  names: readonly string[]
): Promise<CommandResult> {
  const { client, base } = await createClient(options, !options.registry)
  const entries = await diffItems(
    options.cwd,
    names,
    { registry: base, channel: options.channel },
    client
  )
  return {
    ok: true,
    command: "diff",
    data: {
      entries,
      changed: entries.filter(
        (entry) =>
          entry.local !== "clean" || entry.upstream === "changed" || entry.upstream === "missing"
      ).length,
    },
  }
}

async function removeCommand(
  options: GlobalOptions,
  names: readonly string[]
): Promise<CommandResult> {
  const { base } = await createClient(options)
  const data = await removeItems(
    options.cwd,
    names,
    { registry: base, channel: options.channel },
    options
  )
  return { ok: true, command: "remove", data }
}

interface DoctorCheck {
  name: string
  status: "pass" | "warn" | "fail"
  message: string
}

async function doctorCommand(options: GlobalOptions): Promise<CommandResult> {
  const checks: DoctorCheck[] = []
  try {
    await access(options.cwd, constants.R_OK | constants.W_OK)
    checks.push({
      name: "project",
      status: "pass",
      message: "Project directory is readable and writable.",
    })
  } catch (error) {
    checks.push({ name: "project", status: "fail", message: asError(error).message })
  }

  let config: ComponentsConfig | undefined
  try {
    config = await loadComponentsConfig(options.cwd)
    checks.push({ name: "components.json", status: "pass", message: "Configuration is valid." })
    if (config.tailwind?.css) {
      const cssExists = await pathExists(path.join(options.cwd, config.tailwind.css))
      checks.push({
        name: "tailwind.css",
        status: cssExists ? "pass" : "warn",
        message: cssExists ? config.tailwind.css : `${config.tailwind.css} does not exist yet.`,
      })
    } else {
      checks.push({
        name: "tailwind.css",
        status: "fail",
        message: "tailwind.css is not configured.",
      })
    }
    for (const [name, alias] of Object.entries(config.aliases)) {
      if (!alias) continue
      try {
        const resolved = await resolveAliasDirectory(options.cwd, alias)
        checks.push({ name: `alias:${name}`, status: "pass", message: `${alias} -> ${resolved}` })
      } catch (error) {
        checks.push({ name: `alias:${name}`, status: "fail", message: asError(error).message })
      }
    }
  } catch (error) {
    checks.push({ name: "components.json", status: "fail", message: asError(error).message })
  }

  const base = options.registry ?? config?.registry ?? DEFAULT_REGISTRY
  try {
    const manifest = await loadManifest(options.cwd, { registry: base, channel: options.channel })
    let modified = 0
    let missing = 0
    for (const item of Object.values(manifest.items)) {
      for (const file of item.files) {
        const hash = await currentFileHash(options.cwd, file.path)
        if (hash === undefined) missing += 1
        else if (hash !== file.hash) modified += 1
      }
    }
    checks.push({
      name: "manifest",
      status: missing > 0 ? "warn" : "pass",
      message: `${Object.keys(manifest.items).length} items; ${modified} modified files; ${missing} missing files.`,
    })
  } catch (error) {
    checks.push({ name: "manifest", status: "fail", message: asError(error).message })
  }

  if (config) {
    try {
      const client = new RegistryClient({
        root: options.cwd,
        base,
        channel: options.channel,
        config,
      })
      const catalog = await client.catalog()
      checks.push({
        name: "registry",
        status: "pass",
        message: `${catalog.items.length} items available from ${base}.`,
      })
    } catch (error) {
      checks.push({ name: "registry", status: "warn", message: asError(error).message })
    }
  }

  const failed = checks.filter((check) => check.status === "fail").length
  const warnings = checks.filter((check) => check.status === "warn").length
  return {
    ok: failed === 0,
    command: "doctor",
    data: { healthy: failed === 0, checks, failed, warnings },
  }
}

async function themeCommand(
  options: GlobalOptions,
  args: readonly string[]
): Promise<CommandResult> {
  const preset = args[0] ?? "aq-neutral"
  const data = await installTheme(options.cwd, preset, options)
  return { ok: true, command: "theme", data }
}

async function migrateCommand(options: GlobalOptions): Promise<CommandResult> {
  const configPath = path.join(options.cwd, COMPONENTS_FILE)
  invariant(await pathExists(configPath), "CONFIG_NOT_FOUND", "Run aq-ui init first.")
  const rawConfig = await readJsonFile<Record<string, unknown>>(configPath)
  const manifestPath = path.join(options.cwd, MANIFEST_FILE)
  const manifestExists = await pathExists(manifestPath)
  const rawManifest = manifestExists
    ? await readJsonFile<Record<string, unknown>>(manifestPath)
    : undefined
  const registry = reconcileProjectRegistry(
    options.registry,
    rawConfig.registry,
    rawManifest?.registry
  )
  const nextConfig: Record<string, unknown> = {
    $schema: "https://ui.shadcn.com/schema.json",
    ...rawConfig,
    registry,
  }
  if (nextConfig.rtl === undefined) nextConfig.rtl = true

  let nextManifest: AqManifest
  if (rawManifest) {
    nextManifest = {
      version: MANIFEST_VERSION,
      channel: typeof rawManifest.channel === "string" ? rawManifest.channel : options.channel,
      registry,
      items:
        typeof rawManifest.items === "object" && rawManifest.items !== null
          ? (rawManifest.items as AqManifest["items"])
          : {},
      ...(Array.isArray(rawManifest.codeLanguages)
        ? {
            codeLanguages: rawManifest.codeLanguages as AqManifest["codeLanguages"],
          }
        : {}),
    }
  } else {
    nextManifest = {
      version: MANIFEST_VERSION,
      channel: options.channel,
      registry,
      items: {},
    }
  }

  const operations: FileOperation[] = []
  const currentConfig = stringifyJson(rawConfig)
  const migratedConfig = stringifyJson(nextConfig)
  if (currentConfig !== migratedConfig) {
    operations.push({
      kind: "write",
      path: COMPONENTS_FILE,
      content: migratedConfig,
      item: "migration",
    })
  }
  const currentManifest = manifestExists ? stringifyJson(rawManifest) : ""
  const migratedManifest = stringifyJson(nextManifest)
  if (currentManifest !== migratedManifest) {
    operations.push({
      kind: "write",
      path: MANIFEST_FILE,
      content: migratedManifest,
      item: "migration",
    })
  }
  await commitFileOperations(options.cwd, operations, options.dryRun)
  return {
    ok: true,
    command: "migrate",
    data: { migrations: operations.map((operation) => operation.path), dryRun: options.dryRun },
  }
}

export async function executeCommand(parsed: ParsedCommand): Promise<CommandResult> {
  switch (parsed.name) {
    case "init":
      invariant(parsed.args.length === 0, "UNEXPECTED_ARGUMENT", "aq-ui init takes no arguments.")
      return initCommand(parsed.options)
    case "add":
      invariant(
        !(parsed.all && parsed.args.length > 0),
        "UNEXPECTED_ARGUMENT",
        "Use item names or --all, not both."
      )
      return addCommand(parsed.options, parsed.args, parsed.all)
    case "list":
      invariant(parsed.args.length === 0, "UNEXPECTED_ARGUMENT", "aq-ui list takes no arguments.")
      return listCommand(parsed.options)
    case "search":
      return searchCommand(parsed.options, parsed.args)
    case "info":
      return infoCommand(parsed.options, parsed.args)
    case "diff":
      return diffCommand(parsed.options, parsed.args)
    case "update":
      return updateCommand(parsed.options, parsed.args)
    case "remove":
      return removeCommand(parsed.options, parsed.args)
    case "doctor":
      invariant(parsed.args.length === 0, "UNEXPECTED_ARGUMENT", "aq-ui doctor takes no arguments.")
      return doctorCommand(parsed.options)
    case "theme":
      invariant(parsed.args.length <= 1, "UNEXPECTED_ARGUMENT", "aq-ui theme accepts one preset.")
      return themeCommand(parsed.options, parsed.args)
    case "migrate":
      invariant(
        parsed.args.length === 0,
        "UNEXPECTED_ARGUMENT",
        "aq-ui migrate takes no arguments."
      )
      return migrateCommand(parsed.options)
    default:
      throw new CliError("UNKNOWN_COMMAND", `Unknown command: ${parsed.name}`)
  }
}
