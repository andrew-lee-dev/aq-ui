import "@aq-ui/registry/lib/code-language-plaintext"
import "@aq-ui/registry/lib/code-language-javascript"
import "@aq-ui/registry/lib/code-language-typescript"
import "@aq-ui/registry/lib/code-language-jsx"
import "@aq-ui/registry/lib/code-language-tsx"
import "@aq-ui/registry/lib/code-language-json"
import "@aq-ui/registry/lib/code-language-html"
import "@aq-ui/registry/lib/code-language-css"
import "@aq-ui/registry/lib/code-language-markdown"

const codeLanguagePreset = [
  "plaintext",
  "javascript",
  "typescript",
  "jsx",
  "tsx",
  "json",
  "html",
  "css",
  "markdown",
] as const

export { codeLanguagePreset }
