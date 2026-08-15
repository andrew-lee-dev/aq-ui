import { execFile } from "node:child_process"
import { readFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import process from "node:process"
import { promisify } from "node:util"
import { fileURLToPath } from "node:url"

const execute = promisify(execFile)
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const manifest = JSON.parse(await readFile(resolve(packageRoot, "package.json"), "utf8"))

assert(manifest.name === "aq-ui", "The public package name must be aq-ui.")
assert(manifest.private !== true, "The CLI package must remain publishable.")
assert(manifest.license === "MIT", "The CLI package must declare MIT.")
assert(
  manifest.publishConfig?.access === "public",
  "The CLI package must publish with public access."
)
assert(manifest.publishConfig?.provenance === true, "The CLI package must require npm provenance.")
assert(
  manifest.repository?.url === "git+https://github.com/aq-ui/aq-ui.git" &&
    manifest.repository?.directory === "packages/cli",
  "The CLI package repository metadata is incomplete."
)

const npm = process.platform === "win32" ? "npm.cmd" : "npm"
const { stdout } = await execute(npm, ["pack", "--dry-run", "--json", "--ignore-scripts"], {
  cwd: packageRoot,
  maxBuffer: 10 * 1024 * 1024,
})
const reports = JSON.parse(stdout)
assert(Array.isArray(reports) && reports.length === 1, "npm pack returned an unexpected report.")

const report = reports[0]
assert(
  report.name === manifest.name && report.version === manifest.version,
  "Packed name/version differs from package.json."
)

const files = new Map(report.files.map((file) => [file.path, file]))
const requiredFiles = [
  "LICENSE",
  "README.md",
  "THIRD_PARTY_NOTICES.md",
  "dist/index.d.ts",
  "dist/index.js",
  "package.json",
]
for (const path of requiredFiles) {
  assert(files.has(path), `Packed artifact is missing ${path}.`)
}

for (const path of files.keys()) {
  const allowedMetadata = [
    "LICENSE",
    "README.md",
    "THIRD_PARTY_NOTICES.md",
    "package.json",
  ].includes(path)
  assert(allowedMetadata || path.startsWith("dist/"), `Unexpected file in packed artifact: ${path}`)
  assert(!path.includes(".test."), `Test artifact leaked into package: ${path}`)
}

const binary = files.get("dist/index.js")
assert((binary.mode & 0o111) !== 0, "The packed aq-ui binary is not executable.")
const binarySource = await readFile(resolve(packageRoot, "dist/index.js"), "utf8")
assert(
  binarySource.startsWith("#!/usr/bin/env node\n"),
  "The packed aq-ui binary is missing its Node.js shebang."
)

process.stdout.write(
  `npm pack verified ${report.id}: ${report.entryCount} files, ${report.size} bytes.\n`
)

function assert(condition, message) {
  if (!condition) throw new Error(message)
}
