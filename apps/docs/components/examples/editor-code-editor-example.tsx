"use client"

import { CodeEditor } from "@aq-ui/registry/components/code-editor"

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

function CodeEditorExample() {
  return (
    <div className="w-full max-w-3xl">
      <CodeEditor
        defaultValue={typescriptExample}
        language="typescript"
        minHeight={320}
        maxHeight={440}
        statusBar
        aria-label="TypeScript registry example"
      />
    </div>
  )
}

export default CodeEditorExample
