import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const triggerSource = readFileSync(
  resolve(docsRoot, "components/site-search.tsx"),
  "utf8"
)
const dialogSource = readFileSync(
  resolve(docsRoot, "components/site-search-dialog.tsx"),
  "utf8"
)

test("site search exposes an accessible compact trigger and shortcuts", () => {
  assert.match(triggerSource, /aria-haspopup="dialog"/u)
  assert.match(triggerSource, /aria-expanded=\{open\}/u)
  assert.match(triggerSource, />\s*Search docs\s*</u)
  assert.match(triggerSource, /⌘\/Ctrl K/u)
  assert.match(triggerSource, /aria-keyshortcuts="Meta\+K Control\+K \/"/u)
  assert.match(triggerSource, /onPointerEnter=/u)
  assert.match(triggerSource, /onFocus=/u)
  assert.match(
    triggerSource,
    /aria-label="Search documentation \(Command K or Control K\)"/u
  )
  assert.match(dialogSource, /aria-label="Search documentation"/u)
  assert.match(dialogSource, /showCloseButton/u)
})

test("keyboard shortcuts toggle globally without hijacking slash in editors", () => {
  assert.match(
    triggerSource,
    /document\.addEventListener\("keydown", onKeyDown\)/u
  )
  assert.match(triggerSource, /event\.metaKey \|\| event\.ctrlKey/u)
  assert.match(triggerSource, /event\.key\.toLowerCase\(\) === "k"/u)
  assert.match(triggerSource, /event\.key === "\/"/u)
  assert.match(triggerSource, /!isEditableTarget\(event\.target\)/u)
  assert.match(
    triggerSource,
    /input, textarea, select, \[contenteditable="true"\], \[role="textbox"\]/u
  )
  assert.match(triggerSource, /if \(open\) closeSearch\(\)/u)
  assert.match(triggerSource, /event\.preventDefault\(\)/u)
})

test("global shortcuts do not create nested modal focus traps", () => {
  assert.match(triggerSource, /function hasOpenModalDialog\(\)/u)
  assert.match(
    triggerSource,
    /\[role="dialog"\]\[aria-modal="true"\]:not\(\[hidden\]\):not\(\[aria-hidden="true"\]\)/u
  )
  assert.match(
    triggerSource,
    /if \(!open && hasOpenModalDialog\(\)\) return\s*\n\s*event\.preventDefault/u
  )
  assert.match(
    triggerSource,
    /!open &&\s*\n\s*!hasOpenModalDialog\(\) &&\s*\n\s*!isEditableTarget/u
  )
  assert.match(triggerSource, /if \(open\) closeSearch\(\)/u)
})

test("every close path explicitly restores focus to the search trigger", () => {
  assert.match(triggerSource, /const triggerRef = useRef<HTMLButtonElement/u)
  assert.match(triggerSource, /ref=\{triggerRef\}/u)
  assert.match(triggerSource, /id=\{triggerId\}/u)
  assert.match(
    triggerSource,
    /triggerRef\.current\.focus\(\{ preventScroll: true \}\)/u
  )
  assert.match(triggerSource, /restoreTriggerFocus\(\)/u)
  assert.match(triggerSource, /triggerId=\{triggerId\}/u)
  assert.match(triggerSource, /onRequestRestoreFocus=\{restoreTriggerFocus\}/u)
  assert.match(dialogSource, /triggerId=\{triggerId\}/u)
  assert.match(dialogSource, /onOpenChangeComplete=/u)
  assert.match(dialogSource, /if \(!nextOpen\) onRequestRestoreFocus\(\)/u)
})

test("the heavy command palette is split out of the initial search shell", () => {
  assert.match(triggerSource, /dynamic\(/u)
  assert.match(triggerSource, /import\("\.\/site-search-dialog"\)/u)
  assert.match(triggerSource, /ssr: false/u)
  assert.match(triggerSource, /\{hasOpened \? \(/u)
  assert.match(triggerSource, /Opening search/u)
  assert.doesNotMatch(triggerSource, /className="sr-only"/u)
  assert.doesNotMatch(triggerSource, /components\/command/u)
  assert.doesNotMatch(triggerSource, /useRouter/u)
  assert.doesNotMatch(triggerSource, /registry\.json/u)

  for (const primitive of [
    "Command",
    "CommandDialog",
    "CommandInput",
    "CommandList",
    "CommandEmpty",
    "CommandGroup",
    "CommandItem",
  ]) {
    assert.match(dialogSource, new RegExp(`${primitive},`, "u"))
  }
})

test("the generated search index loads on first palette mount", () => {
  assert.match(dialogSource, /void loadSearchIndex\(\)/u)
  assert.match(dialogSource, /pathname === "\/aq-ui"/u)
  assert.match(dialogSource, /pathname\.startsWith\("\/aq-ui\/"\)/u)
  assert.match(dialogSource, /\/search-index\.json/u)
  assert.doesNotMatch(dialogSource, /\/registry\.json/u)
  assert.match(dialogSource, /AbortController/u)
  assert.match(dialogSource, /Loading the search index/u)
  assert.match(dialogSource, /Search results could not be loaded/u)
  assert.match(dialogSource, /Try again/u)
  assert.match(dialogSource, /No results found/u)
  assert.match(dialogSource, /<div hidden=\{!open\}>/u)
  assert.doesNotMatch(dialogSource, /router\.prefetch/u)
})

test("search ranks canonical names before descriptive fuzzy matches", () => {
  assert.match(dialogSource, /filter=\{scoreSearchResult\}/u)
  assert.match(dialogSource, /createSearchValue\(item\.name, item\.title\)/u)
  assert.match(dialogSource, /keywords=\{\[item\.description\]\}/u)
  assert.match(dialogSource, /label="Search documentation"/u)
})

test("loading and retry controls stay outside the command listbox", () => {
  const listStart = dialogSource.indexOf("<CommandList")
  const listEnd = dialogSource.indexOf("</CommandList>")
  const status = dialogSource.indexOf('role="status"')
  const alert = dialogSource.indexOf('role="alert"')
  const retry = dialogSource.indexOf("Try again")

  assert.ok(listStart > -1 && listEnd > listStart)
  assert.ok(status > -1 && status < listStart)
  assert.ok(alert > -1 && alert < listStart)
  assert.ok(retry > -1 && retry < listStart)
  assert.match(dialogSource, /<Command[\s\S]*?className=/u)
})

test("search stays usable on narrow and short viewports", () => {
  assert.match(triggerSource, /size-8 shrink-0/u)
  assert.match(triggerSource, /hidden sm:inline/u)
  assert.match(triggerSource, /rtl:translate-x-1\/2/u)
  assert.match(dialogSource, /top-4 max-h-\[calc\(100dvh-2rem\)\]/u)
  assert.match(dialogSource, /max-h-\[calc\(100dvh-8rem\)\]/u)
  assert.match(dialogSource, /overscroll-contain/u)
  assert.match(dialogSource, /scrollbar-width:thin/u)
})

test("long results, RTL identifiers, focus, and keyboard help are explicit", () => {
  assert.match(dialogSource, /const inputRef = useRef<HTMLInputElement/u)
  assert.match(dialogSource, /if \(open\) inputRef\.current\?\.focus\(\)/u)
  assert.match(
    dialogSource,
    /<CommandList[\s\S]*?aria-busy=\{loadState === "loading"\}/u
  )
  assert.match(dialogSource, /dir="ltr"/u)
  assert.match(dialogSource, /title=\{item\.description\}/u)
  assert.match(dialogSource, />\s*Navigate\s*</u)
  assert.match(dialogSource, />\s*Open\s*</u)
  assert.match(dialogSource, />\s*Close\s*</u)
})

test("all registry types and landing pages have canonical routes", () => {
  const expectedRoutes = [
    ["registry:ui", "/components/${item.name}/"],
    ["registry:hook", "/hooks/${item.name}/"],
    ["registry:style", "/utilities/${item.name}/"],
    ["registry:lib", "/utilities/${item.name}/"],
    ["Home", "/"],
    ["Getting Started", "/getting-started/"],
    ["Components", "/components/"],
    ["Hooks", "/hooks/"],
    ["Editors", "/editors/"],
    ["Utilities", "/utilities/"],
    ["CLI", "/cli/"],
    ["Registry authoring", "/contributing/registry-authoring/"],
  ]

  for (const [label, route] of expectedRoutes) {
    assert.match(
      dialogSource,
      new RegExp(label.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u")
    )
    assert.ok(dialogSource.includes(route), `Missing search route ${route}`)
  }

  assert.match(dialogSource, /router\.push\(href\)/u)
  assert.match(dialogSource, /onOpenChange\(false\)\s*\n\s*router\.push/u)
})
