import assert from "node:assert/strict"
import { Buffer } from "node:buffer"
import { readFileSync, readdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")

function read(relativePath) {
  return readFileSync(resolve(docsRoot, relativePath), "utf8")
}

test("shared registry detail uses detailed per-item API records", () => {
  const detail = read("components/registry-item-detail.tsx")
  const componentPage = read("app/components/[name]/page.tsx")
  const hookPage = read("app/hooks/[name]/page.tsx")
  const utilityPage = read("app/utilities/[name]/page.tsx")

  assert.match(detail, /getRegistryRecord/)
  assert.match(
    detail,
    /const record = getRegistryRecord\(item\.name\) \?\? item/
  )
  assert.match(
    detail,
    /<ApiReference item=\{record\} compactMembers=\{item\.name === "button"\} \/>/
  )
  assert.doesNotMatch(detail, /item\.meta\.api\.map/)
  assert.ok(detail.indexOf("<ApiReference") > detail.indexOf("<ButtonGuide"))
  assert.ok(
    detail.indexOf("<ApiReference") <
      detail.indexOf("item.registryDependencies")
  )
  assert.match(
    componentPage,
    /<RegistryItemDetail item=\{item\} collection="components" \/>/
  )
  assert.match(
    hookPage,
    /<RegistryItemDetail item=\{item\} collection="hooks" \/>/
  )
  assert.match(
    utilityPage,
    /<RegistryItemDetail item=\{item\} collection="utilities" \/>/
  )
})

test("registry details expose compact, accessible collection navigation", () => {
  const detail = read("components/registry-item-detail.tsx")

  assert.match(detail, /href=\{`\/\$\{backCollection\}\/`\}/)
  assert.match(detail, /Back to \{collectionLabel\}/)
  assert.match(detail, /prefetch=\{false\}/)
  assert.match(detail, /mb-5 flex w-fit/)
  assert.match(detail, /hover:underline/)
  assert.match(detail, /rtl:rotate-180/)
  assert.match(detail, /focus-visible:outline/)
  for (const editor of [
    "code-block",
    "code-editor",
    "markdown-editor",
    "markdown-renderer",
    "rich-text-editor",
  ]) {
    assert.match(detail, new RegExp(`"${editor}"`, "u"))
  }
  assert.match(
    detail,
    /const backCollection = isEditor \? "editors" : collection/u
  )
  assert.match(detail, /isEditor\s*\n\s*\? "Editors"/u)
})

test("API shell stays server rendered with focused client islands", () => {
  const apiReference = read("components/api-reference.tsx")
  const apiQuickStart = read("components/api-quick-start.tsx")
  const entryCards = read("components/api-entry-cards.tsx")
  const copyButton = read("components/copy-button.tsx")
  const lazyDetails = read("components/lazy-api-details.tsx")

  assert.doesNotMatch(apiReference, /^"use client"/m)
  assert.doesNotMatch(entryCards, /^"use client"/m)
  assert.match(apiQuickStart, /^"use client"/m)
  assert.match(copyButton, /^"use client"/m)
  assert.match(lazyDetails, /^"use client"/m)
  assert.match(apiQuickStart, /<CopyButton/)
  assert.match(copyButton, /aria-label=\{label\}/)
  assert.match(copyButton, /className="sr-only" aria-live="polite"/)
})

test("quick start renders shared TSX syntax tokens safely and accessibly", () => {
  const apiReference = read("components/api-reference.tsx")
  const apiQuickStart = read("components/api-quick-start.tsx")
  const highlighter = read(
    "../../packages/registry/src/lib/code-highlighter.ts"
  )
  const quickStartStart = apiReference.indexOf("function QuickStart")
  const quickStartEnd = apiReference.indexOf(
    "function CompactReference",
    quickStartStart
  )

  assert.ok(quickStartStart >= 0, "QuickStart must remain a named component.")
  assert.ok(
    quickStartEnd > quickStartStart,
    "QuickStart source must be independently inspectable."
  )

  const quickStart = apiReference.slice(quickStartStart, quickStartEnd)

  assert.match(apiReference, /from "@aq-ui\/registry\/lib\/code-highlighter"/)
  assert.match(
    highlighter,
    /const codeHighlightClassName = "aq-code-highlight"/
  )
  assert.match(apiReference, /function encodeHighlight/)
  assert.match(apiReference, /value\.toString\(36\)/)
  assert.match(
    quickStart,
    /encodeHighlight\(highlightCodeLines\(code,\s*"tsx"\)\)/
  )
  assert.match(quickStart, /<ApiQuickStart/)
  assert.doesNotMatch(
    apiQuickStart,
    /import\("@aq-ui\/registry\/lib\/code-highlighter"\)/
  )
  assert.match(apiQuickStart, /aq-code-highlight/)
  assert.match(apiQuickStart, /function renderHighlightedCode/)
  assert.match(apiQuickStart, /encodedRanges\.split\(","\)/)
  assert.match(apiQuickStart, /className=\{className\}/)
  assert.match(apiQuickStart, /code\.slice\(start, start \+ length\)/)
  assert.doesNotMatch(apiQuickStart, /aria-hidden="true"/)
  assert.doesNotMatch(apiQuickStart, /className="sr-only select-none"/)
  assert.doesNotMatch(apiQuickStart, /dangerouslySetInnerHTML/)

  assert.match(apiQuickStart, /<CopyButton/)
  assert.match(apiQuickStart, /label="Copy quick start"/)
  assert.match(apiQuickStart, /<pre\s+tabIndex=\{0\}/)
  assert.match(
    apiQuickStart,
    /aria-label=\{`\$\{title\} quick start\. Use arrow keys to scroll\.`\}/
  )
})

test("API reference exposes quick start, anchors, contracts, and source", () => {
  const apiReference = read("components/api-reference.tsx")
  const apiQuickStart = read("components/api-quick-start.tsx")
  const entryCards = read("components/api-entry-cards.tsx")

  assert.match(apiQuickStart, />Quick start</)
  assert.match(apiReference, />Exports</)
  assert.match(apiReference, /href="#source"/)
  assert.match(apiReference, /href=\{`#\$\{exportAnchor/)
  assert.match(apiReference, /id=\{exportAnchor/)
  assert.match(apiReference, /SSR-safe/)
  assert.match(apiReference, /Client module/)
  assert.match(entryCards, /\{entry\.signature \? \(/)
  assert.match(entryCards, /entry\.description/)
  assert.match(entryCards, /entry\.propsType/)
  assert.match(entryCards, /entry\.returns/)
  assert.match(entryCards, /members=\{props\}/)
  assert.match(entryCards, /members=\{entry\.parameters \?\? \[\]\}/)
  assert.match(entryCards, /members=\{entry\.members \?\? \[\]\}/)
  assert.match(entryCards, /member\.default \?\? "—"/)
  assert.match(entryCards, /Re-exported from/)
  assert.match(entryCards, /Type contract for/)
  assert.match(entryCards, /export for composing/)
  assert.match(entryCards, /<dl /)
  assert.match(entryCards, /<table /)
  assert.match(entryCards, /const hasDefaults =/)
  assert.match(entryCards, /const hasDescriptions =/)
  assert.match(entryCards, /safeCallableUsage\(entry, entry\.usage\)/)
})

test("API export anchors remain unique when names differ only by case", async () => {
  const helper = read("lib/api-anchor.ts")
  const javascript = ts.transpileModule(helper, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText
  const anchorModule = await import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
  )
  const entries = [{ name: "toast" }, { name: "Toast" }]

  assert.equal(
    anchorModule.exportAnchor("toast", "toast", "api", entries),
    "api-toast-toast"
  )
  assert.equal(
    anchorModule.exportAnchor("toast", "Toast", "api", entries),
    "api-toast-toast-2"
  )
})

test("large APIs load rich details from the static record on demand", () => {
  const apiReference = read("components/api-reference.tsx")
  const lazyDetails = read("components/lazy-api-details.tsx")

  assert.match(apiReference, /const lazyDetails = api\.length > 8/)
  assert.match(
    apiReference,
    /const deferDetails = compactMembers \|\| lazyDetails/
  )
  assert.match(apiReference, /<LazyApiDetails name=\{item\.name\} \/>/)
  assert.match(lazyDetails, /const recordRequests = new Map/)
  assert.match(
    lazyDetails,
    /fetch\(`\.\.\/\.\.\/r\/\$\{encodeURIComponent\(name\)\}\.json`\)/
  )
  assert.match(lazyDetails, /Show API details/)
  assert.match(lazyDetails, /aria-expanded=\{expanded\}/)
  assert.match(lazyDetails, /<ApiEntryCards item=\{record\}/)
})

test("Button summary exposes every export and defers structured details", () => {
  const apiReference = read("components/api-reference.tsx")
  const lazyDetails = read("components/lazy-api-details.tsx")
  const buttonRecord = JSON.parse(read("public/r/button.json"))
  const summaryStart = apiReference.indexOf('<p className="mt-1">')
  const summaryEnd = apiReference.indexOf("</p>", summaryStart)
  const summary = apiReference.slice(summaryStart, summaryEnd)

  assert.deepEqual(
    buttonRecord.meta.api.map((entry) => entry.name),
    ["Button", "ButtonProps", "buttonVariants"]
  )
  assert.match(apiReference, /anchoredIndex=\{lazyDetails\}/)
  assert.match(apiReference, /\{deferDetails \? <LazyApiDetails/)
  assert.match(lazyDetails, /<ApiEntryCards item=\{record\}/)
  assert.ok(summaryStart >= 0)
  assert.doesNotMatch(summary, /<a|href=/)
})

test("Accordion curated quick start overrides generic record usage", async () => {
  const helper = read("lib/api-reference-quick-start.ts")
  const javascript = ts.transpileModule(helper, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText
  const quickStartModule = await import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
  )
  const result = quickStartModule.quickStart(
    {
      name: "accordion",
      title: "Accordion",
      description: "Accordion",
      type: "registry:ui",
      meta: {
        usage: {
          importPath: "@/components/ui/accordion",
          importStatement:
            'import { Accordion } from "@/components/ui/accordion"',
          primaryExport: "Accordion",
          example: "<Accordion />",
        },
      },
    },
    [{ name: "Accordion", kind: "const" }]
  )

  assert.match(result, /AccordionContent,/)
  assert.match(result, /AccordionItem,/)
  assert.match(result, /AccordionTrigger,/)
  assert.match(result, /<Accordion defaultValue=\{\["item-1"\]\}>/)
  assert.match(result, /<AccordionItem value="item-1">/)
  assert.notEqual(result.trim(), "<Accordion />")

  const buttonRecord = JSON.parse(read("public/r/button.json"))
  const buttonResult = quickStartModule.quickStart(
    buttonRecord,
    buttonRecord.meta.api
  )
  assert.match(
    buttonResult,
    /^import \{ Button \} from "@\/components\/ui\/button"/
  )
  assert.match(buttonResult, /<Button type="button">Save changes<\/Button>/)
})

test("client APIs include a copyable Next.js client boundary", async () => {
  const helper = read("lib/api-reference-quick-start.ts")
  const javascript = ts.transpileModule(helper, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText
  const quickStartModule = await import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#client`
  )

  for (const name of ["code-editor", "use-async"]) {
    const record = JSON.parse(read(`public/r/${name}.json`))
    const result = quickStartModule.quickStart(record, record.meta.api)
    assert.match(result, /^"use client"\n\nimport /)
    if (name === "use-async") {
      assert.match(record.meta.usage.example, /\/\* arguments \*\//u)
      assert.doesNotMatch(result, /\/\*|arguments/u)
      assert.match(
        result,
        /useAsync\(\n {4}async \(signal: AbortSignal, id: string\) =>/
      )
      assert.match(result, /profile\.execute\("42"\)/)
    } else {
      assert.match(result, /<CodeEditor \/>/)
    }
  }

  const requiredRecord = {
    name: "required-hook",
    title: "Required hook",
    description: "Requires input.",
    type: "registry:hook",
    meta: {
      ssr: false,
      usage: {
        importPath: "@/hooks/required-hook",
        importStatement: 'import { useRequired } from "@/hooks/required-hook"',
        primaryExport: "useRequired",
        example: "const result = useRequired(/* arguments */)",
      },
    },
  }
  const requiredApi = [
    {
      name: "useRequired",
      kind: "function",
      parameters: [{ name: "value", kind: "parameter", type: "string" }],
    },
  ]
  const requiredResult = quickStartModule.quickStart(
    requiredRecord,
    requiredApi
  )
  assert.match(requiredResult, /import \{ useRequired \}/)
  assert.doesNotMatch(requiredResult, /useRequired\(|arguments/)

  const optionalResult = quickStartModule.quickStart(
    {
      ...requiredRecord,
      name: "optional-hook",
      meta: {
        ...requiredRecord.meta,
        usage: {
          ...requiredRecord.meta.usage,
          example: "const result = useRequired(/* arguments */)",
        },
      },
    },
    [
      {
        ...requiredApi[0],
        parameters: [
          {
            name: "options",
            kind: "parameter",
            type: "Options",
            optional: true,
          },
        ],
      },
    ]
  )
  assert.match(optionalResult, /const result = useRequired\(\)/)
  assert.doesNotMatch(optionalResult, /arguments/)

  const zeroArgumentResult = quickStartModule.quickStart(
    {
      ...requiredRecord,
      name: "ready-hook",
      meta: {
        ...requiredRecord.meta,
        usage: {
          ...requiredRecord.meta.usage,
          example: "const ready = useReady(/* arguments */)",
        },
      },
    },
    [
      {
        name: "useReady",
        kind: "function",
        signature: "function useReady(): boolean",
      },
    ]
  )
  assert.match(zeroArgumentResult, /const ready = useReady\(\)/)

  for (const file of readdirSync(resolve(docsRoot, "public/r"))) {
    if (!file.endsWith(".json")) continue
    const record = JSON.parse(read(`public/r/${file}`))
    const result = quickStartModule.quickStart(record, record.meta?.api ?? [])
    assert.doesNotMatch(result, /\/\* arguments \*\//u, record.name)
  }
})

test("long API and source code remain keyboard scrollable", () => {
  const apiQuickStart = read("components/api-quick-start.tsx")
  const entryCards = read("components/api-entry-cards.tsx")
  const source = read("components/registry-source.tsx")

  assert.match(apiQuickStart, /tabIndex=\{0\}/)
  assert.match(apiQuickStart, /overflow-x-auto/)
  assert.match(entryCards, /max-w-full overflow-x-auto/)
  assert.match(entryCards, /min-w-\[38rem\]/)
  assert.match(source, /id="source"/)
  assert.match(source, /data-slot="code-block-pre"\s+tabIndex=\{0\}/)
  assert.match(source, /Use arrow keys to scroll/)
  assert.match(source, /<CopyButton/)
  assert.match(source, /import\("@aq-ui\/registry\/lib\/code-highlighter"\)/)
  assert.match(source, /highlightCodeLines/)
  assert.match(source, /sourceLanguage\(file\.path\)/)
  assert.match(source, /data-slot="code-block-line"/)
  assert.match(source, /className="sr-only select-none"/)
})

test("docs accept the rich per-record registry API contract", () => {
  const registry = read("lib/registry.ts")

  for (const field of [
    "signature",
    "description",
    "source",
    "propsType",
    "props",
    "members",
    "parameters",
    "returns",
    "usage",
  ]) {
    assert.match(registry, new RegExp("  " + field + "\\?:"))
  }
  for (const field of [
    "optional",
    "readonly",
    "type",
    "default",
    "description",
  ]) {
    assert.match(registry, new RegExp("  " + field + "\\?:"))
  }
  assert.match(registry, /importPath: string/)
  assert.match(registry, /importStatement: string/)
  assert.match(registry, /primaryExport\?: string/)
  assert.match(registry, /example\?: string/)
  assert.match(registry, /ssr\?: boolean/)
})
