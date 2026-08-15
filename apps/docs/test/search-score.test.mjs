import assert from "node:assert/strict"
import { Buffer } from "node:buffer"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const source = readFileSync(resolve(docsRoot, "lib/search-score.ts"), "utf8")
const javascript = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText
const scoring = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#search-score`
)

test("exact names rank ahead of incidental description matches", () => {
  const useAsync = scoring.scoreSearchResult(
    scoring.createSearchValue("use-async", "Use Async"),
    "async",
    ["Run an asynchronous task"]
  )
  const codeBlock = scoring.scoreSearchResult(
    scoring.createSearchValue("code-block", "Code Block"),
    "async",
    ["Syntax highlighted source code"]
  )

  assert.equal(useAsync, 0.9)
  assert.equal(codeBlock, 0)
  assert.ok(useAsync > codeBlock)
})

test("ranking favors exact phrases, prefixes, then descriptive keywords", () => {
  assert.equal(
    scoring.scoreSearchResult(
      scoring.createSearchValue("color-picker", "Color Picker"),
      "color picker"
    ),
    1
  )
  assert.equal(
    scoring.scoreSearchResult(
      scoring.createSearchValue("use-async", "Use Async"),
      "use asyn"
    ),
    0.95
  )
  assert.equal(
    scoring.scoreSearchResult(
      scoring.createSearchValue("getting-started", "Getting Started"),
      "setup",
      ["installation setup introduction"]
    ),
    0.55
  )
})

test("multi-word token matching is deterministic and unrelated items are hidden", () => {
  assert.equal(
    scoring.scoreSearchResult(
      scoring.createSearchValue("markdown-renderer", "Markdown Renderer"),
      "markdown code",
      ["Safe fenced code output"]
    ),
    0.55
  )
  assert.equal(
    scoring.scoreSearchResult(
      scoring.createSearchValue("accordion", "Accordion"),
      "async"
    ),
    0
  )
})

test("initialisms and one-edit typos remain discoverable without matching noise", () => {
  assert.equal(
    scoring.scoreSearchResult(
      scoring.createSearchValue("rich-text-editor", "Rich Text Editor"),
      "rte"
    ),
    0.88
  )
  assert.equal(
    scoring.scoreSearchResult(
      scoring.createSearchValue("button", "Button"),
      "buton"
    ),
    0.7
  )
  assert.equal(
    scoring.scoreSearchResult(
      scoring.createSearchValue("accordion", "Accordion"),
      "acocrdion"
    ),
    0.7
  )
})

test("short initialisms do not lose to incidental inner substrings", () => {
  const richTextEditor = scoring.scoreSearchResult(
    scoring.createSearchValue("rich-text-editor", "Rich Text Editor"),
    "rte"
  )
  const gettingStarted = scoring.scoreSearchResult(
    scoring.createSearchValue("getting-started", "Getting Started"),
    "rte"
  )

  assert.ok(richTextEditor > 0)
  assert.equal(gettingStarted, 0)
  assert.ok(richTextEditor > gettingStarted)
})
