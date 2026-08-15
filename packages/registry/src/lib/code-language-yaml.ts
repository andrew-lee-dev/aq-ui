import { registerCodeLanguageLoader } from "@aq-ui/registry/lib/code-language-registry"

registerCodeLanguageLoader("yaml", async () => {
  const { yaml } = await import("@codemirror/lang-yaml")
  return yaml()
})

const codeLanguageYaml = "yaml" as const

export { codeLanguageYaml }
