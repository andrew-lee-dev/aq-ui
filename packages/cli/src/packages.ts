import { spawnSync } from "node:child_process"

import { CliError, invariant } from "./errors.js"
import type { PackageManager } from "./types.js"

function validatePackageSpec(spec: string): void {
  invariant(
    spec.length > 0 && !spec.startsWith("-") && !/[\0\r\n\t ]/.test(spec),
    "INVALID_DEPENDENCY",
    `Unsafe dependency specifier from registry: ${JSON.stringify(spec)}`
  )
}

function installArguments(
  manager: PackageManager,
  dependencies: readonly string[],
  dev: boolean
): string[] {
  const development = dev ? [manager === "npm" ? "--save-dev" : "--dev"] : []
  switch (manager) {
    case "pnpm":
      return ["add", "--ignore-scripts", ...development, "--", ...dependencies]
    case "npm":
      return ["install", "--ignore-scripts", ...development, "--", ...dependencies]
    case "yarn":
      return ["add", ...development, ...dependencies]
    case "bun":
      return ["add", "--ignore-scripts", ...development, ...dependencies]
  }
}

export function installPackages(
  root: string,
  manager: PackageManager,
  dependencies: readonly string[],
  dev = false,
  quiet = false
): void {
  const unique = [...new Set(dependencies)].sort()
  if (unique.length === 0) return
  unique.forEach(validatePackageSpec)
  const args = installArguments(manager, unique, dev)
  const result = spawnSync(manager, args, {
    cwd: root,
    env: {
      ...process.env,
      npm_config_ignore_scripts: "true",
      YARN_ENABLE_SCRIPTS: "false",
    },
    stdio: quiet ? "pipe" : "inherit",
    encoding: quiet ? "utf8" : undefined,
    shell: false,
  })
  if (result.error) {
    throw new CliError("PACKAGE_MANAGER_FAILED", `Unable to run ${manager}.`, result.error.message)
  }
  if (result.status !== 0) {
    const stderr = typeof result.stderr === "string" ? result.stderr.trim() : undefined
    throw new CliError(
      "PACKAGE_MANAGER_FAILED",
      `${manager} exited with status ${String(result.status)} while installing dependencies.`,
      stderr
    )
  }
}
