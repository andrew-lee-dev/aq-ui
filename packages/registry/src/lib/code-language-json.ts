import { registerCodeLanguageLoader } from "@aq-ui/registry/lib/code-language-registry"

registerCodeLanguageLoader("json", async () => {
  const { json } = await import("@codemirror/lang-json")
  return json()
})

const codeLanguageJson = "json" as const

export { codeLanguageJson }
