"use client"

import { CodeBlock } from "@aq-ui/registry/components/code-block"

const typescriptExample = `type RegistryItem = {
  name: string
  dependencies: string[]
}

export function install(item: RegistryItem) {
  return item.dependencies.map((dependency) => ({
    dependency,
    source: \`https://aq-ui.dev/r/\${dependency}.json\`,
  }))
}`

function CodeBlockExample() {
  return (
    <div className="w-full max-w-3xl">
      <CodeBlock
        code={typescriptExample}
        filename="registry.ts"
        language="typescript"
        lineNumbers
        highlightedLines={[1, 6, 8]}
        copyButton
      />
    </div>
  )
}

export default CodeBlockExample
