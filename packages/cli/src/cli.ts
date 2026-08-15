import path from "node:path"

import { executeCommand } from "./commands.js"
import { CliError, asError } from "./errors.js"
import { VERSION } from "./generated/version.js"
import { parseCodeLanguages } from "./languages.js"
import type { CommandResult, GlobalOptions, PackageManager } from "./types.js"
const COMMANDS = new Set([
  "init",
  "add",
  "list",
  "search",
  "info",
  "diff",
  "update",
  "remove",
  "doctor",
  "theme",
  "migrate",
])

export const helpText = `aq-ui ${VERSION}

Usage:
  aq-ui init [options]
  aq-ui add <items...> [--all] [--languages <csv>] [options]
  aq-ui list [options]
  aq-ui search <query> [options]
  aq-ui info <items...> [options]
  aq-ui diff [items...] [options]
  aq-ui update [items...] [options]
  aq-ui remove <items...> [options]
  aq-ui doctor [options]
  aq-ui theme [aq-neutral] [options]
  aq-ui migrate [options]

Options:
  --cwd <path>                 Project directory (default: current directory)
  --registry <url-or-path>     Override the default registry
  --channel <name>             Registry channel (default: stable)
  --package-manager <name>     pnpm, npm, yarn, or bun
  --languages <csv>            Code languages for editor items (add only)
  --dry-run                    Validate and show changes without writing
  --force                      Overwrite locally modified files
  --skip-deps                  Do not install npm dependencies
  --json                       Print machine-readable JSON
  -y, --yes                    Accept non-destructive defaults
  -h, --help                   Show help
  -v, --version                Show version
`

interface ParseResult {
  help?: boolean
  version?: boolean
  parsed?: {
    name: string
    args: string[]
    all: boolean
    options: GlobalOptions
  }
}

function optionValue(
  argv: readonly string[],
  index: number,
  flag: string
): { value: string; consumed: number } {
  const argument = argv[index] ?? ""
  const equals = argument.indexOf("=")
  if (equals !== -1) return { value: argument.slice(equals + 1), consumed: 0 }
  const value = argv[index + 1]
  if (!value || value.startsWith("-"))
    throw new CliError("OPTION_VALUE_REQUIRED", `${flag} needs a value.`)
  return { value, consumed: 1 }
}

export function parseArguments(argv: readonly string[], processCwd = process.cwd()): ParseResult {
  let command: string | undefined
  const args: string[] = []
  let all = false
  let cwd = processCwd
  let registry: string | undefined
  let channel = "stable"
  let packageManager: PackageManager | undefined
  let languages: GlobalOptions["languages"]
  let dryRun = false
  let force = false
  let json = false
  let yes = false
  let skipDeps = false

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index] ?? ""
    if (argument === "--help" || argument === "-h") return { help: true }
    if (argument === "--version" || argument === "-v") return { version: true }
    if (argument === "--all") {
      all = true
      continue
    }
    if (argument === "--dry-run") {
      dryRun = true
      continue
    }
    if (argument === "--force" || argument === "-f") {
      force = true
      continue
    }
    if (argument === "--json") {
      json = true
      continue
    }
    if (argument === "--yes" || argument === "-y") {
      yes = true
      continue
    }
    if (argument === "--skip-deps" || argument === "--no-deps") {
      skipDeps = true
      continue
    }
    if (argument === "--cwd" || argument.startsWith("--cwd=")) {
      const result = optionValue(argv, index, "--cwd")
      cwd = result.value
      index += result.consumed
      continue
    }
    if (argument === "--registry" || argument.startsWith("--registry=")) {
      const result = optionValue(argv, index, "--registry")
      registry = result.value
      index += result.consumed
      continue
    }
    if (argument === "--channel" || argument.startsWith("--channel=")) {
      const result = optionValue(argv, index, "--channel")
      channel = result.value
      index += result.consumed
      continue
    }
    if (argument === "--package-manager" || argument.startsWith("--package-manager=")) {
      const result = optionValue(argv, index, "--package-manager")
      if (!["pnpm", "npm", "yarn", "bun"].includes(result.value)) {
        throw new CliError(
          "INVALID_PACKAGE_MANAGER",
          `Unsupported package manager: ${result.value}`
        )
      }
      packageManager = result.value as PackageManager
      index += result.consumed
      continue
    }
    if (argument === "--languages" || argument.startsWith("--languages=")) {
      const result = optionValue(argv, index, "--languages")
      languages = parseCodeLanguages(result.value)
      index += result.consumed
      continue
    }
    if (argument.startsWith("-"))
      throw new CliError("UNKNOWN_OPTION", `Unknown option: ${argument}`)
    if (!command) command = argument
    else args.push(argument)
  }

  if (!command) return { help: true }
  if (!COMMANDS.has(command)) throw new CliError("UNKNOWN_COMMAND", `Unknown command: ${command}`)
  if (all && command !== "add")
    throw new CliError("INVALID_OPTION", "--all is only valid with aq-ui add.")
  if (languages && command !== "add") {
    throw new CliError("INVALID_OPTION", "--languages is only valid with aq-ui add.")
  }
  return {
    parsed: {
      name: command,
      args,
      all,
      options: {
        cwd: path.resolve(processCwd, cwd),
        ...(registry ? { registry } : {}),
        channel,
        ...(packageManager ? { packageManager } : {}),
        dryRun,
        force,
        json,
        yes,
        skipDeps,
        ...(languages ? { languages } : {}),
      },
    },
  }
}

function humanize(result: CommandResult): string {
  if (result.command === "list") {
    const data = result.data as { items: string[]; count: number }
    return `${data.items.join("\n")}\n\n${data.count} registry items`
  }
  if (result.command === "doctor") {
    const data = result.data as {
      checks: Array<{ name: string; status: string; message: string }>
      failed: number
      warnings: number
    }
    const checks = data.checks.map(
      (check) =>
        `${check.status === "pass" ? "✓" : check.status === "warn" ? "!" : "✗"} ${check.name}: ${check.message}`
    )
    return `${checks.join("\n")}\n\n${data.failed} failed, ${data.warnings} warnings`
  }
  return JSON.stringify(result.data, null, 2)
}

export interface Io {
  stdout(message: string): void
  stderr(message: string): void
}

const defaultIo: Io = {
  stdout: (message) => process.stdout.write(`${message}\n`),
  stderr: (message) => process.stderr.write(`${message}\n`),
}

export async function runCli(
  argv: readonly string[] = process.argv.slice(2),
  io: Io = defaultIo
): Promise<number> {
  let wantsJson = argv.includes("--json")
  try {
    const parsed = parseArguments(argv)
    if (parsed.help) {
      io.stdout(helpText.trimEnd())
      return 0
    }
    if (parsed.version) {
      io.stdout(VERSION)
      return 0
    }
    if (!parsed.parsed) return 0
    wantsJson = parsed.parsed.options.json
    const result = await executeCommand(parsed.parsed)
    io.stdout(wantsJson ? JSON.stringify(result, null, 2) : humanize(result))
    return result.ok ? 0 : 1
  } catch (error) {
    const resolved = asError(error)
    const payload = {
      ok: false,
      error: {
        code: error instanceof CliError ? error.code : "UNEXPECTED_ERROR",
        message: resolved.message,
        ...(error instanceof CliError && error.details !== undefined
          ? { details: error.details }
          : {}),
      },
    }
    io.stderr(wantsJson ? JSON.stringify(payload, null, 2) : `Error: ${resolved.message}`)
    return 1
  }
}
