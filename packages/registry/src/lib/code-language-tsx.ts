import { registerCodeLanguageLoader } from "@aq-ui/registry/lib/code-language-registry"

registerCodeLanguageLoader("tsx", async () => {
  const { javascript } = await import("@codemirror/lang-javascript")
  return javascript({ jsx: true, typescript: true })
})

const codeLanguageTsx = "tsx" as const

export { codeLanguageTsx }
