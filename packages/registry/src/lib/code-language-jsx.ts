import { registerCodeLanguageLoader } from "@aq-ui/registry/lib/code-language-registry"

registerCodeLanguageLoader("jsx", async () => {
  const { javascript } = await import("@codemirror/lang-javascript")
  return javascript({ jsx: true })
})

const codeLanguageJsx = "jsx" as const

export { codeLanguageJsx }
