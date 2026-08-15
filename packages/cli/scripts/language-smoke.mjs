import { spawnSync } from "node:child_process"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import process from "node:process"

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const workspaceRoot = resolve(packageRoot, "../..")
const executable = join(packageRoot, "dist/index.js")
const registry = join(workspaceRoot, "apps/docs/public/r")

function execute(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      COREPACK_ENABLE_STRICT: "0",
      npm_config_ignore_scripts: "true",
    },
  })
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed\n${result.stdout}\n${result.stderr}`)
  }
  return result.stdout
}

function runCli(args, cwd) {
  return execute(process.execPath, [executable, ...args], cwd)
}

const project = await mkdtemp(join(tmpdir(), "aq-ui-language-smoke-"))
try {
  await mkdir(join(project, "src/styles"), { recursive: true })
  await writeFile(
    join(project, "package.json"),
    `${JSON.stringify(
      {
        name: "aq-ui-language-smoke",
        private: true,
        type: "module",
        packageManager: "pnpm@11.18.0",
        dependencies: {
          react: "19.2.4",
          "react-dom": "19.2.4",
        },
        devDependencies: {
          "@types/node": "^22.0.0",
          "@types/react": "^19.0.0",
          "@types/react-dom": "^19.0.0",
          typescript: "^5.9.3",
          vite: "^7.0.0",
        },
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
          target: "ES2022",
          lib: ["DOM", "DOM.Iterable", "ES2022"],
          module: "ESNext",
          moduleResolution: "Bundler",
          jsx: "react-jsx",
          strict: true,
          skipLibCheck: true,
          noEmit: true,
          baseUrl: ".",
          paths: { "@/*": ["./src/*"] },
        },
        include: ["src", "vite.config.ts"],
      },
      null,
      2
    )}\n`
  )
  await writeFile(
    join(project, "vite.config.ts"),
    `import { fileURLToPath, URL } from "node:url"
import { defineConfig } from "vite"

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
})
`
  )
  await writeFile(
    join(project, "index.html"),
    '<div id="root"></div><script type="module" src="/src/main.tsx"></script>\n'
  )
  await writeFile(join(project, "src/styles/globals.css"), "")
  await writeFile(
    join(project, "src/main.tsx"),
    `import { CodeEditor } from "@/components/ui/code-editor"
import { MarkdownEditor } from "@/components/ui/markdown-editor"

export { CodeEditor, MarkdownEditor }
`
  )
  await writeFile(
    join(project, "src/language-runtime.ts"),
    `import "@/components/ui/markdown-editor"
import { loadCodeLanguage } from "@/hooks/use-code-editor"

const extension = await loadCodeLanguage("markdown")
if (!extension) throw new Error("Markdown language did not register")
console.log("Markdown language registered independently of the CLI preset.")
`
  )

  execute("pnpm", ["install", "--ignore-scripts"], project)
  runCli(["init", "--cwd", project, "--registry", registry, "--skip-deps", "--yes"], project)
  runCli(
    [
      "add",
      "markdown-editor",
      "--languages",
      "typescript,json,yaml",
      "--cwd",
      project,
      "--registry",
      registry,
      "--package-manager",
      "pnpm",
      "--yes",
    ],
    project
  )

  execute("pnpm", ["exec", "tsc", "--noEmit"], project)
  execute("pnpm", ["exec", "vite", "build"], project)

  execute(
    "pnpm",
    ["exec", "vite", "build", "--ssr", "src/language-runtime.ts", "--outDir", "dist-ssr"],
    project
  )
  execute(process.execPath, ["dist-ssr/language-runtime.js"], project)

  const presetSource = await readFile(join(project, "src/lib/code-language-preset.ts"), "utf8")
  if (presetSource.includes("code-language-markdown")) {
    throw new Error("Custom CLI preset unexpectedly contains Markdown")
  }
  const markdownEditorSource = await readFile(
    join(project, "src/components/ui/markdown-editor.tsx"),
    "utf8"
  )
  if (!markdownEditorSource.includes('import "@/lib/code-language-markdown"')) {
    throw new Error("MarkdownEditor does not register its required language")
  }

  const packageJson = JSON.parse(await readFile(join(project, "package.json"), "utf8"))
  const dependencies = packageJson.dependencies ?? {}
  for (const packageName of [
    "@codemirror/lang-javascript",
    "@codemirror/lang-json",
    "@codemirror/lang-yaml",
    "@codemirror/lang-markdown",
  ]) {
    if (!dependencies[packageName]) {
      throw new Error(`Missing selected language dependency ${packageName}`)
    }
  }
  for (const packageName of [
    "@codemirror/lang-css",
    "@codemirror/lang-html",
    "@codemirror/lang-sql",
  ]) {
    if (dependencies[packageName]) {
      throw new Error(`Unexpected language dependency ${packageName}`)
    }
  }
  console.log("Granular language consumer typecheck and bundle smoke passed.")
} finally {
  await rm(project, { force: true, recursive: true })
}
