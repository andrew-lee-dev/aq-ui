#!/usr/bin/env node

import { realpathSync } from "node:fs"
import { fileURLToPath } from "node:url"

export { runCli, parseArguments, helpText } from "./cli.js"
export { executeCommand } from "./commands.js"
export { loadComponentsConfig, loadManifest } from "./config.js"
export { CliError } from "./errors.js"
export { diffItems, installItems, removeItems, resolveItemGraph } from "./installer.js"
export { CODE_LANGUAGE_NAMES, DEFAULT_CODE_LANGUAGES, parseCodeLanguages } from "./languages.js"
export { RegistryClient, validateRegistryCatalog, validateRegistryItem } from "./registry.js"
export type { CodeLanguageName } from "./languages.js"
export type * from "./types.js"

import { runCli } from "./cli.js"

function isEntrypoint(): boolean {
  const entryPath = process.argv[1]
  if (!entryPath) return false

  try {
    // Package managers expose binaries through node_modules/.bin symlinks. Compare
    // canonical paths so the installed binary executes as well as a direct script.
    return realpathSync(entryPath) === realpathSync(fileURLToPath(import.meta.url))
  } catch {
    return false
  }
}

if (isEntrypoint()) {
  process.exitCode = await runCli()
}
