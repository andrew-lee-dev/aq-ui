import { readdir } from "node:fs/promises"
import path from "node:path"
import ts from "typescript"

import { CliError, invariant } from "./errors.js"
import { findUp, normalizeRelativePath, pathExists, readJsonFile } from "./fs.js"
import { isCodeLanguageName } from "./languages.js"
import type {
  AqManifest,
  ComponentsConfig,
  PackageManager,
  RegistryFile,
  RegistryItemType,
} from "./types.js"
import { MANIFEST_VERSION } from "./types.js"

export const COMPONENTS_FILE = "components.json"
export const MANIFEST_FILE = ".aq-ui/manifest.json"
export const DEFAULT_REGISTRY = "https://andrew-lee-dev.github.io/aq-ui/r"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function validateComponentsConfig(value: unknown): ComponentsConfig {
  invariant(isRecord(value), "INVALID_CONFIG", "components.json must contain an object.")
  invariant(isRecord(value.aliases), "INVALID_CONFIG", "components.json must define aliases.")
  for (const [name, alias] of Object.entries(value.aliases)) {
    invariant(typeof alias === "string", "INVALID_CONFIG", `Alias ${name} must be a string.`)
  }
  if (value.registry !== undefined) {
    invariant(typeof value.registry === "string", "INVALID_CONFIG", "registry must be a string.")
  }
  if (value.registries !== undefined) {
    invariant(isRecord(value.registries), "INVALID_CONFIG", "registries must be an object.")
  }
  return value as unknown as ComponentsConfig
}

export async function loadComponentsConfig(root: string): Promise<ComponentsConfig> {
  const filePath = path.join(root, COMPONENTS_FILE)
  if (!(await pathExists(filePath))) {
    throw new CliError(
      "CONFIG_NOT_FOUND",
      `No ${COMPONENTS_FILE} found in ${root}. Run "aq-ui init" first.`
    )
  }
  return validateComponentsConfig(await readJsonFile(filePath))
}

export async function loadManifest(
  root: string,
  defaults: { registry: string; channel: string }
): Promise<AqManifest> {
  const filePath = path.join(root, MANIFEST_FILE)
  if (!(await pathExists(filePath))) {
    return {
      version: MANIFEST_VERSION,
      registry: defaults.registry,
      channel: defaults.channel,
      items: {},
    }
  }

  const value = await readJsonFile<unknown>(filePath)
  invariant(isRecord(value), "INVALID_MANIFEST", "The aq-ui manifest must be an object.")
  invariant(value.version === MANIFEST_VERSION, "MANIFEST_MIGRATION_REQUIRED", "Run aq-ui migrate.")
  invariant(isRecord(value.items), "INVALID_MANIFEST", "The aq-ui manifest has invalid items.")
  if (value.codeLanguages !== undefined) {
    invariant(
      Array.isArray(value.codeLanguages) &&
        value.codeLanguages.length > 0 &&
        value.codeLanguages.every(
          (language) => typeof language === "string" && isCodeLanguageName(language)
        ) &&
        value.codeLanguages.includes("plaintext") &&
        new Set(value.codeLanguages).size === value.codeLanguages.length,
      "INVALID_MANIFEST",
      "The aq-ui manifest has an invalid codeLanguages selection."
    )
  }
  return value as unknown as AqManifest
}

export async function inferComponentsConfig(root: string): Promise<ComponentsConfig> {
  const packageFile = path.join(root, "package.json")
  const packageJson = (await pathExists(packageFile))
    ? await readJsonFile<{
        dependencies?: Record<string, string>
        devDependencies?: Record<string, string>
      }>(packageFile)
    : {}
  const allDependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }
  const usesNext = typeof allDependencies.next === "string"
  const usesTypeScript = await pathExists(path.join(root, "tsconfig.json"))
  const usesSrc = await pathExists(path.join(root, "src"))
  const aliases = await inferProjectAliases(root, usesSrc)
  const cssCandidates = [
    "src/app/globals.css",
    "app/globals.css",
    "src/styles/globals.css",
    "styles/globals.css",
    "src/index.css",
    "index.css",
  ]
  const css =
    (await firstExisting(root, cssCandidates)) ??
    (usesSrc ? "src/styles/globals.css" : "styles/globals.css")

  return {
    $schema: "https://ui.shadcn.com/schema.json",
    style: "aq-neutral",
    rsc: usesNext,
    tsx: usesTypeScript,
    tailwind: {
      config: "",
      css,
      baseColor: "neutral",
      cssVariables: true,
    },
    iconLibrary: "lucide",
    aliases,
    rtl: true,
    registry: DEFAULT_REGISTRY,
  }
}

async function firstExisting(
  root: string,
  candidates: readonly string[]
): Promise<string | undefined> {
  for (const candidate of candidates) {
    if (await pathExists(path.join(root, candidate))) return candidate
  }
  return undefined
}

interface TsConfigShape {
  compilerOptions?: {
    baseUrl?: string
    paths?: Record<string, string[]>
    pathsBasePath?: string
  }
}

const tsConfigCache = new Map<string, TsConfigShape | undefined>()

async function loadTsConfig(
  root: string
): Promise<{ file: string; config: TsConfigShape } | undefined> {
  const file = await findUp(root, ["tsconfig.json", "jsconfig.json"])
  if (!file) return undefined
  if (!tsConfigCache.has(file)) {
    const parsed = ts.getParsedCommandLineOfConfigFile(
      file,
      {},
      {
        ...ts.sys,
        onUnRecoverableConfigFileDiagnostic: () => undefined,
      }
    )
    const options = parsed?.options as (ts.CompilerOptions & { pathsBasePath?: string }) | undefined
    tsConfigCache.set(
      file,
      options
        ? {
            compilerOptions: {
              ...(options.baseUrl ? { baseUrl: options.baseUrl } : {}),
              ...(options.paths ? { paths: options.paths } : {}),
              ...(options.pathsBasePath ? { pathsBasePath: options.pathsBasePath } : {}),
            },
          }
        : undefined
    )
  }
  const config = tsConfigCache.get(file)
  return config ? { file, config } : undefined
}

function tsConfigMappingRoot(file: string, config: TsConfigShape): string {
  const options = config.compilerOptions
  return path.resolve(options?.pathsBasePath ?? path.dirname(file), options?.baseUrl ?? ".")
}

interface ReversePathMapping {
  alias: string
  score: number
}

function reversePathMapping(
  absoluteTarget: string,
  key: string,
  target: string,
  mappingRoot: string
): ReversePathMapping | undefined {
  const keyStars = (key.match(/\*/g) ?? []).length
  const targetStars = (target.match(/\*/g) ?? []).length
  if (keyStars !== targetStars || keyStars > 1) return undefined

  if (keyStars === 0) {
    return path.resolve(mappingRoot, target) === absoluteTarget
      ? { alias: key, score: target.length + key.length }
      : undefined
  }

  const marker = "__AQ_UI_PATH_WILDCARD__"
  if (target.includes(marker)) return undefined
  const targetPattern = path.resolve(mappingRoot, target.replace("*", marker))
  const markerIndex = targetPattern.indexOf(marker)
  if (markerIndex === -1) return undefined
  const prefix = targetPattern.slice(0, markerIndex)
  const suffix = targetPattern.slice(markerIndex + marker.length)
  if (!absoluteTarget.startsWith(prefix) || !absoluteTarget.endsWith(suffix)) return undefined

  const capturedEnd = absoluteTarget.length - suffix.length
  if (capturedEnd < prefix.length) return undefined
  const captured = absoluteTarget.slice(prefix.length, capturedEnd).split(path.sep).join("/")
  const alias = key.replace("*", captured).replace(/\/$/u, "")
  if (!alias || path.isAbsolute(alias) || alias.split("/").includes("..")) return undefined
  return { alias, score: prefix.length + suffix.length + key.replace("*", "").length }
}

function inferAliasFromPaths(
  root: string,
  relativeTarget: string,
  tsconfig: { file: string; config: TsConfigShape } | undefined
): string | undefined {
  const mappings = tsconfig?.config.compilerOptions?.paths
  if (!mappings) return undefined
  const mappingRoot = tsConfigMappingRoot(tsconfig.file, tsconfig.config)
  const absoluteTarget = path.resolve(root, relativeTarget)
  const candidates: ReversePathMapping[] = []
  for (const [key, targets] of Object.entries(mappings)) {
    const target = targets[0]
    if (!target) continue
    const candidate = reversePathMapping(absoluteTarget, key, target, mappingRoot)
    if (candidate) candidates.push(candidate)
  }
  return candidates.sort((left, right) => right.score - left.score)[0]?.alias
}

async function inferProjectAliases(
  root: string,
  usesSrc: boolean
): Promise<ComponentsConfig["aliases"]> {
  const tsconfig = await loadTsConfig(root)
  const sourceRoot = usesSrc ? "src/" : ""
  const fallbackBase = usesSrc ? "@/" : ""
  const infer = (target: string, fallback: string): string =>
    inferAliasFromPaths(root, `${sourceRoot}${target}`, tsconfig) ?? `${fallbackBase}${fallback}`

  return {
    components: infer("components", "components"),
    hooks: infer("hooks", "hooks"),
    lib: infer("lib", "lib"),
    utils: infer("lib/utils", "lib/utils"),
    ui: infer("components/ui", "components/ui"),
  }
}

function applyPathMapping(alias: string, key: string, target: string): string | undefined {
  const starIndex = key.indexOf("*")
  if (starIndex === -1) return key === alias ? target : undefined
  const prefix = key.slice(0, starIndex)
  const suffix = key.slice(starIndex + 1)
  if (!alias.startsWith(prefix) || !alias.endsWith(suffix)) return undefined
  const captured = alias.slice(prefix.length, alias.length - suffix.length)
  return target.replace("*", captured)
}

function pathMappingSpecificity(key: string): number {
  return key.includes("*") ? key.replace("*", "").length : Number.MAX_SAFE_INTEGER
}

export async function resolveAliasDirectory(root: string, alias: string): Promise<string> {
  invariant(alias.length > 0, "INVALID_ALIAS", "An empty component alias cannot be resolved.")
  invariant(!path.isAbsolute(alias), "INVALID_ALIAS", `Absolute alias is not allowed: ${alias}`)

  const tsconfig = await loadTsConfig(root)
  const mappings = tsconfig?.config.compilerOptions?.paths
  if (mappings) {
    const candidates = Object.entries(mappings)
      .map(([key, targets]) => {
        const target = targets[0]
        const mapped = target ? applyPathMapping(alias, key, target) : undefined
        return mapped ? { key, mapped } : undefined
      })
      .filter((candidate): candidate is { key: string; mapped: string } => Boolean(candidate))
      .sort((left, right) => pathMappingSpecificity(right.key) - pathMappingSpecificity(left.key))
    for (const { mapped } of candidates) {
      const mappingRoot = tsConfigMappingRoot(tsconfig.file, tsconfig.config)
      const absolute = path.resolve(mappingRoot, mapped)
      invariant(
        absolute === root || absolute.startsWith(`${path.resolve(root)}${path.sep}`),
        "INVALID_ALIAS",
        `Alias resolves outside the project: ${alias}`
      )
      return normalizeRelativePath(path.relative(root, absolute))
    }
  }

  if (alias.startsWith("@/") || alias.startsWith("~/")) {
    const tail = alias.slice(2)
    const srcCandidate = `src/${tail}`
    return normalizeRelativePath((await pathExists(path.join(root, "src"))) ? srcCandidate : tail)
  }

  invariant(
    !alias.startsWith("@"),
    "INVALID_ALIAS",
    `Cannot map package alias ${alias} to a project directory. Add a target to the registry file.`
  )
  return normalizeRelativePath(alias.replace(/^\.\//, ""))
}

function aliasForType(
  config: ComponentsConfig,
  type: RegistryItemType | undefined
): string | undefined {
  switch (type) {
    case "registry:ui":
      return config.aliases.ui ?? config.aliases.components
    case "registry:hook":
      return config.aliases.hooks
    case "registry:lib":
      return config.aliases.lib
    case "registry:block":
    case "registry:component":
    case "registry:page":
      return config.aliases.components
    default:
      return config.aliases.components
  }
}

export async function resolveRegistryFileTarget(
  root: string,
  config: ComponentsConfig,
  file: RegistryFile,
  itemType: RegistryItemType
): Promise<string> {
  if (file.target) {
    const placeholders: Array<[string, string | undefined]> = [
      ["@components/", config.aliases.components],
      ["@ui/", config.aliases.ui ?? config.aliases.components],
      ["@hooks/", config.aliases.hooks],
      ["@lib/", config.aliases.lib],
    ]
    const placeholder = placeholders.find(([prefix]) => file.target?.startsWith(prefix))
    if (placeholder) {
      const [prefix, alias] = placeholder
      invariant(
        alias,
        "INVALID_CONFIG",
        `No destination alias configured for ${prefix.slice(0, -1)}.`
      )
      const directory = await resolveAliasDirectory(root, alias)
      return normalizeRelativePath(path.posix.join(directory, file.target.slice(prefix.length)))
    }
    return normalizeRelativePath(file.target)
  }
  const type = file.type ?? itemType
  if ((type === "registry:style" || type === "registry:theme") && config.tailwind?.css) {
    return normalizeRelativePath(config.tailwind.css)
  }
  const portablePath = file.path.replaceAll("\\", "/")
  const basename = path.posix.basename(portablePath)
  if (type === "registry:lib" && config.aliases.utils && /^utils\.[cm]?[jt]sx?$/u.test(basename)) {
    const utilityTarget = await resolveAliasDirectory(root, config.aliases.utils)
    const sourceExtension = basename.slice("utils".length)
    const target = /\.[cm]?[jt]sx?$/u.test(utilityTarget)
      ? utilityTarget
      : `${utilityTarget}${sourceExtension}`
    return normalizeRelativePath(target)
  }
  const alias = aliasForType(config, type)
  invariant(alias, "INVALID_CONFIG", `No destination alias configured for ${type}.`)
  const directory = await resolveAliasDirectory(root, alias)
  return normalizeRelativePath(
    path.posix.join(directory, path.posix.basename(file.path.replaceAll("\\", "/")))
  )
}

export async function detectPackageManager(root: string): Promise<PackageManager> {
  const lockFiles: Array<[string, PackageManager]> = [
    ["pnpm-lock.yaml", "pnpm"],
    ["yarn.lock", "yarn"],
    ["bun.lock", "bun"],
    ["bun.lockb", "bun"],
    ["package-lock.json", "npm"],
  ]
  for (const [file, manager] of lockFiles) {
    if (await findUp(root, file)) return manager
  }

  const packageFile = await findUp(root, "package.json")
  if (packageFile) {
    const packageJson = await readJsonFile<{ packageManager?: string }>(packageFile)
    const manager = packageJson.packageManager?.split("@")[0]
    if (manager === "pnpm" || manager === "npm" || manager === "yarn" || manager === "bun") {
      return manager
    }
  }
  return "npm"
}

export async function listFilesRecursively(root: string): Promise<string[]> {
  const result: string[] = []
  if (!(await pathExists(root))) return result
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const entryPath = path.join(root, entry.name)
    if (entry.isDirectory()) result.push(...(await listFilesRecursively(entryPath)))
    else if (entry.isFile()) result.push(entryPath)
  }
  return result
}
