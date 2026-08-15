import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const registry = JSON.parse(
  readFileSync(resolve(docsRoot, "public/registry.json"), "utf8")
)

function source(relativePath) {
  return readFileSync(resolve(docsRoot, relativePath), "utf8")
}

const layout = source("app/layout.tsx")
const nextConfig = source("next.config.ts")
const navigation = source("components/site-navigation.tsx")
const navigationStyles = source("components/site-navigation.module.css")
const mobileDrawer = source("components/mobile-navigation-drawer.tsx")
const search = source("components/site-search.tsx")

test("docs shell exposes keyboard and landmark navigation", () => {
  assert.match(layout, /href="#main-content"/u)
  assert.match(layout, />\s*Skip to content\s*</u)
  assert.match(layout, /id="main-content"/u)
  assert.match(layout, /tabIndex=\{-1\}/u)
  assert.match(layout, /className="scroll-pt-16/u)
  assert.match(layout, /sticky top-0/u)
  assert.match(layout, /className="flex h-full items-center/u)
  assert.match(layout, /className="flex min-h-\[calc\(100svh-3\.5rem\)\]"/u)
  assert.doesNotMatch(layout, /max-w-\[100rem\]/u)
  assert.match(layout, /<SiteSearch \/>/u)
  assert.match(layout, /https:\/\/github\.com\/andrew-lee-dev\/aq-ui/u)
  assert.match(search, /⌘\/Ctrl K/u)
})

test("local IP previews can hydrate interactive documentation controls", () => {
  assert.match(nextConfig, /allowedDevOrigins: \["127\.0\.0\.1"\]/u)
})

test("desktop navigation is compact, grouped, and route-aware", () => {
  assert.match(navigation, /usePathname\(\)/u)
  assert.match(navigation, /pathname\.startsWith\("\/aq-ui\/"\)/u)
  assert.match(navigation, /pathname\.slice\("\/aq-ui"\.length\)/u)
  for (const editor of [
    "code-block",
    "code-editor",
    "markdown-editor",
    "markdown-renderer",
    "rich-text-editor",
  ]) {
    assert.match(navigation, new RegExp(`"/components/${editor}/"`, "u"))
  }
  assert.match(
    navigation,
    /href === "\/editors\/" && editorDetail[\s\S]*href === "\/components\/" && editorDetail/u
  )
  assert.match(navigation, /aria-current=\{active \? "page" : undefined\}/u)
  assert.match(navigation, /aria-label="Documentation navigation"/u)
  assert.match(navigation, /className=\{styles\.navigation\}/u)
  assert.doesNotMatch(navigation, /<h[1-6]/u)
  assert.match(navigation, /label: "Start"/u)
  assert.match(navigation, /label: "Library"/u)
  assert.match(navigation, /label: "Contribute"/u)
  assert.match(navigation, /label: "Components"[\s\S]*count: 75/u)
  assert.match(navigation, /label: "Hooks"[\s\S]*count: 72/u)
  assert.match(navigation, /label: "Editors"[\s\S]*count: 5/u)
  assert.match(navigation, /label: "Utilities"[\s\S]*count: 4/u)
  assert.match(navigation, /<NavigationLinks \/>/u)
  assert.doesNotMatch(navigation, /useHydrated/u)
  assert.match(navigationStyles, /position: sticky/u)
  assert.match(navigationStyles, /width: 15rem/u)
  assert.match(navigationStyles, /height: calc\(100svh - 3\.5rem\)/u)
  assert.match(navigationStyles, /overflow-y: auto/u)
  assert.match(navigationStyles, /scrollbar-gutter: stable/u)
  assert.match(navigationStyles, /@media \(min-width: 48rem\)/u)
  assert.match(navigationStyles, /border-inline-start: 2px solid transparent/u)
  assert.match(navigationStyles, /border-inline-start-color: var\(--primary\)/u)

  const linkRecords = navigation.match(/href: "\//gu) ?? []
  assert.equal(linkRecords.length, 8)

  const expectedCounts = {
    Components: registry.items.filter((item) => item.type === "registry:ui")
      .length,
    Hooks: registry.items.filter((item) => item.type === "registry:hook")
      .length,
    Utilities: registry.items.filter(
      (item) => item.type === "registry:style" || item.type === "registry:lib"
    ).length,
    Editors: [
      "code-block",
      "code-editor",
      "markdown-editor",
      "markdown-renderer",
      "rich-text-editor",
    ].filter((name) => registry.items.some((item) => item.name === name))
      .length,
  }

  for (const [label, count] of Object.entries(expectedCounts)) {
    assert.match(
      navigation,
      new RegExp(`label: "${label}"[\\s\\S]*?count: ${count}`, "u")
    )
  }
})

test("mobile navigation uses an accessible sheet and closes after selection", () => {
  assert.match(navigation, /React\.lazy/u)
  assert.match(navigation, /onPointerEnter=\{preloadNavigation\}/u)
  assert.match(navigation, /onFocus=\{preloadNavigation\}/u)
  assert.match(navigation, /aria-busy=\{mobileOpen && !drawerReady\}/u)
  assert.match(navigation, />\s*Opening navigation…\s*</u)
  assert.match(
    navigation,
    /import\("@\/components\/mobile-navigation-drawer"\)/u
  )
  assert.doesNotMatch(navigation, /registry\/components\/sheet/u)
  assert.match(navigation, /aria-label="Open documentation navigation"/u)
  assert.match(navigation, /<button/u)
  assert.match(navigation, /type="button"/u)
  assert.match(navigation, /aria-haspopup="dialog"/u)
  assert.match(navigation, /aria-expanded=\{mobileOpen\}/u)
  assert.match(navigation, /data-js-navigation-trigger=""/u)
  assert.match(navigation, /<noscript>/u)
  assert.match(navigation, /<details/u)
  assert.match(navigation, /<summary/u)
  assert.match(navigation, /<NoScriptNavigation \/>/u)
  assert.match(navigation, /navigationSections\.flatMap/u)
  assert.match(
    navigation,
    /mobileOpen && drawerReady[\s\S]*\? "docs-navigation-drawer"/u
  )
  assert.match(navigation, /finalFocusRef=\{triggerRef\}/u)
  assert.match(navigation, /\{drawerMounted \? \(/u)
  assert.match(navigation, /onNavigate=\{\(\) => setMobileOpen\(false\)\}/u)
  assert.match(navigation, /className=\{styles\.menuButton\}/u)
  assert.match(navigation, /styles\.mobileFallback/u)
  assert.match(navigationStyles, /\.mobileFallback/u)
  assert.match(navigationStyles, /inset-inline: 0/u)
  assert.match(mobileDrawer, /w-screen![\s\S]*md:w-80!/u)
  assert.match(navigationStyles, /\.loadingStatus/u)
  assert.match(navigation, /document\.documentElement\.dir/u)
  assert.match(navigation, /direction === "rtl" \? "right" : "left"/u)
  assert.match(navigation, /side=\{drawerSide\}/u)
  assert.match(navigation, /desktopNavigationQuery = "\(min-width: 48rem\)"/u)
  assert.match(navigation, /matchMedia\(desktopNavigationQuery\)/u)
  assert.match(navigation, /if \(event\.matches\) setMobileOpen\(false\)/u)
  assert.match(mobileDrawer, /registry\/components\/sheet/u)
  assert.match(mobileDrawer, /<Sheet[\s\S]*open=\{open\}/u)
  assert.match(mobileDrawer, /onOpenChange=\{onOpenChange\}/u)
  assert.match(mobileDrawer, /triggerId="docs-navigation-trigger"/u)
  assert.match(mobileDrawer, /finalFocus=\{finalFocusRef\}/u)
  assert.match(mobileDrawer, /side=\{side\}/u)
  assert.match(mobileDrawer, /h-svh! max-h-svh!/u)
  assert.match(mobileDrawer, /gap-0 overflow-hidden p-0/u)
  assert.match(mobileDrawer, /SheetHeader className="shrink-0/u)
  assert.match(mobileDrawer, /data-docs-navigation-scroll=""/u)
  assert.match(mobileDrawer, /min-h-0 flex-1 overflow-y-auto/u)
  assert.match(mobileDrawer, /<SheetTitle>Documentation<\/SheetTitle>/u)
})

test("shell navigation opts out of eager route prefetching", () => {
  const layoutLinks = layout.match(/<Link\b[\s\S]*?<\/Link>/gu) ?? []
  const navigationLinks = navigation.match(/<Link\b[\s\S]*?<\/Link>/gu) ?? []

  assert.ok(layoutLinks.length >= 2)
  assert.ok(navigationLinks.length >= 1)
  for (const link of [...layoutLinks, ...navigationLinks]) {
    assert.match(link, /prefetch=\{false\}/u)
  }
})
