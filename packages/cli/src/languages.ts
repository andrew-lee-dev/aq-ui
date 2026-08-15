import { CliError } from "./errors.js"

const CODE_LANGUAGE_NAMES = [
  "plaintext",
  "javascript",
  "typescript",
  "jsx",
  "tsx",
  "json",
  "html",
  "css",
  "markdown",
  "yaml",
  "sql",
] as const

type CodeLanguageName = (typeof CODE_LANGUAGE_NAMES)[number]

const DEFAULT_CODE_LANGUAGES = [
  "plaintext",
  "javascript",
  "typescript",
  "jsx",
  "tsx",
  "json",
  "html",
  "css",
  "markdown",
] as const satisfies readonly CodeLanguageName[]

const aliases: Record<string, CodeLanguageName> = {
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

function isCodeLanguageName(value: string): value is CodeLanguageName {
  return (CODE_LANGUAGE_NAMES as readonly string[]).includes(value)
}

function normalizeCodeLanguageSelection(
  values: readonly string[],
  source = "code language selection"
): CodeLanguageName[] {
  const selected = new Set<CodeLanguageName>(["plaintext"])

  for (const rawValue of values) {
    const value = rawValue.trim().toLowerCase()
    if (!value) {
      throw new CliError("INVALID_LANGUAGE", `${source} contains an empty language name.`)
    }
    if (value === "all") {
      CODE_LANGUAGE_NAMES.forEach((language) => selected.add(language))
      continue
    }
    const normalized = aliases[value] ?? value
    if (!isCodeLanguageName(normalized)) {
      throw new CliError(
        "INVALID_LANGUAGE",
        `Unsupported code language: ${rawValue}. Choose from ${CODE_LANGUAGE_NAMES.join(
          ", "
        )}, or use all.`
      )
    }
    selected.add(normalized)
  }

  return CODE_LANGUAGE_NAMES.filter((language) => selected.has(language))
}

function parseCodeLanguages(value: string): CodeLanguageName[] {
  if (!value.trim()) {
    throw new CliError("INVALID_LANGUAGE", "--languages needs a comma-separated language list.")
  }
  return normalizeCodeLanguageSelection(value.split(","), "--languages")
}

function codeLanguageItemName(language: CodeLanguageName) {
  return `code-language-${language}`
}

function isCodeLanguageItemName(name: string) {
  return CODE_LANGUAGE_NAMES.some((language) => name === codeLanguageItemName(language))
}

function codeLanguagePresetContent(languages: readonly CodeLanguageName[]) {
  const normalized = normalizeCodeLanguageSelection(languages)
  const imports = normalized
    .map((language) => `import "@/lib/${codeLanguageItemName(language)}"`)
    .join("\n")
  const values = normalized.map((language) => `  "${language}",`).join("\n")

  return `${imports}\n\nconst codeLanguagePreset = [\n${values}\n] as const\n\nexport { codeLanguagePreset }\n`
}

export {
  CODE_LANGUAGE_NAMES,
  DEFAULT_CODE_LANGUAGES,
  codeLanguageItemName,
  codeLanguagePresetContent,
  isCodeLanguageItemName,
  isCodeLanguageName,
  normalizeCodeLanguageSelection,
  parseCodeLanguages,
}
export type { CodeLanguageName }
