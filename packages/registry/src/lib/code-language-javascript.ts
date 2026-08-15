import { registerCodeLanguageLoader } from "@aq-ui/registry/lib/code-language-registry"

registerCodeLanguageLoader("javascript", async () => {
  const { javascript } = await import("@codemirror/lang-javascript")
  return javascript()
})

const codeLanguageJavaScript = "javascript" as const

export { codeLanguageJavaScript }
