import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const workspaceRoot = resolve(docsRoot, "../..")
const registry = JSON.parse(
  readFileSync(resolve(workspaceRoot, "registry.json"), "utf8")
)

function source(relativePath) {
  return readFileSync(resolve(docsRoot, relativePath), "utf8")
}

const componentPage = source("app/components/page.tsx")
const hookPage = source("app/hooks/page.tsx")
const utilityPage = source("app/utilities/page.tsx")
const editorsPage = source("app/editors/page.tsx")
const componentDetail = source("app/components/[name]/page.tsx")
const hookDetail = source("app/hooks/[name]/page.tsx")
const utilityDetail = source("app/utilities/[name]/page.tsx")
const catalogSearch = source("components/catalog-search.tsx")
const layout = source("app/layout.tsx")
const siteNavigation = source("components/site-navigation.tsx")

test("public catalogs partition all 151 registry items by type", () => {
  const components = registry.items.filter(
    (item) => item.type === "registry:ui"
  )
  const hooks = registry.items.filter((item) => item.type === "registry:hook")
  const utilities = registry.items.filter(
    (item) => item.type === "registry:style" || item.type === "registry:lib"
  )

  assert.equal(components.length, 75)
  assert.equal(hooks.length, 72)
  assert.equal(utilities.length, 4)
  assert.equal(components.length + hooks.length + utilities.length, 151)
  assert.equal(registry.items.length, 151)

  assert.match(componentPage, /item\.type === "registry:ui"/u)
  assert.doesNotMatch(componentPage, /item\.type === "registry:hook"/u)
  assert.match(componentPage, /href: `\/components\/\$\{item\.name\}\//u)

  assert.match(hookPage, /item\.type === "registry:hook"/u)
  assert.doesNotMatch(hookPage, /item\.type === "registry:ui"/u)
  assert.match(hookPage, /href: `\/hooks\/\$\{item\.name\}\//u)
  assert.doesNotMatch(hookPage, /href: `\/components\//u)

  assert.match(utilityPage, /isUtilityType\(item\.type\)/u)
  assert.match(utilityPage, /type === "registry:style"/u)
  assert.match(utilityPage, /type === "registry:lib"/u)
  assert.match(utilityPage, /href: `\/utilities\/\$\{item\.name\}\//u)
  assert.doesNotMatch(utilityPage, /href: `\/(?:components|hooks)\//u)
})

test("detail routes statically generate disjoint canonical paths", () => {
  assert.match(componentDetail, /item\.type === "registry:ui"/u)
  assert.match(componentDetail, /item\?\.type !== "registry:ui"/u)
  assert.doesNotMatch(componentDetail, /registry:hook/u)

  assert.match(hookDetail, /item\.type === "registry:hook"/u)
  assert.match(hookDetail, /item\?\.type !== "registry:hook"/u)
  assert.doesNotMatch(hookDetail, /registry:ui/u)

  assert.match(utilityDetail, /isUtilityType\(item\.type\)/u)
  assert.match(utilityDetail, /type === "registry:style"/u)
  assert.match(utilityDetail, /type === "registry:lib"/u)
  assert.match(
    utilityDetail,
    /<RegistryItemDetail item=\{item\} collection="utilities" \/>/u
  )

  for (const detail of [componentDetail, hookDetail, utilityDetail]) {
    assert.match(detail, /export const dynamicParams = false/u)
    assert.match(detail, /export function generateStaticParams\(\)/u)
  }

  const componentNames = new Set(
    registry.items
      .filter((item) => item.type === "registry:ui")
      .map((item) => item.name)
  )
  const hookNames = new Set(
    registry.items
      .filter((item) => item.type === "registry:hook")
      .map((item) => item.name)
  )
  const utilityNames = new Set(
    registry.items
      .filter(
        (item) => item.type === "registry:style" || item.type === "registry:lib"
      )
      .map((item) => item.name)
  )
  assert.equal(
    [...hookNames].some((name) => componentNames.has(name)),
    false
  )
  assert.equal(
    [...utilityNames].some(
      (name) => componentNames.has(name) || hookNames.has(name)
    ),
    false
  )
})

test("all five content families stay discoverable through canonical component links", () => {
  for (const name of [
    "code-block",
    "code-editor",
    "markdown-editor",
    "markdown-renderer",
    "rich-text-editor",
  ]) {
    assert.match(componentPage, new RegExp(`"${name}"`, "u"))
    assert.doesNotMatch(hookPage, new RegExp(`"${name}"`, "u"))
    assert.match(editorsPage, new RegExp(`name: "${name}"`, "u"))
  }
  assert.match(componentPage, /href="\/editors\/"/u)
  assert.match(editorsPage, /href=\{`\/components\/\$\{editor\.name\}\//u)
  assert.match(editorsPage, /prefetch=\{false\}/u)
})

test("editor demos shrink on narrow viewports without adding a second page heading", () => {
  const markdownEditorExample = source(
    "components/examples/editor-markdown-editor-example.tsx"
  )
  const markdownRendererExample = source(
    "components/examples/editor-markdown-renderer-example.tsx"
  )

  assert.match(editorsPage, /grid min-w-0 gap-6/u)
  assert.equal(editorsPage.match(/<div className="min-w-0">/gu)?.length, 2)
  assert.match(markdownEditorExample, /`## Release checklist/u)
  assert.match(markdownRendererExample, /`## Release checklist/u)
  assert.doesNotMatch(markdownEditorExample, /`# Release checklist/u)
  assert.doesNotMatch(markdownRendererExample, /`# Release checklist/u)
})

test("interactive navigation examples use real fallback destinations", () => {
  const navigationExamples = source(
    "components/examples/advanced-navigation-examples.tsx"
  )
  const overlayExamples = source(
    "components/examples/advanced-overlay-examples.tsx"
  )

  assert.doesNotMatch(navigationExamples, /href="#"/u)
  assert.doesNotMatch(overlayExamples, /href="#"/u)
  assert.match(navigationExamples, /href="\.\.\/"/u)
  assert.match(
    navigationExamples,
    /href="\.\.\/\.\.\/utilities\/aq-neutral\/"/u
  )
  assert.match(overlayExamples, /github\.com\/andrew-lee-dev\/aq-ui/u)
})

test("catalog search exposes accessible filtering, reset focus, and mobile-safe status", () => {
  assert.match(catalogSearch, /type="search"/u)
  assert.match(catalogSearch, /role="status"/u)
  assert.match(catalogSearch, /aria-live="polite"/u)
  assert.match(catalogSearch, /emptyTitle/u)
  assert.match(catalogSearch, /emptyDescription/u)
  assert.match(catalogSearch, /Clear search/u)
  assert.match(catalogSearch, /useRef<HTMLInputElement>\(null\)/u)
  assert.match(catalogSearch, /ref=\{searchInputRef\}/u)
  assert.match(catalogSearch, /event\.key !== "Escape"/u)
  assert.match(catalogSearch, /onClick=\{clearSearch\}/u)
  assert.match(catalogSearch, /searchInputRef\.current\?\.focus\(\)/u)
  assert.match(catalogSearch, /\[overflow-wrap:anywhere\]/u)
  assert.match(catalogSearch, /prefetch=\{false\}/u)
  assert.match(componentPage, /searchLabel="Search components"/u)
  assert.match(hookPage, /searchLabel="Search hooks"/u)
  assert.match(utilityPage, /searchLabel="Search utilities"/u)
})

test("site navigation labels the separated destinations clearly", () => {
  assert.match(layout, /<SiteNavigation \/>/u)
  assert.match(siteNavigation, /label: "Components"/u)
  assert.match(siteNavigation, /label: "Hooks"/u)
  assert.match(siteNavigation, /label: "Editors"/u)
  assert.match(siteNavigation, /label: "Utilities"/u)
  assert.doesNotMatch(siteNavigation, /label: "Catalog"/u)
})
