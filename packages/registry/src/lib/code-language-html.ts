import { registerCodeLanguageLoader } from "@aq-ui/registry/lib/code-language-registry"

registerCodeLanguageLoader("html", async () => {
  const { html } = await import("@codemirror/lang-html")
  return html()
})

const codeLanguageHtml = "html" as const

export { codeLanguageHtml }
