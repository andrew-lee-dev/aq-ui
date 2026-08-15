import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, extname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { gzipSync } from "node:zlib"

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const arguments_ = globalThis.process.argv.slice(2)
const json = arguments_.includes("--json")
const check = arguments_.includes("--check")
const outputArgument = arguments_.find((value) => !value.startsWith("--"))
const outputRoot = resolve(docsRoot, outputArgument ?? "out")

const routes = [
  {
    route: "/",
    html: "index.html",
    budget: { initialGzipBytes: 260 * 1024, htmlRawBytes: 40 * 1024 },
  },
  {
    route: "/components/button/",
    html: "components/button/index.html",
    // The persistent SSR documentation sidebar is core navigation, so the raw
    // ceiling includes its progressive-enhancement markup. Transfer size keeps
    // the stricter existing gzip budget.
    budget: { initialGzipBytes: 310 * 1024, htmlRawBytes: 45 * 1024 },
  },
  {
    route: "/components/data-grid/",
    html: "components/data-grid/index.html",
    budget: { initialGzipBytes: 380 * 1024, htmlRawBytes: 80 * 1024 },
  },
  {
    route: "/components/code-editor/",
    html: "components/code-editor/index.html",
    budget: { initialGzipBytes: 420 * 1024, htmlRawBytes: 40 * 1024 },
  },
  {
    route: "/components/markdown-renderer/",
    html: "components/markdown-renderer/index.html",
    budget: { initialGzipBytes: 410 * 1024, htmlRawBytes: 55 * 1024 },
  },
  {
    route: "/components/questionnaire/",
    html: "components/questionnaire/index.html",
    budget: { initialGzipBytes: 300 * 1024, htmlRawBytes: 80 * 1024 },
  },
]

function compressedSize(buffer) {
  return gzipSync(buffer, { level: 9 }).byteLength
}

function localResourcePaths(html) {
  const resources = new Set()
  const tags = html.matchAll(
    /<(?:script|link|img)\b[^>]*?(?:src|href)="([^"]+)"[^>]*>/gu
  )

  for (const [, value] of tags) {
    if (!value?.startsWith("/")) continue
    resources.add(value.split(/[?#]/u, 1)[0])
  }

  return resources
}

function emittedBasePath(resources) {
  for (const resource of resources) {
    const nextAssetIndex = resource.indexOf("/_next/")
    if (nextAssetIndex >= 0) return resource.slice(0, nextAssetIndex)
  }

  return ""
}

function outputResourcePath(resource, basePath) {
  const relative =
    basePath && (resource === basePath || resource.startsWith(`${basePath}/`))
      ? resource.slice(basePath.length)
      : resource
  return join(outputRoot, relative.replace(/^\/+/, ""))
}

function routePayload(htmlPath) {
  const directory = dirname(htmlPath)
  const file = readdirSync(directory).find(
    (entry) => entry.includes("__PAGE__") && entry.endsWith(".txt")
  )

  if (!file) return { rawBytes: 0, gzipBytes: 0 }

  const buffer = readFileSync(join(directory, file))
  return { rawBytes: buffer.byteLength, gzipBytes: compressedSize(buffer) }
}

function measureRoute({ route, html }) {
  const htmlPath = join(outputRoot, html)
  if (!existsSync(htmlPath)) {
    throw new Error(`Missing ${htmlPath}. Run the docs production build first.`)
  }

  const document = readFileSync(htmlPath)
  const resources = localResourcePaths(document.toString("utf8"))
  const basePath = emittedBasePath(resources)
  let assetRawBytes = 0
  let assetGzipBytes = 0
  const resourceTypes = {}

  for (const resource of resources) {
    const path = outputResourcePath(resource, basePath)
    if (!existsSync(path) || !statSync(path).isFile()) continue

    const buffer = readFileSync(path)
    const type = extname(path).slice(1) || "other"
    assetRawBytes += buffer.byteLength
    assetGzipBytes += compressedSize(buffer)
    resourceTypes[type] = (resourceTypes[type] ?? 0) + 1
  }

  const htmlGzipBytes = compressedSize(document)

  return {
    route,
    requestCount:
      1 +
      Object.values(resourceTypes).reduce((total, count) => total + count, 0),
    htmlRawBytes: document.byteLength,
    htmlGzipBytes,
    assetRawBytes,
    assetGzipBytes,
    initialRawBytes: document.byteLength + assetRawBytes,
    initialGzipBytes: htmlGzipBytes + assetGzipBytes,
    routePayload: routePayload(htmlPath),
    resourceTypes,
  }
}

function kib(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`
}

const results = routes.map(measureRoute)
const violations = routes.flatMap(({ route, budget }) => {
  const result = results.find((entry) => entry.route === route)
  if (!result || !budget) return []

  return Object.entries(budget).flatMap(([metric, limit]) =>
    result[metric] > limit
      ? [`${route} ${metric}: ${result[metric]} > ${limit} bytes`]
      : []
  )
})

if (json) {
  console.log(JSON.stringify({ outputRoot, routes: results }, null, 2))
} else {
  console.log(`Static performance estimate: ${outputRoot}`)
  console.log(
    "Route | Requests | HTML raw/gzip | Initial raw/gzip | RSC nav raw/gzip"
  )
  console.log("--- | ---: | ---: | ---: | ---:")
  for (const result of results) {
    console.log(
      `${result.route} | ${result.requestCount} | ${kib(result.htmlRawBytes)} / ${kib(result.htmlGzipBytes)} | ${kib(result.initialRawBytes)} / ${kib(result.initialGzipBytes)} | ${kib(result.routePayload.rawBytes)} / ${kib(result.routePayload.gzipBytes)}`
    )
  }
  console.log(
    "\nGzip values are deterministic transfer-size estimates; host/CDN headers and compression may differ."
  )
}

if (check) {
  if (violations.length) {
    console.error(`\nPerformance budget failed:\n- ${violations.join("\n- ")}`)
    globalThis.process.exitCode = 1
  } else {
    console.log("\nPerformance budgets passed.")
  }
}
