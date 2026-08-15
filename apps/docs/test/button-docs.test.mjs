import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")

function read(relativePath) {
  return readFileSync(resolve(docsRoot, relativePath), "utf8")
}

function stringArray(variableName) {
  const path = resolve(docsRoot, "lib/button-docs.ts")
  const source = ts.createSourceFile(
    path,
    readFileSync(path, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  )

  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (
        !ts.isIdentifier(declaration.name) ||
        declaration.name.text !== variableName ||
        !declaration.initializer
      ) {
        continue
      }

      const initializer = ts.isAsExpression(declaration.initializer)
        ? declaration.initializer.expression
        : declaration.initializer
      assert.ok(
        ts.isArrayLiteralExpression(initializer),
        variableName + " must be an array literal."
      )
      return initializer.elements.map((element) => {
        assert.ok(
          ts.isStringLiteral(element),
          variableName + " may only contain strings."
        )
        return element.text
      })
    }
  }

  throw new Error("Could not find " + variableName + ".")
}

test("Button docs expose every supported variant and size", () => {
  assert.deepEqual(stringArray("buttonVariantOptions"), [
    "default",
    "outline",
    "secondary",
    "ghost",
    "destructive",
    "link",
  ])
  assert.deepEqual(stringArray("buttonSizeOptions"), [
    "xs",
    "sm",
    "default",
    "lg",
    "icon-xs",
    "icon-sm",
    "icon",
    "icon-lg",
  ])

  const example = read("components/examples/core-foundation-examples.tsx")
  assert.match(example, /buttonVariantOptions\.map/)
  assert.match(example, /buttonSizeOptions\.map/)
  assert.match(example, /loading=\{loading\}/)
  assert.match(example, /loadingPosition=\{loadingPosition\}/)
  assert.match(example, /loadingText=\{iconOnly \? null : "Saving changes"\}/)
  assert.doesNotMatch(example, /disabled=\{disabled \|\| loading\}/)
  assert.doesNotMatch(example, /aria-busy=\{loading \|\| undefined\}/)
  assert.match(example, /type="button"/)
  assert.match(example, /type="submit"/)
  assert.match(example, /href="#button-usage"/)
  assert.match(example, /className=\{buttonVariants\(\{ variant: "link" \}\)\}/)
  assert.doesNotMatch(example, /render=\{<a /)
})

test("Button route documents usage, props, defaults, and accessibility", () => {
  const page = read("app/components/[name]/page.tsx")
  const guide = read("components/guides/button-guide.tsx")
  const preview = read("components/examples/component-example.tsx")

  assert.match(page, /item\.name === "button" \? <ButtonGuide \/> : null/)
  assert.doesNotMatch(preview, /Use the controls/)
  assert.doesNotMatch(guide, /^"use client"/m)

  for (const heading of ["Usage", "Props and defaults", "Accessibility"]) {
    assert.match(guide, new RegExp(">" + heading + "<"))
  }

  for (const prop of [
    "variant",
    "size",
    "render",
    "nativeButton",
    "focusableWhenDisabled",
    "disabled",
    "loading",
    "loadingText",
    "loadingPosition",
    "loadingIndicator",
    "type",
    "className",
  ]) {
    assert.match(guide, new RegExp('name: "' + prop + '"'))
  }

  assert.match(guide, /buttonVariants/)
  assert.match(guide, /does not create link semantics/)
  assert.match(guide, /null intentionally hides/)
  assert.match(guide, /aria-label/)
  assert.match(guide, /aria-busy/)
  assert.match(guide, /Enter and Space/)
})

test("Button Storybook stories share the complete docs matrix", () => {
  const story = read("stories/core/button.stories.tsx")

  assert.match(story, /options: buttonVariantOptions/)
  assert.match(story, /options: buttonSizeOptions/)
  for (const loadingProp of [
    "loading",
    "loadingText",
    "loadingPosition",
    "loadingIndicator",
  ]) {
    assert.match(story, new RegExp("    " + loadingProp + ": \\{"))
  }
  assert.match(story, /export const States/)
  assert.match(story, /export const NavigationAndFormSemantics/)
  assert.match(story, /size="icon-xs"/)
  assert.match(story, /size="icon-sm"/)
  assert.match(story, /size="icon-lg"/)
  assert.match(story, /focusableWhenDisabled/)
  assert.match(story, /loading loadingText="Saving…"/)
  assert.match(story, /loadingPosition="end"/)
  assert.match(story, /loadingIndicator=/)
  assert.doesNotMatch(story, /disabled aria-busy="true"/)
  assert.match(story, /className=\{buttonVariants\(\{ variant: "link" \}\)\}/)
  assert.doesNotMatch(story, /render=\{<a /)
})
