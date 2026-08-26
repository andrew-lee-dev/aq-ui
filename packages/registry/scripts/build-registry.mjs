import { createHash } from "node:crypto"
import {
  mkdir,
  readFile,
  readdir,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import process from "node:process"
import ts from "typescript"

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const workspaceRoot = resolve(packageRoot, "../..")
const publicRoot = join(workspaceRoot, "apps/docs/public")
const outputRoot = join(publicRoot, "r")
const checkOnly = process.argv.includes("--check")
const cliPackage = JSON.parse(
  await readFile(join(workspaceRoot, "packages/cli/package.json"), "utf8")
)
const registryPackage = JSON.parse(
  await readFile(join(packageRoot, "package.json"), "utf8")
)
const supportedExternalDependencies = {
  ...registryPackage.devDependencies,
  ...registryPackage.dependencies,
}
const version = cliPackage.version
if (typeof version !== "string" || version.length === 0) {
  throw new Error("packages/cli/package.json must define a version.")
}

const sourceGroups = [
  {
    directory: "src/components",
    extension: ".tsx",
    type: "registry:ui",
    target: "components/ui",
  },
  {
    directory: "src/hooks",
    extension: ".ts",
    type: "registry:hook",
    target: "hooks",
  },
  {
    directory: "src/lib",
    extension: ".ts",
    type: "registry:lib",
    target: "lib",
  },
  {
    directory: "src/styles",
    extension: ".css",
    type: "registry:style",
    target: "styles",
  },
]

// These implementation details are emitted as addressable registry records so
// dependency resolution remains granular, but they are omitted from the public
// catalog and its 75-component / 72-hook contract.
const internalNames = new Map([
  ["_observer-pools", "hook-observer-pools"],
  ["_storage", "hook-storage"],
  ["_target", "hook-target"],
  ["code-block-copy-button", "code-block-copy-button"],
  ["code-highlighter", "code-highlighter"],
  ["code-language-registry", "code-language-registry"],
  ["code-language-preset", "code-language-preset"],
  ["code-language-plaintext", "code-language-plaintext"],
  ["code-language-javascript", "code-language-javascript"],
  ["code-language-typescript", "code-language-typescript"],
  ["code-language-jsx", "code-language-jsx"],
  ["code-language-tsx", "code-language-tsx"],
  ["code-language-json", "code-language-json"],
  ["code-language-html", "code-language-html"],
  ["code-language-css", "code-language-css"],
  ["code-language-markdown", "code-language-markdown"],
  ["code-language-yaml", "code-language-yaml"],
  ["code-language-sql", "code-language-sql"],
  ["rich-text-renderer", "rich-text-renderer"],
])

const forcedRegistryDependencies = new Map([
  ["rich-text-editor", ["rich-text-html", "rich-text-renderer"]],
])

const forcedExternalDependencies = new Map([["rich-text-html", ["happy-dom"]]])

const descriptions = {
  button:
    "Accessible action control with six variants, eight sizes, loading feedback, icon support, and Base UI composition.",
  "code-block":
    "SSR-safe syntax-highlighted code with line numbers, diffs, emphasis, filenames, and copy support.",
  "code-editor":
    "CodeMirror 6 editor with controlled state, lazy languages, diagnostics, search, folding, and token-aware themes.",
  "color-picker":
    "Accessible color area, hue and alpha controls, swatch, field, and controlled color formats.",
  "data-grid":
    "Virtualized TanStack data grid with sorting, filtering, resizing, pinning, visibility, and row selection.",
  "file-upload":
    "Keyboard-accessible drop zone with validation, progress, retry, cancellation, and transport-neutral uploads.",
  "markdown-editor":
    "CommonMark and GFM source editor with write, preview, split, formatting, uploads, and deferred rendering.",
  "markdown-renderer":
    "Sanitized CommonMark and GFM renderer with safe protocols, prefixed headings, and highlighted code fences.",
  "rich-text-editor":
    "Tiptap JSON editor and static renderer with production formatting, tables, media, mentions, and slash commands.",
  stepper:
    "Controlled or uncontrolled, linear-aware multi-step workflow with horizontal and vertical composition.",
  timeline:
    "Semantic, RTL-safe timeline primitives for events, status history, and activity feeds.",
  "tree-view":
    "Keyboard-navigable hierarchical view with selection, expansion, typeahead, and controlled state.",
}

const internalImportPattern =
  /@aq-ui\/registry\/(components|hooks|lib)\/([a-z0-9_-]+)/g
const packageImportPattern =
  /(?:from\s+|import\s*\()["']((?:@[^/"']+\/[^/"']+)|(?:[^./@][^/"']*))/g
const cssImportPattern = /@import\s+["']([^"']+)["']/g

function registryName(sourceName, type) {
  if (type === "registry:style" && sourceName === "globals") return "aq-neutral"
  return internalNames.get(sourceName) ?? sourceName
}

function packageName(specifier) {
  if (specifier.startsWith("@")) {
    return specifier.split("/").slice(0, 2).join("/")
  }
  return specifier.split("/")[0]
}

function transformImports(content) {
  return content
    .replaceAll("@aq-ui/registry/components/", "@/components/ui/")
    .replaceAll("@aq-ui/registry/hooks/", "@/hooks/")
    .replaceAll("@aq-ui/registry/lib/", "@/lib/")
}

async function registryContent(raw, sourceName, type) {
  if (type !== "registry:style" || sourceName !== "globals") {
    return raw
  }
  const utilities = await readFile(
    join(packageRoot, "src/styles/aq-tailwind.css"),
    "utf8"
  )
  return raw
    .replace('@import "./aq-tailwind.css";', utilities.trim())
    .replace(/^@source\s+[^;]+;\s*$/gmu, "")
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex")
}

function titleCase(value) {
  return value
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ")
}

function defaultDescription(name, type) {
  const kind = {
    "registry:hook": "React hook",
    "registry:lib": "shared library",
    "registry:style": "theme and style foundation",
    "registry:ui": "accessible component family",
  }[type]
  return `Open-code aq-ui ${kind ?? "registry item"} for ${titleCase(name)}.`
}

const maxApiSignatureLength = 360
const maxApiDescriptionLength = 280
const maxApiTypeLength = 240
const maxApiMembers = 48
const apiPrinter = ts.createPrinter({
  newLine: ts.NewLineKind.LineFeed,
  removeComments: true,
})

function compactApiText(value, maximum = maxApiTypeLength) {
  if (typeof value !== "string") return undefined
  const normalized = value.replace(/\s+/gu, " ").trim()
  if (!normalized) return undefined
  if (normalized.length <= maximum) return normalized
  return `${normalized.slice(0, maximum - 1).trimEnd()}…`
}

function nodeText(node, sourceFile, maximum = maxApiTypeLength) {
  return node ? compactApiText(node.getText(sourceFile), maximum) : undefined
}

function printedNodeText(node, sourceFile, maximum = maxApiTypeLength) {
  return node
    ? compactApiText(
        apiPrinter.printNode(ts.EmitHint.Unspecified, node, sourceFile),
        maximum
      )
    : undefined
}

function summarizedType(node, sourceFile) {
  if (ts.isTypeLiteralNode(node)) return "{ … }"
  if (ts.isIntersectionTypeNode(node) || ts.isUnionTypeNode(node)) {
    const separator = ts.isIntersectionTypeNode(node) ? " & " : " | "
    return compactApiText(
      node.types
        .map((type) => summarizedType(type, sourceFile))
        .join(separator),
      maxApiSignatureLength
    )
  }
  if (ts.isParenthesizedTypeNode(node)) {
    return `(${summarizedType(node.type, sourceFile)})`
  }
  return printedNodeText(node, sourceFile, maxApiSignatureLength)
}

function syntaxName(name, sourceFile) {
  if (!name) return undefined
  if (ts.isIdentifier(name) || ts.isPrivateIdentifier(name)) return name.text
  if (
    ts.isStringLiteral(name) ||
    ts.isNumericLiteral(name) ||
    ts.isNoSubstitutionTemplateLiteral(name)
  ) {
    return name.text
  }
  return nodeText(name, sourceFile, 120)
}

function jsDocCommentText(comment) {
  if (typeof comment === "string") return comment
  if (!comment || typeof comment[Symbol.iterator] !== "function")
    return undefined
  return [...comment]
    .map((part) => {
      if (typeof part === "string") return part
      if (typeof part?.text === "string") return part.text
      if (typeof part?.name?.text === "string") return part.name.text
      return ""
    })
    .join("")
}

function documentationCandidates(node) {
  const candidates = [node]
  if (ts.isVariableDeclaration(node)) {
    const statement = node.parent?.parent
    if (statement) candidates.push(statement)
  }
  return candidates
}

function jsDocMetadata(node, sourceFile) {
  let description
  let defaultValue
  let hidden = false
  let returns
  const parameters = new Map()

  for (const candidate of documentationCandidates(node)) {
    for (const document of ts.getJSDocCommentsAndTags(candidate)) {
      if (!ts.isJSDoc(document)) continue
      description ??= compactApiText(
        jsDocCommentText(document.comment),
        maxApiDescriptionLength
      )
      for (const tag of document.tags ?? []) {
        const tagName = tag.tagName.text.toLowerCase()
        const comment = compactApiText(
          jsDocCommentText(tag.comment),
          maxApiDescriptionLength
        )
        if (tagName === "default" || tagName === "defaultvalue") {
          defaultValue ??= comment
        } else if (tagName === "internal" || tagName === "private") {
          hidden = true
        } else if (tagName === "returns" || tagName === "return") {
          returns ??= comment
        } else if (ts.isJSDocParameterTag(tag)) {
          const name = syntaxName(tag.name, sourceFile)
          if (name && comment) parameters.set(name, comment)
        }
      }
    }
  }

  return { defaultValue, description, hidden, parameters, returns }
}

function inferredImportKind(name, typeOnly = false) {
  if (typeOnly) return "type"
  if (
    /^(?:create|generate|load|normalize|parse|register|use)[A-Z]/u.test(name)
  ) {
    return "function"
  }
  return "const"
}

function declarationKind(node) {
  if (ts.isInterfaceDeclaration(node)) return "interface"
  if (ts.isTypeAliasDeclaration(node)) return "type"
  if (ts.isFunctionDeclaration(node)) return "function"
  if (ts.isClassDeclaration(node)) return "class"
  if (ts.isEnumDeclaration(node)) return "enum"
  if (ts.isVariableDeclaration(node)) {
    return node.initializer &&
      (ts.isArrowFunction(node.initializer) ||
        ts.isFunctionExpression(node.initializer))
      ? "function"
      : "const"
  }
  return "const"
}

function declarationLine(node, sourceFile) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1
}

function declarationSignature(node, sourceFile, exportedName, kind, source) {
  if (
    ts.isImportSpecifier(node) ||
    ts.isImportClause(node) ||
    ts.isNamespaceImport(node) ||
    ts.isExportSpecifier(node)
  ) {
    const typePrefix = kind === "type" || kind === "interface" ? "type " : ""
    const sourceSuffix = source ? ` from ${JSON.stringify(source)}` : ""
    return `export ${typePrefix}{ ${exportedName} }${sourceSuffix}`
  }

  if (ts.isInterfaceDeclaration(node)) {
    const typeParameters = node.typeParameters?.length
      ? `<${node.typeParameters.map((item) => nodeText(item, sourceFile)).join(", ")}>`
      : ""
    const heritage = node.heritageClauses?.length
      ? ` ${node.heritageClauses.map((item) => nodeText(item, sourceFile)).join(" ")}`
      : ""
    return compactApiText(
      `interface ${exportedName}${typeParameters}${heritage}`,
      maxApiSignatureLength
    )
  }

  if (ts.isTypeAliasDeclaration(node)) {
    const typeParameters = node.typeParameters?.length
      ? `<${node.typeParameters.map((item) => nodeText(item, sourceFile)).join(", ")}>`
      : ""
    const type = summarizedType(node.type, sourceFile)
    return compactApiText(
      `type ${exportedName}${typeParameters} = ${type}`,
      maxApiSignatureLength
    )
  }

  if (ts.isFunctionDeclaration(node)) {
    const asyncPrefix = node.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword
    )
      ? "async "
      : ""
    const typeParameters = node.typeParameters?.length
      ? `<${node.typeParameters.map((item) => nodeText(item, sourceFile)).join(", ")}>`
      : ""
    const parameters = node.parameters
      .map((item) => nodeText(item, sourceFile))
      .join(", ")
    const returns = node.type ? `: ${nodeText(node.type, sourceFile)}` : ""
    return compactApiText(
      `${asyncPrefix}function ${exportedName}${typeParameters}(${parameters})${returns}`,
      maxApiSignatureLength
    )
  }

  if (ts.isClassDeclaration(node)) {
    const typeParameters = node.typeParameters?.length
      ? `<${node.typeParameters.map((item) => nodeText(item, sourceFile)).join(", ")}>`
      : ""
    const heritage = node.heritageClauses?.length
      ? ` ${node.heritageClauses.map((item) => nodeText(item, sourceFile)).join(" ")}`
      : ""
    return compactApiText(
      `class ${exportedName}${typeParameters}${heritage}`,
      maxApiSignatureLength
    )
  }

  if (ts.isEnumDeclaration(node)) return `enum ${exportedName}`

  if (ts.isVariableDeclaration(node)) {
    const declarationList = node.parent
    const declarationKeyword =
      declarationList.flags & ts.NodeFlags.Const
        ? "const"
        : declarationList.flags & ts.NodeFlags.Let
          ? "let"
          : "var"
    if (node.type) {
      return compactApiText(
        `${declarationKeyword} ${exportedName}: ${nodeText(node.type, sourceFile)}`,
        maxApiSignatureLength
      )
    }
    const initializer = node.initializer
    if (initializer && ts.isCallExpression(initializer)) {
      const callee = nodeText(initializer.expression, sourceFile, 100)
      const typeArguments = initializer.typeArguments?.length
        ? `<${initializer.typeArguments
            .map((item) => nodeText(item, sourceFile))
            .join(", ")}>`
        : ""
      return compactApiText(
        `${declarationKeyword} ${exportedName} = ${callee}${typeArguments}(…)`,
        maxApiSignatureLength
      )
    }
    if (
      initializer &&
      (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))
    ) {
      const asyncPrefix = initializer.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword
      )
        ? "async "
        : ""
      const typeParameters = initializer.typeParameters?.length
        ? `<${initializer.typeParameters
            .map((item) => nodeText(item, sourceFile))
            .join(", ")}>`
        : ""
      const parameters = initializer.parameters
        .map((item) => nodeText(item, sourceFile))
        .join(", ")
      const returns = initializer.type
        ? `: ${nodeText(initializer.type, sourceFile)}`
        : ""
      return compactApiText(
        `${declarationKeyword} ${exportedName} = ${asyncPrefix}${typeParameters}(${parameters})${returns} => …`,
        maxApiSignatureLength
      )
    }
    if (initializer) {
      const value = ts.isObjectLiteralExpression(initializer)
        ? "{ … }"
        : ts.isArrayLiteralExpression(initializer)
          ? "[…]"
          : nodeText(initializer, sourceFile, 160)
      return compactApiText(
        `${declarationKeyword} ${exportedName} = ${value}`,
        maxApiSignatureLength
      )
    }
    return `${declarationKeyword} ${exportedName}`
  }

  return kind === "type" || kind === "interface"
    ? `export type { ${exportedName} }`
    : `export { ${exportedName} }`
}

function memberMetadata(member, sourceFile, defaults = new Map()) {
  const documentation = jsDocMetadata(member, sourceFile)
  let name
  let kind
  let type
  let defaultValue = documentation.defaultValue

  if (ts.isPropertySignature(member) || ts.isPropertyDeclaration(member)) {
    name = syntaxName(member.name, sourceFile)
    kind = "property"
    type = nodeText(member.type, sourceFile)
    defaultValue ??= nodeText(member.initializer, sourceFile, 120)
  } else if (ts.isMethodSignature(member) || ts.isMethodDeclaration(member)) {
    name = syntaxName(member.name, sourceFile)
    kind = "method"
    const parameters = member.parameters
      .map((item) => nodeText(item, sourceFile))
      .join(", ")
    type = compactApiText(
      `(${parameters})${member.type ? `: ${nodeText(member.type, sourceFile)}` : ""}`
    )
  } else if (ts.isCallSignatureDeclaration(member)) {
    name = "call"
    kind = "call"
    type = compactApiText(nodeText(member, sourceFile)?.replace(/;$/u, ""))
  } else if (ts.isIndexSignatureDeclaration(member)) {
    name = nodeText(member.parameters[0]?.name, sourceFile, 80) ?? "key"
    kind = "index"
    type = compactApiText(nodeText(member, sourceFile)?.replace(/;$/u, ""))
  } else if (ts.isConstructSignatureDeclaration(member)) {
    name = "new"
    kind = "construct"
    type = compactApiText(nodeText(member, sourceFile)?.replace(/;$/u, ""))
  } else if (ts.isEnumMember(member)) {
    name = syntaxName(member.name, sourceFile)
    kind = "enum"
    defaultValue = nodeText(member.initializer, sourceFile, 120)
  }

  if (!name || !kind) return undefined
  defaultValue ??= defaults.get(name)
  const readonly = member.modifiers?.some(
    (modifier) => modifier.kind === ts.SyntaxKind.ReadonlyKeyword
  )
  return {
    name,
    kind,
    ...(member.questionToken ? { optional: true } : {}),
    ...(readonly ? { readonly: true } : {}),
    ...(type ? { type } : {}),
    ...(defaultValue ? { default: defaultValue } : {}),
    ...(documentation.description
      ? { description: documentation.description }
      : {}),
  }
}

function collectTypeMembers(
  node,
  sourceFile,
  declarations,
  defaults = new Map(),
  seen = new Set()
) {
  if (!node || seen.has(node) || seen.size >= maxApiMembers) return []
  seen.add(node)
  let members = []

  if (ts.isInterfaceDeclaration(node)) {
    members.push(
      ...node.members
        .map((member) => memberMetadata(member, sourceFile, defaults))
        .filter(Boolean)
    )
    for (const clause of node.heritageClauses ?? []) {
      for (const type of clause.types) {
        members.push(
          ...collectTypeMembers(type, sourceFile, declarations, defaults, seen)
        )
      }
    }
  } else if (ts.isTypeAliasDeclaration(node)) {
    members.push(
      ...collectTypeMembers(node.type, sourceFile, declarations, defaults, seen)
    )
  } else if (ts.isEnumDeclaration(node)) {
    members.push(
      ...node.members
        .map((member) => memberMetadata(member, sourceFile, defaults))
        .filter(Boolean)
    )
  } else if (ts.isTypeLiteralNode(node) || ts.isMappedTypeNode(node)) {
    members.push(
      ...node.members
        .map((member) => memberMetadata(member, sourceFile, defaults))
        .filter(Boolean)
    )
  } else if (ts.isIntersectionTypeNode(node) || ts.isUnionTypeNode(node)) {
    for (const type of node.types) {
      members.push(
        ...collectTypeMembers(type, sourceFile, declarations, defaults, seen)
      )
    }
  } else if (ts.isParenthesizedTypeNode(node)) {
    members.push(
      ...collectTypeMembers(node.type, sourceFile, declarations, defaults, seen)
    )
  } else if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)) {
    const declaration = declarations.get(node.typeName.text)?.node
    if (
      declaration &&
      (ts.isInterfaceDeclaration(declaration) ||
        ts.isTypeAliasDeclaration(declaration) ||
        ts.isEnumDeclaration(declaration))
    ) {
      members.push(
        ...collectTypeMembers(
          declaration,
          sourceFile,
          declarations,
          defaults,
          seen
        )
      )
    }
  } else if (ts.isExpressionWithTypeArguments(node)) {
    const expression = node.expression
    if (ts.isIdentifier(expression)) {
      const declaration = declarations.get(expression.text)?.node
      if (declaration) {
        members.push(
          ...collectTypeMembers(
            declaration,
            sourceFile,
            declarations,
            defaults,
            seen
          )
        )
      }
    }
  }

  const unique = new Map()
  for (const member of members) {
    const key = `${member.kind}:${member.name}`
    if (!unique.has(key)) unique.set(key, member)
    if (unique.size >= maxApiMembers) break
  }
  return [...unique.values()]
}

function callableNode(node) {
  if (ts.isFunctionDeclaration(node)) return node
  if (!ts.isVariableDeclaration(node) || !node.initializer) return undefined
  const unwrap = (value) => {
    if (ts.isArrowFunction(value) || ts.isFunctionExpression(value))
      return value
    if (ts.isCallExpression(value)) {
      const first = value.arguments[0]
      return first ? unwrap(first) : undefined
    }
    if (ts.isParenthesizedExpression(value)) return unwrap(value.expression)
    return undefined
  }
  return unwrap(node.initializer)
}

function componentPropsType(node, sourceFile) {
  if (ts.isVariableDeclaration(node) && node.initializer) {
    const inspect = (value) => {
      if (ts.isCallExpression(value)) {
        const callee = value.expression.getText(sourceFile)
        if (/(?:^|\.)forwardRef$/u.test(callee) && value.typeArguments?.[1]) {
          return value.typeArguments[1]
        }
        const first = value.arguments[0]
        if (first) return inspect(first)
      }
      if (ts.isParenthesizedExpression(value)) return inspect(value.expression)
      if (
        (ts.isArrowFunction(value) || ts.isFunctionExpression(value)) &&
        value.parameters[0]?.type
      ) {
        return value.parameters[0].type
      }
      return undefined
    }
    return inspect(node.initializer)
  }
  if (ts.isFunctionDeclaration(node)) return node.parameters[0]?.type
  return undefined
}

function bindingDefaults(parameter, sourceFile) {
  const defaults = new Map()
  if (!parameter || !ts.isObjectBindingPattern(parameter.name)) return defaults
  for (const element of parameter.name.elements) {
    if (element.dotDotDotToken || !element.initializer) continue
    const name = syntaxName(element.propertyName ?? element.name, sourceFile)
    const value = nodeText(element.initializer, sourceFile, 120)
    if (name && value) defaults.set(name, value)
  }
  return defaults
}

function localTypeNames(node) {
  const names = new Set()
  const visit = (current) => {
    if (ts.isTypeReferenceNode(current) && ts.isIdentifier(current.typeName)) {
      names.add(current.typeName.text)
    }
    ts.forEachChild(current, visit)
  }
  if (node) visit(node)
  return names
}

function parameterMetadata(parameter, index, sourceFile, descriptions) {
  let name
  if (ts.isIdentifier(parameter.name)) name = parameter.name.text
  else if (ts.isObjectBindingPattern(parameter.name)) name = "options"
  else name = `argument${index + 1}`
  const type = nodeText(parameter.type, sourceFile)
  const defaultValue = nodeText(parameter.initializer, sourceFile, 120)
  const description = descriptions.get(name)
  return {
    name,
    kind: "parameter",
    ...(parameter.questionToken || parameter.initializer
      ? { optional: true }
      : {}),
    ...(type ? { type } : {}),
    ...(defaultValue ? { default: defaultValue } : {}),
    ...(description ? { description } : {}),
  }
}

function entryUsage(entry, registryType, componentLike) {
  if (
    (entry.kind === "function" || entry.kind === "const") &&
    /^use[A-Z]/u.test(entry.name)
  ) {
    return `const result = ${entry.name}(/* arguments */)`
  }
  if (
    registryType === "registry:ui" &&
    componentLike &&
    (entry.kind === "const" ||
      entry.kind === "function" ||
      entry.kind === "class")
  ) {
    return `<${entry.name} />`
  }
  if (entry.kind === "function") return `${entry.name}(/* arguments */)`
  return undefined
}

function usageMetadata(entries, importPath, registryType, sourceName) {
  if (registryType === "registry:style") {
    const importStatement = `@import ${JSON.stringify(importPath)};`
    return { importPath, importStatement, example: importStatement }
  }
  const runtimeEntries = entries.filter(
    (entry) => entry.kind !== "type" && entry.kind !== "interface"
  )
  const normalizedSourceName = sourceName
    .replace(/[^a-z0-9]/giu, "")
    .toLowerCase()
  const preferredRuntime =
    runtimeEntries.find(
      (entry) =>
        entry.name.replace(/[^a-z0-9]/giu, "").toLowerCase() ===
        normalizedSourceName
    ) ?? runtimeEntries[0]
  const primary =
    preferredRuntime ??
    entries.find(
      (entry) =>
        entry.name.replace(/[^a-z0-9]/giu, "").toLowerCase() ===
        normalizedSourceName
    ) ??
    entries[0]
  if (!primary)
    return {
      importPath,
      importStatement: `import ${JSON.stringify(importPath)}`,
    }
  const typeOnly = primary.kind === "type" || primary.kind === "interface"
  const importStatement = `import${typeOnly ? " type" : ""} { ${primary.name} } from ${JSON.stringify(importPath)}`
  const example =
    primary.usage ?? (typeOnly ? `type Example = ${primary.name}` : undefined)
  return {
    importPath,
    importStatement,
    primaryExport: primary.name,
    ...(example ? { example } : {}),
  }
}

function publicApi(source, filename, { importPath, registryType, sourceName }) {
  if (!filename.endsWith(".ts") && !filename.endsWith(".tsx")) {
    return {
      entries: [],
      usage: usageMetadata([], importPath, registryType, sourceName),
    }
  }
  const sourceFile = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
    filename.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  )
  const declarations = new Map()
  const exports = new Map()

  function remember(name, node, kind = declarationKind(node), source) {
    declarations.set(name, {
      name,
      kind,
      line: declarationLine(node, sourceFile),
      node,
      ...(source ? { source } : {}),
    })
  }

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause
      const importSource = statement.moduleSpecifier.text
      if (clause?.name) {
        remember(
          clause.name.text,
          clause.name,
          inferredImportKind(clause.name.text, clause.isTypeOnly),
          importSource
        )
      }
      if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
        for (const element of clause.namedBindings.elements) {
          remember(
            element.name.text,
            element,
            inferredImportKind(
              element.name.text,
              clause.isTypeOnly || element.isTypeOnly
            ),
            importSource
          )
        }
      }
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name))
          remember(declaration.name.text, declaration)
      }
    } else if (
      (ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement) ||
        ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement) ||
        ts.isEnumDeclaration(statement)) &&
      statement.name
    ) {
      remember(statement.name.text, statement)
    }

    const directlyExported = statement.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
    )
    if (directlyExported) {
      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name)) {
            const entry = declarations.get(declaration.name.text)
            if (entry) exports.set(entry.name, entry)
          }
        }
      } else if ("name" in statement && statement.name) {
        const entry = declarations.get(statement.name.text)
        if (entry) exports.set(entry.name, entry)
      }
    }
  }

  for (const statement of sourceFile.statements) {
    if (!ts.isExportDeclaration(statement)) continue
    const elements = statement.exportClause
    if (!elements || !ts.isNamedExports(elements)) continue
    for (const element of elements.elements) {
      const localName = element.propertyName?.text ?? element.name.text
      const entry = declarations.get(localName)
      const typeOnly = element.isTypeOnly || statement.isTypeOnly
      const exportSource = statement.moduleSpecifier?.text ?? entry?.source
      const localDeclarationKind =
        entry?.node &&
        !ts.isImportSpecifier(entry.node) &&
        !ts.isImportClause(entry.node) &&
        !ts.isNamespaceImport(entry.node) &&
        !ts.isExportSpecifier(entry.node)
          ? entry.kind
          : undefined
      exports.set(element.name.text, {
        name: element.name.text,
        kind:
          localDeclarationKind ??
          (typeOnly
            ? "type"
            : (entry?.kind ?? inferredImportKind(element.name.text))),
        line: entry?.line ?? declarationLine(element, sourceFile),
        node: entry?.node ?? element,
        ...(exportSource ? { source: exportSource } : {}),
      })
    }
  }

  const exported = [...exports.values()]
    .filter((entry) => !jsDocMetadata(entry.node, sourceFile).hidden)
    .sort((a, b) => a.name.localeCompare(b.name))
  const defaultsByType = new Map()
  for (const entry of exported) {
    if (!entry.node) continue
    const callable = callableNode(entry.node)
    if (!callable) continue
    const componentProps = componentPropsType(entry.node, sourceFile)
    for (const [index, parameter] of callable.parameters.entries()) {
      const defaults = bindingDefaults(parameter, sourceFile)
      const typeNode =
        index === 0 ? (componentProps ?? parameter.type) : parameter.type
      for (const typeName of localTypeNames(typeNode)) {
        const existing = defaultsByType.get(typeName) ?? new Map()
        for (const [name, value] of defaults) existing.set(name, value)
        defaultsByType.set(typeName, existing)
      }
    }
  }

  const entries = exported.map((entry) => {
    const documentation = jsDocMetadata(entry.node, sourceFile)
    const consumerSource = entry.source
      ? transformImports(entry.source)
      : undefined
    const callable = callableNode(entry.node)
    const componentLike =
      registryType === "registry:ui" &&
      /^[A-Z]/u.test(entry.name) &&
      (entry.kind === "const" ||
        entry.kind === "function" ||
        entry.kind === "class")
    const propsTypeNode = componentLike
      ? componentPropsType(entry.node, sourceFile)
      : undefined
    const propsDefaults = bindingDefaults(callable?.parameters[0], sourceFile)
    const props = propsTypeNode
      ? collectTypeMembers(
          propsTypeNode,
          sourceFile,
          declarations,
          propsDefaults
        )
      : []
    const memberDefaults = defaultsByType.get(entry.name) ?? new Map()
    const members =
      entry.kind === "interface" ||
      entry.kind === "type" ||
      entry.kind === "enum"
        ? collectTypeMembers(
            entry.node,
            sourceFile,
            declarations,
            memberDefaults
          )
        : []
    const parameters =
      callable && !componentLike
        ? callable.parameters.map((parameter, index) =>
            parameterMetadata(
              parameter,
              index,
              sourceFile,
              documentation.parameters
            )
          )
        : []
    const returns = callable?.type
      ? nodeText(callable.type, sourceFile)
      : documentation.returns
    const propsType = nodeText(propsTypeNode, sourceFile, 180)
    const base = {
      name: entry.name,
      kind: entry.kind,
      line: entry.line,
      signature: transformImports(
        declarationSignature(
          entry.node,
          sourceFile,
          entry.name,
          entry.kind,
          consumerSource
        )
      ),
      ...(consumerSource ? { source: consumerSource } : {}),
      ...(documentation.description
        ? { description: documentation.description }
        : {}),
      ...(propsType ? { propsType } : {}),
      ...(props.length ? { props } : {}),
      ...(members.length ? { members } : {}),
      ...(parameters.length ? { parameters } : {}),
      ...(returns ? { returns } : {}),
    }
    const usage = entryUsage(base, registryType, componentLike)
    return { ...base, ...(usage ? { usage } : {}) }
  })

  return {
    entries,
    usage: usageMetadata(entries, importPath, registryType, sourceName),
  }
}

function addExternalDependency(dependencies, specifier) {
  const dependency = packageName(specifier)
  if (
    dependency &&
    dependency !== "react" &&
    dependency !== "react-dom" &&
    dependency !== "@aq-ui/registry" &&
    !dependency.startsWith("node:")
  ) {
    const supportedRange = supportedExternalDependencies[dependency]
    if (typeof supportedRange !== "string" || supportedRange.length === 0) {
      throw new Error(
        `External dependency ${dependency} must be declared in packages/registry/package.json.`
      )
    }
    dependencies.add(`${dependency}@${supportedRange}`)
  }
}

async function ensureWrite(path, value) {
  const serialized = `${JSON.stringify(value, null, 2)}\n`
  if (checkOnly) {
    const existing = await readFile(path, "utf8").catch(() => null)
    if (existing !== serialized) {
      throw new Error(
        `Generated registry file is stale: ${relative(workspaceRoot, path)}`
      )
    }
    return
  }
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, serialized)
}

async function collectItems() {
  const items = []
  for (const group of sourceGroups) {
    const directory = join(packageRoot, group.directory)
    const entries = await readdir(directory).catch(() => [])
    for (const entry of entries.sort()) {
      if (
        !entry.endsWith(group.extension) ||
        entry === "index.ts" ||
        entry === "index.tsx"
      ) {
        continue
      }
      const sourcePath = join(directory, entry)
      if (!(await stat(sourcePath)).isFile()) continue

      const sourceName = entry.slice(0, -group.extension.length)
      if (group.type === "registry:style" && sourceName === "aq-tailwind") {
        continue
      }
      const name = registryName(sourceName, group.type)
      const source = await readFile(sourcePath, "utf8")
      const raw = await registryContent(source, sourceName, group.type)
      const content = transformImports(raw)
      const importPath =
        group.extension === ".css"
          ? `@/${group.target}/${entry}`
          : `@/${group.target}/${sourceName}`
      const apiMetadata = publicApi(source, entry, {
        importPath,
        registryType: group.type,
        sourceName,
      })
      const registryDependencies = new Set()
      const dependencies = new Set()

      for (const match of raw.matchAll(internalImportPattern)) {
        const dependency = registryName(match[2], `registry:${match[1]}`)
        if (dependency !== name) registryDependencies.add(dependency)
      }
      for (const dependency of forcedRegistryDependencies.get(name) ?? []) {
        registryDependencies.add(dependency)
      }
      for (const match of raw.matchAll(packageImportPattern)) {
        addExternalDependency(dependencies, match[1])
      }
      for (const dependency of forcedExternalDependencies.get(name) ?? []) {
        addExternalDependency(dependencies, dependency)
      }
      if (group.extension === ".css") {
        for (const match of raw.matchAll(cssImportPattern)) {
          if (!match[1].startsWith(".")) {
            addExternalDependency(dependencies, match[1])
          }
        }
      }

      const internal = internalNames.has(sourceName)
      const item = {
        $schema: "https://ui.shadcn.com/schema/registry-item.json",
        name,
        type: group.type,
        title: titleCase(sourceName.replace(/^_/, "")),
        description:
          descriptions[name] ?? defaultDescription(sourceName, group.type),
        author: "aq-ui contributors",
        version,
        dependencies: [...dependencies].sort(),
        registryDependencies: [...registryDependencies].sort(),
        files: [
          {
            path: `${group.target}/${entry}`,
            type: group.type,
            content,
          },
        ],
        meta: {
          integrity: `sha256-${sha256(content)}`,
          api: apiMetadata.entries,
          usage: apiMetadata.usage,
          ...(internal ? { internal: true } : {}),
          ssr: !raw.startsWith('"use client"'),
        },
      }
      items.push(item)
    }
  }
  return items.sort((a, b) => a.name.localeCompare(b.name))
}

function validateGraph(items) {
  const byName = new Map(items.map((item) => [item.name, item]))
  for (const item of items) {
    for (const dependency of item.registryDependencies) {
      if (!byName.has(dependency)) {
        throw new Error(
          `${item.name} references missing registry dependency ${dependency}`
        )
      }
    }
  }

  const visiting = new Set()
  const visited = new Set()
  function visit(name, path = []) {
    if (visiting.has(name)) {
      throw new Error(
        `Registry dependency cycle: ${[...path, name].join(" -> ")}`
      )
    }
    if (visited.has(name)) return
    visiting.add(name)
    const item = byName.get(name)
    for (const dependency of item?.registryDependencies ?? []) {
      visit(dependency, [...path, name])
    }
    visiting.delete(name)
    visited.add(name)
  }
  for (const item of items) visit(item.name)
}

async function synchronizeOutputFiles(items) {
  const expected = new Set(items.map((item) => `${item.name}.json`))
  const existing = await readdir(outputRoot).catch(() => [])
  const stale = existing.filter(
    (entry) => entry.endsWith(".json") && !expected.has(entry)
  )
  if (checkOnly && stale.length > 0) {
    throw new Error(
      `Generated registry contains stale files: ${stale.join(", ")}`
    )
  }
  if (!checkOnly) {
    await Promise.all(stale.map((entry) => unlink(join(outputRoot, entry))))
  }
}

const items = await collectItems()
validateGraph(items)
await synchronizeOutputFiles(items)

const publicItems = items.filter((item) => !item.meta.internal)
const catalog = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "aq-ui",
  homepage: "https://andrew-lee-dev.github.io/aq-ui",
  items: publicItems.map(({ files, ...item }) => {
    return {
      ...item,
      files: files.map((file) => ({ path: file.path, type: file.type })),
      meta: {
        integrity: item.meta.integrity,
        api: item.meta.api.map(({ name, kind, line }) => ({
          name,
          kind,
          ...(line ? { line } : {}),
        })),
        ssr: item.meta.ssr,
      },
    }
  }),
}

// Keep the command palette payload independent from the install catalog. The
// catalog intentionally carries dependency and API metadata that is useful to
// the CLI, but unnecessary for documentation search.
const searchIndex = {
  items: publicItems.map(({ name, title, description, type }) => ({
    name,
    title,
    description,
    type,
  })),
}

await ensureWrite(join(publicRoot, "registry.json"), catalog)
await ensureWrite(join(publicRoot, "search-index.json"), searchIndex)
await ensureWrite(join(workspaceRoot, "registry.json"), catalog)
for (const item of items) {
  await ensureWrite(join(outputRoot, `${item.name}.json`), item)
}

if (!checkOnly) {
  const counts = publicItems.reduce((result, item) => {
    result[item.type] = (result[item.type] ?? 0) + 1
    return result
  }, {})
  console.log(
    `Built ${publicItems.length} public registry items and ${items.length - publicItems.length} internal dependencies.`,
    counts
  )
}
