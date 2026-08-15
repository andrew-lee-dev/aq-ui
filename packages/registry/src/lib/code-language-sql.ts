import { registerCodeLanguageLoader } from "@aq-ui/registry/lib/code-language-registry"

registerCodeLanguageLoader("sql", async () => {
  const { sql } = await import("@codemirror/lang-sql")
  return sql()
})

const codeLanguageSql = "sql" as const

export { codeLanguageSql }
