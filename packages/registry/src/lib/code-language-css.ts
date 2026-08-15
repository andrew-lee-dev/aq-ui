import { registerCodeLanguageLoader } from "@aq-ui/registry/lib/code-language-registry"

registerCodeLanguageLoader("css", async () => {
  const { css } = await import("@codemirror/lang-css")
  return css()
})

const codeLanguageCss = "css" as const

export { codeLanguageCss }
