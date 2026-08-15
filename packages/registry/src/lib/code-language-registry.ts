import type { Extension } from "@codemirror/state"

type BuiltInCodeLanguage =
  | "plaintext"
  | "javascript"
  | "typescript"
  | "jsx"
  | "tsx"
  | "json"
  | "html"
  | "css"
  | "markdown"
  | "yaml"
  | "sql"

type CodeLanguage = BuiltInCodeLanguage | (string & {})
type CodeLanguageLoader = () => Promise<Extension>

const languageLoaders = new Map<string, CodeLanguageLoader>()

function normalizeCodeLanguage(language: CodeLanguage | undefined) {
  const normalized = (language ?? "plaintext").trim().toLowerCase()

  const aliases: Record<string, BuiltInCodeLanguage> = {
    text: "plaintext",
    txt: "plaintext",
    plain: "plaintext",
    js: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    ts: "typescript",
    mts: "typescript",
    cts: "typescript",
    jsonc: "json",
    htm: "html",
    md: "markdown",
    mdx: "markdown",
    yml: "yaml",
  }

  return aliases[normalized] ?? normalized
}

function registerCodeLanguageLoader(
  name: CodeLanguage,
  loader: CodeLanguageLoader
) {
  const normalized = normalizeCodeLanguage(name)

  if (!normalized) {
    throw new Error("A code language must have a non-empty name.")
  }

  languageLoaders.set(normalized, loader)
}

function registerCodeLanguage(name: string, loader: CodeLanguageLoader) {
  const normalized = normalizeCodeLanguage(name)

  if (!normalized || normalized === "plaintext") {
    throw new Error("A custom code language must have a non-empty unique name.")
  }

  languageLoaders.set(normalized, loader)
}

async function loadCodeLanguage(language: CodeLanguage = "plaintext") {
  const normalized = normalizeCodeLanguage(language)
  const loader = languageLoaders.get(normalized)

  if (!loader) {
    throw new Error(
      `Code language "${language}" is not installed. Add its code-language-${normalized} registry item or register a custom loader.`
    )
  }

  return loader()
}

export {
  loadCodeLanguage,
  normalizeCodeLanguage,
  registerCodeLanguage,
  registerCodeLanguageLoader,
}
export type { BuiltInCodeLanguage, CodeLanguage, CodeLanguageLoader }
