import { registerCodeLanguageLoader } from "@aq-ui/registry/lib/code-language-registry"

registerCodeLanguageLoader("markdown", async () => {
  const { markdown } = await import("@codemirror/lang-markdown")
  return markdown()
})

const codeLanguageMarkdown = "markdown" as const

export { codeLanguageMarkdown }
