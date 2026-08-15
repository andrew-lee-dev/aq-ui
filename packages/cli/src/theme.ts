import path from "node:path"

import { detectPackageManager, loadComponentsConfig } from "./config.js"
import { CliError, invariant } from "./errors.js"
import { commitFileOperations, readProjectFile } from "./fs.js"
import { aqNeutralTheme } from "./generated/aq-tailwind.js"
import { installPackages } from "./packages.js"
import type { FileOperation, PackageManager } from "./types.js"

const START_MARKER = "/* aq-ui theme:start */"
const END_MARKER = "/* aq-ui theme:end */"
const ANIMATION_IMPORT = '@import "tw-animate-css";'

const neutralTheme = `${START_MARKER}
${aqNeutralTheme}
${END_MARKER}`

export const themePresets = ["aq-neutral", "neutral"] as const

export function applyThemeBlock(source: string, block: string): string {
  const start = source.indexOf(START_MARKER)
  const end = source.indexOf(END_MARKER)
  if (start === -1 && end === -1) {
    return `${source.trimEnd()}${source.trim().length > 0 ? "\n\n" : ""}${block}\n`
  }
  invariant(
    start !== -1 && end !== -1 && end > start,
    "INVALID_THEME_BLOCK",
    "The existing aq-ui theme markers are incomplete."
  )
  return `${source.slice(0, start)}${block}${source.slice(end + END_MARKER.length)}`
}

export function ensureThemeImports(source: string): string {
  if (/^\s*@import\s+["']tw-animate-css["'];/mu.test(source)) return source
  const leadingImports = /^(?:\s*@import\s+[^;]+;\s*)+/u.exec(source)?.[0]
  const index = leadingImports?.length ?? 0
  const before = source.slice(0, index).trimEnd()
  const after = source.slice(index).trimStart()
  return `${before}${before ? "\n" : ""}${ANIMATION_IMPORT}\n${after}`
}

export interface ThemeResult {
  preset: string
  file: string
  changed: boolean
  dryRun: boolean
  packageManager?: PackageManager
}

interface InstallThemeOptions {
  dryRun: boolean
  skipDeps?: boolean
  packageManager?: PackageManager
  json?: boolean
}

export async function installTheme(
  root: string,
  preset: string,
  options: InstallThemeOptions
): Promise<ThemeResult> {
  if (!themePresets.includes(preset as (typeof themePresets)[number])) {
    throw new CliError("UNKNOWN_THEME", `Unknown theme ${preset}. Available: aq-neutral.`)
  }
  const config = await loadComponentsConfig(root)
  const cssPath = config.tailwind?.css
  invariant(cssPath, "CSS_NOT_CONFIGURED", "components.json does not define tailwind.css.")
  invariant(!path.isAbsolute(cssPath), "INVALID_CONFIG", "tailwind.css must be project-relative.")
  const current = (await readProjectFile(root, cssPath)) ?? ""
  const content = applyThemeBlock(ensureThemeImports(current), neutralTheme)
  const operation: FileOperation = {
    kind: "write",
    path: cssPath,
    content,
    item: "@aq-ui/theme",
  }
  const packageManager = options.packageManager ?? (await detectPackageManager(root))
  if (!options.dryRun && !options.skipDeps) {
    installPackages(root, packageManager, ["tw-animate-css"], false, options.json)
  }
  if (content !== current) await commitFileOperations(root, [operation], options.dryRun)
  return {
    preset: "aq-neutral",
    file: cssPath,
    changed: content !== current,
    dryRun: options.dryRun,
    ...(!options.skipDeps ? { packageManager } : {}),
  }
}
