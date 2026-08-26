import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { parseArguments, runCli } from "./cli.js"
import { DEFAULT_REGISTRY, loadManifest, resolveRegistryFileTarget } from "./config.js"
import { CliError } from "./errors.js"
import {
  commitFileOperations,
  hashContent,
  normalizeRelativePath,
  resolveSafePath,
  stripJsonComments,
} from "./fs.js"
import { diffItems, installItems, removeItems } from "./installer.js"
import { codeLanguagePresetContent } from "./languages.js"
import { RegistryClient } from "./registry.js"
import { applyThemeBlock, ensureThemeImports } from "./theme.js"
import { rewriteRegistryImports } from "./transform.js"
import type { GlobalOptions } from "./types.js"

test("uses the public GitHub Pages registry by default", () => {
  assert.equal(DEFAULT_REGISTRY, "https://andrew-lee-dev.github.io/aq-ui/r")
})

async function temporaryDirectory(t: test.TestContext): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), "aq-ui-cli-"))
  t.after(async () => rm(directory, { force: true, recursive: true }))
  return directory
}

test("parseArguments accepts global options before and after a command", () => {
  const result = parseArguments(
    ["--json", "add", "button", "--cwd", "fixture", "--dry-run", "--skip-deps"],
    "/project"
  )
  assert.equal(result.parsed?.name, "add")
  assert.deepEqual(result.parsed?.args, ["button"])
  assert.equal(result.parsed?.options.cwd, "/project/fixture")
  assert.equal(result.parsed?.options.json, true)
  assert.equal(result.parsed?.options.dryRun, true)
  assert.equal(result.parsed?.options.skipDeps, true)
})

test("parseArguments normalizes a granular CodeMirror language selection", () => {
  const result = parseArguments(["add", "code-editor", "--languages", "ts,json,yml,ts"])

  assert.deepEqual(result.parsed?.options.languages, ["plaintext", "typescript", "json", "yaml"])
})

test("parseArguments rejects invalid or misplaced language selections", () => {
  assert.throws(
    () => parseArguments(["add", "code-editor", "--languages", "rust"]),
    (error: unknown) => error instanceof CliError && error.code === "INVALID_LANGUAGE"
  )
  assert.throws(
    () => parseArguments(["update", "--languages", "typescript"]),
    (error: unknown) => error instanceof CliError && error.code === "INVALID_OPTION"
  )
})

test("reports the package version", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8")
  )
  const stdout: string[] = []
  assert.equal(
    await runCli(["--version"], {
      stdout: (message) => stdout.push(message),
      stderr: () => undefined,
    }),
    0
  )
  assert.deepEqual(stdout, [packageJson.version])
})

test("installed binary executes through a package-manager symlink", async (t) => {
  const directory = await temporaryDirectory(t)
  const binary = path.join(directory, "aq-ui")
  await symlink(new URL("./index.js", import.meta.url), binary, "file")

  const result = spawnSync(process.execPath, [binary, "--version"], {
    encoding: "utf8",
  })
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8")
  )

  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout.trim(), packageJson.version)
})

test("parseArguments rejects command-specific flags in the wrong command", () => {
  assert.throws(
    () => parseArguments(["list", "--all"]),
    (error: unknown) => {
      assert.ok(error instanceof CliError)
      return error.code === "INVALID_OPTION"
    }
  )
})

test("JSONC parser preserves comment-like text in strings", () => {
  const source = `{
    // comment
    "url": "https://example.test/a/*b*/", /* another comment */
    "items": ["a",],
  }`
  assert.deepEqual(JSON.parse(stripJsonComments(source)), {
    url: "https://example.test/a/*b*/",
    items: ["a"],
  })
})

test("safe paths reject traversal, absolute paths, and symlink ancestors", async (t) => {
  assert.throws(() => normalizeRelativePath("../secret"), /traversal/)
  assert.throws(() => normalizeRelativePath("/secret"), /Absolute/)
  const root = await temporaryDirectory(t)
  const outside = await temporaryDirectory(t)
  await symlink(outside, path.join(root, "linked"), "dir")
  await assert.rejects(resolveSafePath(root, "linked/file.ts"), /symlink/)
})

test("file transaction rolls back writes when a later target is invalid", async (t) => {
  const root = await temporaryDirectory(t)
  await writeFile(path.join(root, "kept.txt"), "original")
  await mkdir(path.join(root, "directory"))
  await assert.rejects(
    commitFileOperations(
      root,
      [
        { kind: "write", path: "kept.txt", content: "changed", item: "fixture" },
        { kind: "write", path: "directory", content: "invalid", item: "fixture" },
      ],
      false
    ),
    /rolled back/
  )
  assert.equal(await readFile(path.join(root, "kept.txt"), "utf8"), "original")
})

test("theme marker replacement is idempotent", () => {
  const first = applyThemeBlock(
    "@import 'tailwindcss';\n",
    "/* aq-ui theme:start */\na\n/* aq-ui theme:end */"
  )
  const second = applyThemeBlock(first, "/* aq-ui theme:start */\nb\n/* aq-ui theme:end */")
  assert.equal((second.match(/aq-ui theme:start/g) ?? []).length, 1)
  assert.match(second, /\nb\n/)
  assert.doesNotMatch(second, /\na\n/)
})

test("theme imports are inserted once after existing CSS imports", () => {
  const first = ensureThemeImports('@import "tailwindcss";\nbody {}\n')
  const second = ensureThemeImports(first)
  assert.match(first, /^@import "tailwindcss";\n@import "tw-animate-css";\n/u)
  assert.equal((second.match(/tw-animate-css/g) ?? []).length, 1)
})

test("init detects a Next TypeScript project and is idempotent", async (t) => {
  const project = await temporaryDirectory(t)
  await mkdir(path.join(project, "src/app"), { recursive: true })
  await writeFile(
    path.join(project, "package.json"),
    JSON.stringify({ name: "next-fixture", dependencies: { next: "16.2.6" } })
  )
  await writeFile(path.join(project, "tsconfig.json"), "{}\n")
  await writeFile(path.join(project, "src/app/globals.css"), '@import "tailwindcss";\n')
  const stdout: string[] = []
  const io = { stdout: (message: string) => stdout.push(message), stderr: () => undefined }
  assert.equal(await runCli(["init", "--cwd", project, "--json", "--skip-deps"], io), 0)
  assert.equal(await runCli(["init", "--cwd", project, "--json", "--skip-deps"], io), 0)

  const config = JSON.parse(await readFile(path.join(project, "components.json"), "utf8"))
  assert.equal(config.rsc, true)
  assert.equal(config.tsx, true)
  assert.equal(config.tailwind.css, "src/app/globals.css")
  const css = await readFile(path.join(project, "src/app/globals.css"), "utf8")
  assert.equal((css.match(/aq-ui theme:start/g) ?? []).length, 1)
  assert.match(css, /@theme inline/)
  assert.match(css, /--color-background: var\(--background\)/)
  assert.match(css, /@apply bg-background text-foreground/)
  assert.match(css, /@import "tw-animate-css"/)
  const manifest = JSON.parse(await readFile(path.join(project, ".aq-ui/manifest.json"), "utf8"))
  assert.equal(manifest.version, 1)
})

test("registry imports use every configured project alias", () => {
  const source = `import { cn } from "@/lib/utils"
import { helper } from "@/lib/helper"
import { useThing } from "@/hooks/use-thing"
import { Button } from "@/components/ui/button"
export { Shell } from "@/components/shell"
type Lazy = typeof import("@/lib/lazy")
const load = () => import("@/components/ui/dialog")
const commonJs = require("@/hooks/use-latest")
declare module "@/lib/plugin" { export const plugin: true }
const ordinaryString = "@/lib/utils"
// Keep this example unchanged: import "@/lib/utils"
`
  const output = rewriteRegistryImports(
    source,
    {
      aliases: {
        components: "~/design",
        ui: "~/design/primitives",
        hooks: "~/logic/hooks",
        lib: "~/shared/lib",
        utils: "~/shared/cn",
      },
    },
    "button.tsx"
  )

  assert.match(output, /from "~\/shared\/cn"/u)
  assert.match(output, /from "~\/shared\/lib\/helper"/u)
  assert.match(output, /from "~\/logic\/hooks\/use-thing"/u)
  assert.match(output, /from "~\/design\/primitives\/button"/u)
  assert.match(output, /from "~\/design\/shell"/u)
  assert.match(output, /import\("~\/shared\/lib\/lazy"\)/u)
  assert.match(output, /import\("~\/design\/primitives\/dialog"\)/u)
  assert.match(output, /require\("~\/logic\/hooks\/use-latest"\)/u)
  assert.match(output, /declare module "~\/shared\/lib\/plugin"/u)
  assert.match(output, /ordinaryString = "@\/lib\/utils"/u)
  assert.match(output, /example unchanged: import "@\/lib\/utils"/u)
})

test("init persists a custom registry and button installs with inferred and custom aliases", async (t) => {
  const root = await temporaryDirectory(t)
  const project = path.join(root, "project")
  const registry = path.join(root, "registry", "r")
  await mkdir(path.join(project, "src/styles"), { recursive: true })
  await mkdir(registry, { recursive: true })
  await writeFile(path.join(project, "package.json"), '{"name":"custom-alias-fixture"}\n')
  await writeFile(
    path.join(root, "tsconfig.base.json"),
    JSON.stringify({
      compilerOptions: { baseUrl: ".", paths: { "~/*": ["./project/src/*"] } },
    })
  )
  await writeFile(path.join(project, "tsconfig.json"), '{"extends":"../tsconfig.base.json"}\n')
  await writeFile(path.join(project, "src/styles/globals.css"), '@import "tailwindcss";\n')

  const utility = {
    name: "utils",
    type: "registry:lib",
    dependencies: ["clsx"],
    files: [
      {
        path: "lib/utils.ts",
        content: "export const cn = (...values: string[]) => values.join(' ')\n",
      },
    ],
  }
  const button = {
    name: "button",
    type: "registry:ui",
    registryDependencies: ["utils"],
    files: [
      {
        path: "components/ui/button.tsx",
        content:
          'import { cn } from "@/lib/utils"\n\nexport function Button() { return <button className={cn("button")}>Button</button> }\n',
      },
    ],
  }
  await writeFile(path.join(registry, "utils.json"), JSON.stringify(utility))
  await writeFile(path.join(registry, "button.json"), JSON.stringify(button))

  const stderr: string[] = []
  const io = { stdout: () => undefined, stderr: (message: string) => stderr.push(message) }
  assert.equal(
    await runCli(
      ["init", "--cwd", project, "--registry", registry, "--skip-deps", "--yes", "--json"],
      io
    ),
    0,
    stderr.join("\n")
  )

  const configPath = path.join(project, "components.json")
  const config = JSON.parse(await readFile(configPath, "utf8"))
  assert.equal(config.registry, registry)
  assert.deepEqual(config.aliases, {
    components: "~/components",
    hooks: "~/hooks",
    lib: "~/lib",
    utils: "~/lib/utils",
    ui: "~/components/ui",
  })
  const initialManifest = JSON.parse(
    await readFile(path.join(project, ".aq-ui/manifest.json"), "utf8")
  )
  assert.equal(initialManifest.registry, registry)

  config.aliases = {
    components: "~/design",
    ui: "~/design/ui",
    hooks: "~/logic/hooks",
    lib: "~/shared/lib",
    utils: "~/shared/cn",
  }
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`)
  stderr.length = 0
  assert.equal(
    await runCli(["add", "button", "--cwd", project, "--skip-deps", "--yes", "--json"], io),
    0,
    stderr.join("\n")
  )

  assert.equal(
    await readFile(path.join(project, "src/shared/cn.ts"), "utf8"),
    utility.files[0]?.content
  )
  assert.equal(
    await readFile(path.join(project, "src/design/ui/button.tsx"), "utf8"),
    'import { cn } from "~/shared/cn"\n\nexport function Button() { return <button className={cn("button")}>Button</button> }\n'
  )
  const installedManifest = JSON.parse(
    await readFile(path.join(project, ".aq-ui/manifest.json"), "utf8")
  )
  assert.equal(installedManifest.items.utils.files[0].path, "src/shared/cn.ts")
  assert.equal(installedManifest.items.button.files[0].path, "src/design/ui/button.tsx")

  config.registry = DEFAULT_REGISTRY
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`)
  stderr.length = 0
  assert.equal(
    await runCli(["init", "--cwd", project, "--skip-deps", "--yes", "--json"], io),
    0,
    stderr.join("\n")
  )
  assert.equal(JSON.parse(await readFile(configPath, "utf8")).registry, registry)

  const replacementRegistry = path.join(root, "replacement-registry", "r")
  stderr.length = 0
  assert.equal(
    await runCli(
      [
        "init",
        "--cwd",
        project,
        "--registry",
        replacementRegistry,
        "--skip-deps",
        "--yes",
        "--json",
      ],
      io
    ),
    0,
    stderr.join("\n")
  )
  assert.equal(JSON.parse(await readFile(configPath, "utf8")).registry, replacementRegistry)
  assert.equal(
    JSON.parse(await readFile(path.join(project, ".aq-ui/manifest.json"), "utf8")).registry,
    replacementRegistry
  )
})

test("migrate restores a legacy custom registry from the manifest", async (t) => {
  const project = await temporaryDirectory(t)
  const legacyRegistry = "https://registry.example.test/r"
  await mkdir(path.join(project, ".aq-ui"), { recursive: true })
  await writeFile(
    path.join(project, "components.json"),
    `${JSON.stringify({ aliases: {}, registry: DEFAULT_REGISTRY }, null, 2)}\n`
  )
  await writeFile(
    path.join(project, ".aq-ui/manifest.json"),
    `${JSON.stringify(
      {
        version: 1,
        channel: "stable",
        registry: legacyRegistry,
        items: {},
      },
      null,
      2
    )}\n`
  )
  const stderr: string[] = []
  const exitCode = await runCli(["migrate", "--cwd", project, "--json"], {
    stdout: () => undefined,
    stderr: (message) => stderr.push(message),
  })

  assert.equal(exitCode, 0, stderr.join("\n"))
  assert.equal(
    JSON.parse(await readFile(path.join(project, "components.json"), "utf8")).registry,
    legacyRegistry
  )
  assert.equal(
    JSON.parse(await readFile(path.join(project, ".aq-ui/manifest.json"), "utf8")).registry,
    legacyRegistry
  )
})

async function createFixture(t: test.TestContext): Promise<{
  project: string
  registry: string
  options: GlobalOptions
  client: RegistryClient
}> {
  const root = await temporaryDirectory(t)
  const project = path.join(root, "project")
  const registryRoot = path.join(root, "registry")
  const registry = path.join(registryRoot, "r")
  await mkdir(path.join(project, "src"), { recursive: true })
  await mkdir(registry, { recursive: true })
  await writeFile(path.join(project, "package.json"), '{"name":"fixture"}\n')
  await writeFile(
    path.join(project, "tsconfig.json"),
    JSON.stringify({ compilerOptions: { baseUrl: ".", paths: { "@/*": ["./src/*"] } } })
  )
  await writeFile(
    path.join(project, "components.json"),
    JSON.stringify({
      $schema: "https://ui.shadcn.com/schema.json",
      style: "aq-neutral",
      rsc: false,
      tsx: true,
      tailwind: { css: "src/styles/globals.css", cssVariables: true },
      aliases: {
        components: "@/components",
        ui: "@/components/ui",
        hooks: "@/hooks",
        lib: "@/lib",
        utils: "@/lib/utils",
      },
      registry: registry,
    })
  )
  const utility = {
    name: "utils",
    type: "registry:lib",
    files: [
      {
        path: "registry/lib/utils.ts",
        content: "export const cn = (...values: string[]) => values.join(' ')\n",
      },
    ],
  }
  const button = {
    name: "button",
    type: "registry:ui",
    description: "A button.",
    dependencies: ["class-variance-authority"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "registry/ui/button.tsx",
        content: "export function Button() { return <button>Button</button> }\n",
      },
    ],
  }
  await writeFile(
    path.join(registryRoot, "registry.json"),
    JSON.stringify({ name: "fixture", items: [utility, button] })
  )
  await writeFile(path.join(registry, "utils.json"), JSON.stringify(utility))
  await writeFile(path.join(registry, "button.json"), JSON.stringify(button))

  const options: GlobalOptions = {
    cwd: project,
    registry,
    channel: "stable",
    dryRun: false,
    force: false,
    json: true,
    yes: true,
    skipDeps: true,
  }
  const config = JSON.parse(await readFile(path.join(project, "components.json"), "utf8"))
  const client = new RegistryClient({ root: project, base: registry, channel: "stable", config })
  return { project, registry, options, client }
}

test("registry client materializes only selected language loader items", async (t) => {
  const fixture = await createFixture(t)
  const preset = {
    name: "code-language-preset",
    type: "registry:lib",
    registryDependencies: ["code-language-plaintext", "code-language-javascript"],
    files: [
      {
        path: "lib/code-language-preset.ts",
        content: "// upstream default\n",
      },
    ],
    meta: { integrity: "sha256-upstream" },
  }
  await writeFile(path.join(fixture.registry, "code-language-preset.json"), JSON.stringify(preset))
  const config = JSON.parse(await readFile(path.join(fixture.project, "components.json"), "utf8"))
  const client = new RegistryClient({
    root: fixture.project,
    base: fixture.registry,
    channel: "stable",
    config,
    codeLanguages: ["plaintext", "typescript", "sql"],
  })

  const item = await client.item("code-language-preset")
  const content = codeLanguagePresetContent(["plaintext", "typescript", "sql"])
  assert.deepEqual(item.registryDependencies, [
    "code-language-plaintext",
    "code-language-typescript",
    "code-language-sql",
  ])
  assert.equal(item.files[0]?.content, content)
  assert.equal(item.meta?.integrity, `sha256-${hashContent(content)}`)
})

test("installer resolves dependencies, writes a manifest, diffs, and removes safely", async (t) => {
  const fixture = await createFixture(t)
  assert.deepEqual(await fixture.client.names(), ["button", "utils"])
  const installed = await installItems({ options: fixture.options, client: fixture.client }, [
    "button",
  ])
  assert.deepEqual(installed.installed, ["utils", "button"])
  assert.equal(
    await readFile(path.join(fixture.project, "src/components/ui/button.tsx"), "utf8"),
    "export function Button() { return <button>Button</button> }\n"
  )
  const manifest = await loadManifest(fixture.project, {
    registry: fixture.registry,
    channel: "stable",
  })
  assert.equal(
    manifest.items.button?.files[0]?.hash,
    hashContent("export function Button() { return <button>Button</button> }\n")
  )

  await writeFile(path.join(fixture.project, "src/components/ui/button.tsx"), "// local edit\n")
  const diff = await diffItems(
    fixture.project,
    ["button"],
    { registry: fixture.registry, channel: "stable" },
    fixture.client
  )
  assert.equal(diff[0]?.local, "modified")
  await installItems({ options: fixture.options, client: fixture.client }, ["button"])
  assert.equal(
    await readFile(path.join(fixture.project, "src/components/ui/button.tsx"), "utf8"),
    "// local edit\n"
  )

  const changedButton = {
    name: "button",
    type: "registry:ui",
    dependencies: ["class-variance-authority"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "registry/ui/button-next.tsx",
        content: "export function Button() { return <button>Updated</button> }\n",
      },
    ],
  }
  await writeFile(path.join(fixture.registry, "button.json"), JSON.stringify(changedButton))
  const config = JSON.parse(await readFile(path.join(fixture.project, "components.json"), "utf8"))
  const updatedClient = new RegistryClient({
    root: fixture.project,
    base: fixture.registry,
    channel: "stable",
    config,
  })
  await assert.rejects(
    installItems({ options: fixture.options, client: updatedClient }, ["button"]),
    /Refusing to overwrite modified files/
  )

  await assert.rejects(
    removeItems(
      fixture.project,
      ["utils"],
      { registry: fixture.registry, channel: "stable" },
      fixture.options
    ),
    /required by button/
  )

  fixture.options.force = true
  await installItems({ options: fixture.options, client: updatedClient }, ["button"])
  await removeItems(
    fixture.project,
    ["button", "utils"],
    { registry: fixture.registry, channel: "stable" },
    fixture.options
  )
  await assert.rejects(readFile(path.join(fixture.project, "src/components/ui/button.tsx"), "utf8"))
  await assert.rejects(
    readFile(path.join(fixture.project, "src/components/ui/button-next.tsx"), "utf8")
  )
})

test("dry-run add validates without writing files", async (t) => {
  const fixture = await createFixture(t)
  fixture.options.dryRun = true
  const result = await installItems({ options: fixture.options, client: fixture.client }, [
    "button",
  ])
  assert.equal(result.dryRun, true)
  await assert.rejects(readFile(path.join(fixture.project, ".aq-ui/manifest.json"), "utf8"))
})

test("catalog commands work without a project configuration", async (t) => {
  const fixture = await createFixture(t)
  await rm(path.join(fixture.project, "components.json"))
  const stdout: string[] = []
  const stderr: string[] = []
  const exitCode = await runCli(
    ["info", "button", "--cwd", fixture.project, "--registry", fixture.registry, "--json"],
    {
      stdout: (message) => stdout.push(message),
      stderr: (message) => stderr.push(message),
    }
  )

  assert.equal(exitCode, 0, stderr.join("\n"))
  assert.equal(JSON.parse(stdout[0] ?? "{}").data.items[0].name, "button")
})

test("tsx false uses an AST transform and writes JSX", async (t) => {
  const fixture = await createFixture(t)
  const configPath = path.join(fixture.project, "components.json")
  const config = JSON.parse(await readFile(configPath, "utf8"))
  config.tsx = false
  config.aliases.utils = "@/lib/cn"
  await writeFile(configPath, JSON.stringify(config))
  const typed = {
    name: "typed",
    type: "registry:ui",
    files: [
      {
        path: "components/ui/typed.tsx",
        content:
          'import { cn } from "@/lib/utils"\ninterface Props { label: string }\nexport function Typed({ label }: Props) { return <span className={cn(label)}>{label}</span> }\n',
      },
    ],
  }
  await writeFile(path.join(fixture.registry, "typed.json"), JSON.stringify(typed))
  const client = new RegistryClient({
    root: fixture.project,
    base: fixture.registry,
    channel: "stable",
    config,
  })
  await installItems({ options: fixture.options, client }, ["typed"])
  const output = await readFile(path.join(fixture.project, "src/components/ui/typed.jsx"), "utf8")
  assert.doesNotMatch(output, /interface Props/)
  assert.match(output, /<span className=/)
  assert.match(output, /from "@\/lib\/cn"/u)
  await assert.rejects(readFile(path.join(fixture.project, "src/components/ui/typed.tsx"), "utf8"))
})

test("registry target placeholders resolve through project aliases", async (t) => {
  const fixture = await createFixture(t)
  const config = JSON.parse(await readFile(path.join(fixture.project, "components.json"), "utf8"))
  const target = await resolveRegistryFileTarget(
    fixture.project,
    config,
    {
      path: "registry/file/use-example.ts",
      type: "registry:file",
      target: "@hooks/use-example.ts",
    },
    "registry:file"
  )
  assert.equal(target, "src/hooks/use-example.ts")
})

test("inherited path aliases cannot target files outside the project", async (t) => {
  const root = await temporaryDirectory(t)
  const project = path.join(root, "project")
  await mkdir(project)
  await writeFile(
    path.join(root, "tsconfig.base.json"),
    JSON.stringify({
      compilerOptions: { baseUrl: ".", paths: { "~/*": ["./outside/*"] } },
    })
  )
  await writeFile(path.join(project, "tsconfig.json"), '{"extends":"../tsconfig.base.json"}\n')

  await assert.rejects(
    resolveRegistryFileTarget(
      project,
      {
        aliases: {
          components: "~/components",
          ui: "~/components/ui",
          hooks: "~/hooks",
          lib: "~/lib",
          utils: "~/lib/utils",
        },
      },
      { path: "components/ui/button.tsx", type: "registry:ui" },
      "registry:ui"
    ),
    /outside the project/u
  )
})

test("runCli emits stable JSON errors", async () => {
  const stderr: string[] = []
  const exitCode = await runCli(["unknown", "--json"], {
    stdout: () => undefined,
    stderr: (message) => stderr.push(message),
  })
  assert.equal(exitCode, 1)
  assert.equal(JSON.parse(stderr[0] ?? "{}").error.code, "UNKNOWN_COMMAND")
})
