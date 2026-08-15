import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")

const catalogPages = [
  "app/components/page.tsx",
  "app/editors/page.tsx",
  "components/catalog-search.tsx",
  "components/registry-item-detail.tsx",
]

function componentLinks(path) {
  const source = ts.createSourceFile(
    path,
    readFileSync(path, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )
  const links = []

  function visit(node) {
    if (
      ts.isJsxOpeningElement(node) &&
      ts.isIdentifier(node.tagName) &&
      node.tagName.text === "Link"
    ) {
      links.push(node)
    }

    ts.forEachChild(node, visit)
  }

  visit(source)
  return { links, source }
}

test("static catalog links do not eagerly prefetch destination routes", () => {
  for (const relativePath of catalogPages) {
    const path = resolve(docsRoot, relativePath)
    const { links, source } = componentLinks(path)

    assert.ok(links.length > 0, `${relativePath} must contain catalog links.`)

    for (const link of links) {
      const prefetch = link.attributes.properties.find(
        (property) =>
          ts.isJsxAttribute(property) && property.name.text === "prefetch"
      )

      assert.ok(
        prefetch &&
          ts.isJsxAttribute(prefetch) &&
          ts.isJsxExpression(prefetch.initializer) &&
          prefetch.initializer.expression?.kind === ts.SyntaxKind.FalseKeyword,
        `${relativePath} catalog links must set prefetch={false}: ${link.getText(source)}`
      )
    }
  }
})
