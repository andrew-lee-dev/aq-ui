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

const project = await mkdtemp(join(tmpdir(), "aq-ui-react18-smoke-"))
try {
  await mkdir(join(project, "src/styles"), { recursive: true })
  await writeFile(
    join(project, "package.json"),
    `${JSON.stringify(
      {
        name: "aq-ui-react18-smoke",
        private: true,
        type: "module",
        packageManager: "pnpm@11.18.0",
        dependencies: {
          react: "18.3.1",
          "react-dom": "18.3.1",
          "react-router-dom": "^7.8.0",
        },
        devDependencies: {
          "@tailwindcss/cli": "^4.1.0",
          "@types/node": "^22.0.0",
          "@types/react": "^18.3.0",
          "@types/react-dom": "^18.3.0",
          "@vitejs/plugin-react": "^5.0.0",
          tailwindcss: "^4.1.0",
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
          paths: { "~/*": ["./src/*"] },
        },
        include: ["src"],
      },
      null,
      2
    )}\n`
  )
  await writeFile(join(project, "src/styles/globals.css"), '@import "tailwindcss";\n')
  await writeFile(
    join(project, "index.html"),
    '<main id="root"></main><script type="module" src="/src/main.tsx"></script>\n'
  )
  await writeFile(
    join(project, "vite.config.ts"),
    `import { fileURLToPath, URL } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "~": fileURLToPath(new URL("./src", import.meta.url)) },
  },
})
`
  )
  await writeFile(
    join(project, "src/main.tsx"),
    `import * as React from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Link, Route, Routes } from "react-router-dom"

import { Button } from "./components/ui/button"
import "./styles/globals.css"

function App() {
  return (
    <BrowserRouter>
      <main className="animate-in">
        <nav><Link to="/">Home</Link></nav>
        <Routes>
          <Route path="/" element={<Button>aq-ui React 18</Button>} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode><App /></React.StrictMode>
)
`
  )

  execute("pnpm", ["install", "--ignore-scripts"], project)
  runCli(["init", "--cwd", project, "--registry", registry, "--yes", "--json"], project)
  const componentsPath = join(project, "components.json")
  const componentsConfig = JSON.parse(await readFile(componentsPath, "utf8"))
  if (componentsConfig.aliases?.ui !== "~/components/ui") {
    throw new Error(`init did not infer the ~/ alias: ${componentsConfig.aliases?.ui}`)
  }
  componentsConfig.aliases.utils = "~/lib/cn"
  await writeFile(componentsPath, `${JSON.stringify(componentsConfig, null, 2)}\n`)
  runCli(
    ["add", "--all", "--cwd", project, "--package-manager", "pnpm", "--yes", "--json"],
    project
  )

  execute("pnpm", ["exec", "tsc", "--noEmit"], project)
  execute("pnpm", ["exec", "vite", "build"], project)
  const buttonSource = await readFile(join(project, "src/components/ui/button.tsx"), "utf8")
  if (!buttonSource.includes('from "~/lib/cn"')) {
    throw new Error("Button did not use the configured utils alias")
  }
  await readFile(join(project, "src/lib/cn.ts"), "utf8")
  execute(
    "pnpm",
    ["exec", "tailwindcss", "-i", "src/styles/globals.css", "-o", "compiled.css"],
    project
  )
  const compiledCSS = await readFile(join(project, "compiled.css"), "utf8")
  for (const selector of [".bg-background", ".border-border", ".animate-in"]) {
    if (!compiledCSS.includes(selector)) {
      throw new Error(`Tailwind did not generate ${selector}.`)
    }
  }
  const packageJson = JSON.parse(await readFile(join(project, "package.json"), "utf8"))
  if (packageJson.dependencies?.react !== "18.3.1") {
    throw new Error("The registry dependency install replaced React 18.3.1.")
  }
  console.log("React 18.3 + Vite + React Router full-catalog consumer smoke passed.")
} finally {
  await rm(project, { force: true, recursive: true })
}
