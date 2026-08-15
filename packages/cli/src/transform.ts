import path from "node:path"
import ts from "typescript"

import { CliError } from "./errors.js"
import { normalizeRelativePath } from "./fs.js"
import type { ComponentsConfig, RegistryFile, RegistryItemType } from "./types.js"

export interface PreparedRegistryFile {
  target: string
  content: string
}

interface TextReplacement {
  start: number
  end: number
  value: string
}

function appendImportPath(base: string | undefined, suffix: string): string | undefined {
  if (!base) return undefined
  return `${base.replace(/\/+$/u, "")}/${suffix.replace(/^\/+/, "")}`
}

function rewriteModuleSpecifier(specifier: string, aliases: ComponentsConfig["aliases"]): string {
  const mappings: Array<[string, string | undefined]> = [
    ["@/lib/utils", aliases.utils ?? appendImportPath(aliases.lib, "utils")],
    ["@/components/ui", aliases.ui ?? appendImportPath(aliases.components, "ui")],
    ["@/components", aliases.components],
    ["@/hooks", aliases.hooks],
    ["@/lib", aliases.lib],
  ]
  for (const [canonical, configured] of mappings) {
    if (!configured) continue
    if (specifier === canonical) return configured
    if (specifier.startsWith(`${canonical}/`)) {
      return `${configured.replace(/\/+$/u, "")}${specifier.slice(canonical.length)}`
    }
  }
  return specifier
}

function scriptKind(fileName: string): ts.ScriptKind {
  if (/\.tsx$/iu.test(fileName)) return ts.ScriptKind.TSX
  if (/\.jsx$/iu.test(fileName)) return ts.ScriptKind.JSX
  if (/\.[cm]?js$/iu.test(fileName)) return ts.ScriptKind.JS
  return ts.ScriptKind.TS
}

function quoteModuleSpecifier(specifier: string): string {
  return JSON.stringify(specifier)
}

/** Rewrite only module-specifier literals, leaving comments and ordinary strings untouched. */
export function rewriteRegistryImports(
  content: string,
  config: ComponentsConfig,
  fileName: string
): string {
  if (!/\.[cm]?[jt]sx?$/iu.test(fileName) || !content.includes("@/")) return content

  const sourceFile = ts.createSourceFile(
    fileName,
    content,
    ts.ScriptTarget.Latest,
    true,
    scriptKind(fileName)
  )
  const replacements: TextReplacement[] = []
  const collect = (literal: ts.Expression | undefined): void => {
    if (!literal || !ts.isStringLiteralLike(literal)) return
    const next = rewriteModuleSpecifier(literal.text, config.aliases)
    if (next === literal.text) return
    const start = literal.getStart(sourceFile)
    const end = literal.getEnd()
    replacements.push({
      start,
      end,
      value: quoteModuleSpecifier(next),
    })
  }

  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      collect(node.moduleSpecifier)
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference)
    ) {
      collect(node.moduleReference.expression)
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
      collect(node.argument.literal)
    } else if (ts.isModuleDeclaration(node) && ts.isStringLiteral(node.name)) {
      collect(node.name)
    } else if (ts.isCallExpression(node)) {
      const isDynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword
      const isRequire = ts.isIdentifier(node.expression) && node.expression.text === "require"
      if (isDynamicImport || isRequire) collect(node.arguments[0])
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)

  let output = content
  for (const replacement of replacements.sort((left, right) => right.start - left.start)) {
    output = `${output.slice(0, replacement.start)}${replacement.value}${output.slice(replacement.end)}`
  }
  return output
}

function javascriptTarget(target: string): string {
  if (target.endsWith(".d.ts")) return target
  if (target.endsWith(".tsx")) return `${target.slice(0, -4)}.jsx`
  if (target.endsWith(".ts")) return `${target.slice(0, -3)}.js`
  return target
}

function transpileToJavaScript(content: string, fileName: string): string {
  const result = ts.transpileModule(content, {
    fileName,
    reportDiagnostics: true,
    compilerOptions: {
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
      jsx: ts.JsxEmit.Preserve,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: false,
    },
  })
  const errors = (result.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
  )
  if (errors.length > 0) {
    const message = ts.formatDiagnostics(errors, {
      getCanonicalFileName: (name) => name,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => "\n",
    })
    throw new CliError("TRANSFORM_FAILED", `Unable to convert ${fileName} to JavaScript.`, message)
  }
  return result.outputText
}

export async function prepareRegistryFile(
  root: string,
  config: ComponentsConfig,
  file: RegistryFile,
  itemType: RegistryItemType,
  resolveTarget: (
    root: string,
    config: ComponentsConfig,
    file: RegistryFile,
    itemType: RegistryItemType
  ) => Promise<string>
): Promise<PreparedRegistryFile> {
  const rawTarget = await resolveTarget(root, config, file, itemType)
  const content = rewriteRegistryImports(file.content ?? "", config, file.path)
  if (config.tsx !== false || (!rawTarget.endsWith(".ts") && !rawTarget.endsWith(".tsx"))) {
    return { target: normalizeRelativePath(rawTarget), content }
  }
  if (rawTarget.endsWith(".d.ts")) {
    return { target: normalizeRelativePath(rawTarget), content }
  }
  const target = normalizeRelativePath(javascriptTarget(rawTarget))
  return {
    target,
    content: transpileToJavaScript(content, path.basename(rawTarget)),
  }
}
