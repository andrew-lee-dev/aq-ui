import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const workspaceRoot = resolve(docsRoot, "../..")

function parseSource(path) {
  return ts.createSourceFile(
    path,
    readFileSync(path, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )
}

function findVariable(sourceFile, variableName) {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === variableName
      ) {
        return declaration.initializer
      }
    }
  }
  throw new Error(`Could not find ${variableName} in ${sourceFile.fileName}.`)
}

function propertyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text
  throw new Error(
    `Unsupported example key in ${name.getSourceFile().fileName}.`
  )
}

function readMapKeys(file, variableName) {
  const sourceFile = parseSource(resolve(docsRoot, file))
  const initializer = findVariable(sourceFile, variableName)
  if (!initializer || !ts.isObjectLiteralExpression(initializer)) {
    throw new Error(`${variableName} must be an object literal.`)
  }
  return initializer.properties.map((property) => {
    if (!ts.isPropertyAssignment(property)) {
      throw new Error(`${variableName} must use explicit property assignments.`)
    }
    return propertyName(property.name)
  })
}

function readSetValues(file, variableName) {
  const sourceFile = parseSource(resolve(docsRoot, file))
  const initializer = findVariable(sourceFile, variableName)
  if (
    !initializer ||
    !ts.isNewExpression(initializer) ||
    initializer.arguments?.length !== 1 ||
    !ts.isArrayLiteralExpression(initializer.arguments[0])
  ) {
    throw new Error(
      `${variableName} must be initialized from an array literal.`
    )
  }
  return initializer.arguments[0].elements.map((element) => {
    if (!ts.isStringLiteral(element)) {
      throw new Error(`${variableName} may only contain string literals.`)
    }
    return element.text
  })
}

test("live examples cover every public UI component exactly once", () => {
  const registry = JSON.parse(
    readFileSync(resolve(workspaceRoot, "registry.json"), "utf8")
  )
  const expected = registry.items
    .filter((item) => item.type === "registry:ui")
    .map((item) => item.name)
    .sort()

  const groups = [
    [
      "components/examples/core-foundation-examples.tsx",
      "CoreFoundationExamples",
      "foundationExampleNames",
    ],
    [
      "components/examples/core-form-examples.tsx",
      "CoreFormExamples",
      "formExampleNames",
    ],
    [
      "components/examples/core-control-examples.tsx",
      "CoreControlExamples",
      "controlExampleNames",
    ],
    [
      "components/examples/core-utility-examples.tsx",
      "CoreUtilityExamples",
      "utilityExampleNames",
    ],
    [
      "components/examples/advanced-navigation-examples.tsx",
      "AdvancedNavigationExamples",
      "navigationExampleNames",
    ],
    [
      "components/examples/advanced-overlay-examples.tsx",
      "AdvancedOverlayExamples",
      "overlayExampleNames",
    ],
    [
      "components/examples/advanced-selection-examples.tsx",
      "AdvancedSelectionExamples",
      "selectionExampleNames",
    ],
    [
      "components/examples/advanced-layout-examples.tsx",
      "AdvancedLayoutExamples",
      "layoutExampleNames",
    ],
    [
      "components/examples/advanced-data-examples.tsx",
      "AdvancedDataExamples",
      "dataExampleNames",
    ],
    [
      "components/examples/advanced-workflow-examples.tsx",
      "AdvancedWorkflowExamples",
      "workflowExampleNames",
    ],
    [
      "components/examples/advanced-conversation-examples.tsx",
      "AdvancedConversationExamples",
      "conversationExampleNames",
    ],
  ]
  const componentExampleFile = "components/examples/component-example.tsx"
  const groupKeys = groups.flatMap(([file, mapName]) =>
    readMapKeys(file, mapName)
  )
  const editorKeys = readSetValues(componentExampleFile, "editorExampleNames")
  const actual = [...groupKeys, ...editorKeys]

  assert.equal(
    new Set(actual).size,
    actual.length,
    "Example keys must be unique."
  )
  assert.deepEqual(actual.toSorted(), expected)
  for (const [file, mapName, setName] of groups) {
    assert.deepEqual(
      readSetValues(componentExampleFile, setName).toSorted(),
      readMapKeys(file, mapName).toSorted(),
      `${setName} must match ${mapName}.`
    )
  }
})
