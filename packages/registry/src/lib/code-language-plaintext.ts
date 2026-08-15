import { registerCodeLanguageLoader } from "@aq-ui/registry/lib/code-language-registry"

registerCodeLanguageLoader("plaintext", async () => [])

const codeLanguagePlaintext = "plaintext" as const

export { codeLanguagePlaintext }
