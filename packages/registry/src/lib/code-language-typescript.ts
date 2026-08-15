import { registerCodeLanguageLoader } from "@aq-ui/registry/lib/code-language-registry"

registerCodeLanguageLoader("typescript", async () => {
  const { javascript } = await import("@codemirror/lang-javascript")
  return javascript({ typescript: true })
})

const codeLanguageTypeScript = "typescript" as const

export { codeLanguageTypeScript }
