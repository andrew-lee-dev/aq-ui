import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const stylesRoot = resolve(packageRoot, "../registry/src/styles")
const source = resolve(stylesRoot, "globals.css")
const utilitiesSource = resolve(stylesRoot, "aq-tailwind.css")
const output = resolve(packageRoot, "src/generated/aq-tailwind.ts")
const versionOutput = resolve(packageRoot, "src/generated/version.ts")
const packageJson = JSON.parse(await readFile(resolve(packageRoot, "package.json"), "utf8"))
const [globals, utilities] = await Promise.all([
  readFile(source, "utf8"),
  readFile(utilitiesSource, "utf8"),
])
const css = globals
  .replace('@import "./aq-tailwind.css";', utilities.trim())
  .replace(/^@import\s+[^;]+;\s*$/gmu, "")
  .replace(/^@source\s+[^;]+;\s*$/gmu, "")
  .trim()
const lines = css.split("\n").map((line) => `  ${JSON.stringify(line)},`)
const generated = `// Generated from packages/registry/src/styles/globals.css. Do not edit.\nexport const aqNeutralTheme = [\n${lines.join("\n")}\n].join("\\n")\n`

await mkdir(dirname(output), { recursive: true })
await Promise.all([
  writeFile(output, generated),
  writeFile(
    versionOutput,
    `// Generated from packages/cli/package.json. Do not edit.\nexport const VERSION = ${JSON.stringify(packageJson.version)}\n`
  ),
])
