import assert from "node:assert/strict"
import { Buffer } from "node:buffer"
import { spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, resolve } from "node:path"
import process from "node:process"
import { test } from "node:test"

const routeFiles = [
  "index.html",
  "components/button/index.html",
  "components/data-grid/index.html",
  "components/code-editor/index.html",
  "components/markdown-renderer/index.html",
  "components/questionnaire/index.html",
]

function measureFixture(basePath) {
  const outputRoot = mkdtempSync(resolve(tmpdir(), "aq-ui-performance-"))
  const asset = "console.log('performance fixture')"

  try {
    for (const routeFile of routeFiles) {
      const routePath = resolve(outputRoot, routeFile)
      mkdirSync(dirname(routePath), { recursive: true })
      writeFileSync(
        routePath,
        `<script src="${basePath}/_next/static/chunks/app.js"></script>`
      )
    }

    const assetPath = resolve(outputRoot, "_next/static/chunks/app.js")
    mkdirSync(dirname(assetPath), { recursive: true })
    writeFileSync(assetPath, asset)

    const result = spawnSync(
      process.execPath,
      ["scripts/measure-static-performance.mjs", outputRoot, "--json"],
      { cwd: resolve(import.meta.dirname, ".."), encoding: "utf8" }
    )

    assert.equal(result.status, 0, result.stderr)
    const report = JSON.parse(result.stdout)
    for (const route of report.routes) {
      assert.equal(route.requestCount, 2)
      assert.equal(route.assetRawBytes, Buffer.byteLength(asset))
      assert.deepEqual(route.resourceTypes, { js: 1 })
    }
  } finally {
    rmSync(outputRoot, { recursive: true, force: true })
  }
}

test("static performance resolves local exported assets", () => {
  measureFixture("")
})

test("static performance strips the GitHub Pages base path", () => {
  measureFixture("/aq-ui")
})
