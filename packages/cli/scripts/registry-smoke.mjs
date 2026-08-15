import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import process from "node:process"
import { spawnSync } from "node:child_process"

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const workspaceRoot = resolve(packageRoot, "../..")
const executable = join(packageRoot, "dist/index.js")
const registry = join(workspaceRoot, "apps/docs/public/r")

function run(args) {
  const result = spawnSync(process.execPath, [executable, ...args], {
    cwd: workspaceRoot,
    encoding: "utf8",
    env: process.env,
  })
  if (result.status !== 0) {
    throw new Error(`aq-ui ${args.join(" ")} failed\n${result.stdout}\n${result.stderr}`)
  }
  return result.stdout
}

function packageName(specifier) {
  const separator = specifier.startsWith("@") ? specifier.indexOf("@", 1) : specifier.indexOf("@")
  return separator === -1 ? specifier : specifier.slice(0, separator)
}

const project = await mkdtemp(join(tmpdir(), "aq-ui-registry-smoke-"))
try {
  await mkdir(join(project, "src/styles"), { recursive: true })
  await writeFile(
    join(project, "package.json"),
    `${JSON.stringify(
      {
        name: "aq-ui-vite-smoke",
        private: true,
        dependencies: { react: "19.2.4", "react-dom": "19.2.4" },
        devDependencies: { typescript: "^5.9.3", vite: "^7.0.0" },
      },
      null,
      2
    )}\n`
  )
  await writeFile(
    join(project, "tsconfig.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          baseUrl: ".",
          paths: { "@/*": ["./src/*"] },
          jsx: "react-jsx",
        },
      },
      null,
      2
    )}\n`
  )
  await writeFile(join(project, "src/styles/globals.css"), '@import "tailwindcss";\n')

  run(["init", "--cwd", project, "--registry", registry, "--skip-deps", "--yes"])
  const addResult = JSON.parse(
    run([
      "add",
      "button",
      "markdown-editor",
      "rich-text-editor",
      "--languages",
      "typescript,json,yaml",
      "--cwd",
      project,
      "--registry",
      registry,
      "--skip-deps",
      "--yes",
      "--json",
    ])
  )
  run(["doctor", "--cwd", project, "--registry", registry, "--json"])

  const requiredFiles = [
    "src/components/ui/button.tsx",
    "src/components/ui/code-editor.tsx",
    "src/components/ui/markdown-editor.tsx",
    "src/components/ui/markdown-renderer.tsx",
    "src/components/ui/rich-text-editor.tsx",
    "src/components/ui/rich-text-renderer.tsx",
    "src/hooks/use-code-editor.ts",
    "src/hooks/use-markdown-editor.ts",
    "src/hooks/use-rich-text-editor.ts",
    "src/lib/code-language-plaintext.ts",
    "src/lib/code-language-typescript.ts",
    "src/lib/code-language-json.ts",
    "src/lib/code-language-yaml.ts",
    "src/lib/code-language-markdown.ts",
    "src/lib/code-language-preset.ts",
    "src/lib/code-language-registry.ts",
    "src/lib/upload.ts",
  ]
  await Promise.all(requiredFiles.map((file) => readFile(join(project, file))))

  const css = await readFile(join(project, "src/styles/globals.css"), "utf8")
  if (!css.includes("@custom-variant data-open")) {
    throw new Error("init did not install the Tailwind state utilities")
  }
  const manifest = JSON.parse(await readFile(join(project, ".aq-ui/manifest.json"), "utf8"))
  const selectedLanguages = ["plaintext", "typescript", "json", "yaml"]
  if (JSON.stringify(manifest.codeLanguages) !== JSON.stringify(selectedLanguages)) {
    throw new Error(`Unexpected manifest language preset: ${manifest.codeLanguages}`)
  }
  for (const language of [...selectedLanguages, "markdown"]) {
    if (!manifest.items[`code-language-${language}`]) {
      throw new Error(`Missing language loader ${language}`)
    }
  }
  for (const language of ["javascript", "jsx", "tsx", "html", "css", "sql"]) {
    if (manifest.items[`code-language-${language}`]) {
      throw new Error(`Unexpected language loader ${language}`)
    }
  }
  const addedDependencyNames = addResult.data.dependencies.map(packageName)
  for (const dependency of [
    "@codemirror/lang-html",
    "@codemirror/lang-css",
    "@codemirror/lang-sql",
  ]) {
    if (addedDependencyNames.includes(dependency)) {
      throw new Error(`Unexpected language package ${dependency}`)
    }
  }
  for (const item of ["button", "markdown-editor", "rich-text-editor"]) {
    if (!manifest.items[item]) throw new Error(`Missing manifest item ${item}`)
  }

  const reconfigured = JSON.parse(
    run([
      "add",
      "code-editor",
      "--languages",
      "sql",
      "--cwd",
      project,
      "--registry",
      registry,
      "--skip-deps",
      "--yes",
      "--json",
    ])
  )
  const nextManifest = JSON.parse(await readFile(join(project, ".aq-ui/manifest.json"), "utf8"))
  if (JSON.stringify(nextManifest.codeLanguages) !== JSON.stringify(["plaintext", "sql"])) {
    throw new Error(`Language preset was not reconfigured: ${nextManifest.codeLanguages}`)
  }
  if (!nextManifest.items["code-language-markdown"]) {
    throw new Error("MarkdownEditor did not retain its required Markdown loader")
  }
  for (const language of ["typescript", "json", "yaml"]) {
    if (nextManifest.items[`code-language-${language}`]) {
      throw new Error(`Stale language loader was not pruned: ${language}`)
    }
  }
  if (!reconfigured.data.dependencies.map(packageName).includes("@codemirror/lang-sql")) {
    throw new Error("SQL language dependency was not resolved")
  }
  console.log(`Registry smoke passed with ${Object.keys(manifest.items).length} resolved items.`)
} finally {
  await rm(project, { force: true, recursive: true })
}
