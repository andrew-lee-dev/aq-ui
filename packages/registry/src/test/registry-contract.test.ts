import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

import type {
  RegistryApiEntry,
  RegistryApiMember,
  RegistryApiUsage,
} from "../../scripts/registry-api-metadata.js"

interface RegistryFile {
  path: string
  type: string
  content?: string
}

interface RegistryItem {
  name: string
  title: string
  description: string
  type: string
  version: string
  dependencies: string[]
  registryDependencies: string[]
  files: RegistryFile[]
  meta: {
    integrity: string
    internal?: boolean
    api?: RegistryApiEntry[]
    usage?: RegistryApiUsage
  }
}

interface RegistryCatalog {
  items: RegistryItem[]
}

interface RegistrySearchItem {
  name: string
  title: string
  description: string
  type: string
}

interface RegistrySearchIndex {
  items: RegistrySearchItem[]
}

const workspaceRoot = resolve(process.cwd(), "../..")
const cliVersion = (
  JSON.parse(
    readFileSync(resolve(workspaceRoot, "packages/cli/package.json"), "utf8")
  ) as { version: string }
).version
const registryPackage = JSON.parse(
  readFileSync(resolve(workspaceRoot, "packages/registry/package.json"), "utf8")
) as {
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
}
const supportedExternalDependencies = {
  ...registryPackage.devDependencies,
  ...registryPackage.dependencies,
}
const catalogSource = readFileSync(
  resolve(workspaceRoot, "registry.json"),
  "utf8"
)
const catalog = JSON.parse(catalogSource) as RegistryCatalog
const searchIndexSource = readFileSync(
  resolve(workspaceRoot, "apps/docs/public/search-index.json"),
  "utf8"
)
const searchIndex = JSON.parse(searchIndexSource) as RegistrySearchIndex

function itemRecord(name: string) {
  return JSON.parse(
    readFileSync(
      resolve(workspaceRoot, `apps/docs/public/r/${name}.json`),
      "utf8"
    )
  ) as RegistryItem
}

function registryClosure(name: string) {
  const visited = new Set<string>()
  const walk = (current: string) => {
    if (visited.has(current)) return
    visited.add(current)
    for (const dependency of itemRecord(current).registryDependencies) {
      walk(dependency)
    }
  }
  walk(name)
  return visited
}

function dependencyPackageName(specifier: string) {
  const versionSeparator = specifier.startsWith("@")
    ? specifier.indexOf("@", 1)
    : specifier.indexOf("@")
  return versionSeparator === -1
    ? specifier
    : specifier.slice(0, versionSeparator)
}

function dependencyNames(item: RegistryItem) {
  return item.dependencies.map(dependencyPackageName)
}

function apiEntry(itemName: string, exportName: string) {
  const entry = itemRecord(itemName).meta.api?.find(
    (candidate) => candidate.name === exportName
  )
  if (!entry) throw new Error(`Missing ${itemName} API entry ${exportName}.`)
  return entry
}

function apiMember(
  entry: RegistryApiEntry,
  memberName: string,
  collection: "members" | "props" = "members"
) {
  const member = entry[collection]?.find(
    (candidate: RegistryApiMember) => candidate.name === memberName
  )
  if (!member) {
    throw new Error(`Missing ${entry.name} ${collection} member ${memberName}.`)
  }
  return member
}

describe("registry contract", () => {
  it("publishes exactly 75 component families and 72 public hooks", () => {
    expect(
      catalog.items.filter((item) => item.type === "registry:ui")
    ).toHaveLength(75)
    expect(
      catalog.items.filter((item) => item.type === "registry:hook")
    ).toHaveLength(72)
  })

  it("generates a deterministic, lean search index for every public item", () => {
    expect(searchIndex.items).toHaveLength(151)
    expect(
      searchIndex.items.filter((item) => item.type === "registry:ui")
    ).toHaveLength(75)
    expect(
      searchIndex.items.filter((item) => item.type === "registry:hook")
    ).toHaveLength(72)
    expect(
      searchIndex.items.filter((item) => item.type === "registry:style")
    ).toHaveLength(1)
    expect(
      searchIndex.items.filter((item) => item.type === "registry:lib")
    ).toHaveLength(3)

    expect(searchIndex.items.map((item) => item.name)).toEqual(
      catalog.items.map((item) => item.name)
    )
    expect(searchIndex.items.map((item) => item.name)).toEqual(
      searchIndex.items.map((item) => item.name).sort()
    )

    for (const item of searchIndex.items) {
      expect(Object.keys(item)).toEqual([
        "name",
        "title",
        "description",
        "type",
      ])
      expect(item.name).toMatch(/^[a-z0-9][a-z0-9-]*$/u)
      expect(item.title).toBeTruthy()
      expect(item.description).toBeTruthy()
      expect(item.type).toMatch(/^registry:(?:ui|hook|style|lib)$/u)

      const catalogItem = catalog.items.find(
        (candidate) => candidate.name === item.name
      )
      expect(item).toEqual({
        name: catalogItem?.name,
        title: catalogItem?.title,
        description: catalogItem?.description,
        type: catalogItem?.type,
      })
    }

    expect(Buffer.byteLength(searchIndexSource)).toBeLessThan(
      Buffer.byteLength(catalogSource) * 0.2
    )
  })

  it("uses the publishable CLI package version for every record", () => {
    for (const item of catalog.items) {
      expect(item.version, item.name).toBe(cliVersion)
      expect(itemRecord(item.name).version, item.name).toBe(cliVersion)
    }
  })

  it("uses stable IDs and declares existing acyclic registry dependencies", () => {
    const publicNames = new Set(catalog.items.map((item) => item.name))
    expect(publicNames.size).toBe(catalog.items.length)
    for (const item of catalog.items) {
      expect(item.name).toMatch(/^[a-z0-9][a-z0-9-]*$/u)
      expect(item.files.length).toBeGreaterThan(0)
      const visiting = new Set<string>()
      const visited = new Set<string>()
      const walk = (name: string) => {
        if (visiting.has(name)) throw new Error(`Cycle at ${name}`)
        if (visited.has(name)) return
        visiting.add(name)
        const record = itemRecord(name)
        for (const dependency of record.registryDependencies) walk(dependency)
        visiting.delete(name)
        visited.add(name)
      }
      walk(item.name)
    }
  })

  it("ships content-addressed records without the monorepo package dependency", () => {
    for (const item of catalog.items) {
      const record = itemRecord(item.name)
      expect(dependencyNames(record)).not.toContain("@aq-ui/registry")
      expect(record.files).toHaveLength(1)
      const content = record.files[0]?.content ?? ""
      const integrity = `sha256-${createHash("sha256").update(content).digest("hex")}`
      expect(record.meta.integrity).toBe(integrity)
    }
  })

  it("pins every external dependency to the tested workspace range", () => {
    for (const item of catalog.items) {
      const record = itemRecord(item.name)
      for (const dependency of record.dependencies) {
        const packageName = dependencyPackageName(dependency)
        expect(dependency, item.name).toBe(
          `${packageName}@${supportedExternalDependencies[packageName]}`
        )
      }
    }
  })

  it("generates public API metadata for every TypeScript registry item", () => {
    for (const item of catalog.items) {
      if (item.type === "registry:style") continue
      const record = itemRecord(item.name)
      expect(record.meta.api, item.name).toBeInstanceOf(Array)
      expect(record.meta.api?.length, item.name).toBeGreaterThan(0)
      for (const entry of record.meta.api ?? []) {
        expect(entry.name).toMatch(/^[A-Za-z_$][\w$]*$/u)
        expect(entry.line, `${item.name}.${entry.name}`).toBeGreaterThan(0)
        expect(entry.kind).toMatch(
          /^(class|const|enum|function|interface|type|value)$/u
        )
        expect(entry.kind, `${item.name}.${entry.name}`).not.toBe("value")
        expect(entry.signature, `${item.name}.${entry.name}`).toBeTruthy()
        expect(
          entry.signature,
          `${item.name}.${entry.name}.signature`
        ).not.toContain("@aq-ui/registry")
        expect(
          entry.signature?.length,
          `${item.name}.${entry.name}`
        ).toBeLessThanOrEqual(360)
        expect(
          entry.description?.length ?? 0,
          `${item.name}.${entry.name}.description`
        ).toBeLessThanOrEqual(280)
        expect(
          entry.propsType?.length ?? 0,
          `${item.name}.${entry.name}.propsType`
        ).toBeLessThanOrEqual(180)
        expect(
          entry.returns?.length ?? 0,
          `${item.name}.${entry.name}.returns`
        ).toBeLessThanOrEqual(240)
        if (entry.source) {
          expect(entry.source, `${item.name}.${entry.name}.source`).not.toMatch(
            /^(?:\/|[A-Za-z]:\\)/u
          )
          expect(
            entry.source,
            `${item.name}.${entry.name}.source`
          ).not.toContain("@aq-ui/registry")
        }
        for (const collection of [
          entry.members ?? [],
          entry.parameters ?? [],
          entry.props ?? [],
        ]) {
          expect(
            collection.length,
            `${item.name}.${entry.name}`
          ).toBeLessThanOrEqual(48)
          for (const member of collection) {
            expect(member.name).toBeTruthy()
            expect(member.kind).toMatch(
              /^(call|construct|enum|index|method|parameter|property)$/u
            )
            expect(member.type?.length ?? 0).toBeLessThanOrEqual(240)
            expect(member.description?.length ?? 0).toBeLessThanOrEqual(280)
          }
        }
      }
    }
  })

  it("keeps the catalog API lean and rich metadata in item records", () => {
    for (const item of catalog.items) {
      if (item.type === "registry:style") continue
      expect(item.meta.usage, item.name).toBeUndefined()
      for (const entry of item.meta.api ?? []) {
        expect(Object.keys(entry).sort(), `${item.name}.${entry.name}`).toEqual(
          ["kind", "line", "name"]
        )
      }

      const record = itemRecord(item.name)
      expect(record.meta.usage?.importPath, item.name).toMatch(/^@\//u)
      expect(record.meta.usage?.importStatement, item.name).toContain(
        record.meta.usage?.importPath ?? "missing-import-path"
      )
      expect(
        record.meta.api?.map(({ name }) => name),
        item.name
      ).toEqual(item.meta.api?.map(({ name }) => name))
    }
  })

  it("extracts component props, defaults, descriptions, and usage", () => {
    const button = apiEntry("button", "Button")
    const buttonProps = apiEntry("button", "ButtonProps")
    const loadingProp = apiMember(button, "loading", "props")
    const loadingPosition = apiMember(buttonProps, "loadingPosition")
    const usage = itemRecord("button").meta.usage

    expect(button.signature).toBe(
      "const Button = React.forwardRef<React.ComponentRef<typeof ButtonPrimitive>, ButtonProps>(…)"
    )
    expect(button.propsType).toBe("ButtonProps")
    expect(button.usage).toBe("<Button />")
    expect(loadingProp).toEqual(
      expect.objectContaining({
        default: "false",
        description: expect.stringContaining("busy"),
        kind: "property",
        optional: true,
        type: "boolean",
      })
    )
    expect(loadingPosition.default).toBe('"start"')
    expect(usage).toEqual({
      importPath: "@/components/ui/button",
      importStatement: 'import { Button } from "@/components/ui/button"',
      primaryExport: "Button",
      example: "<Button />",
    })
  })

  it("extracts hook signatures, parameters, returns, and option defaults", () => {
    const useAsync = apiEntry("use-async", "useAsync")
    const options = apiEntry("use-async", "UseAsyncOptions")

    expect(useAsync.signature).toContain("function useAsync<")
    expect(useAsync.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "task", kind: "parameter" }),
        expect.objectContaining({
          name: "options",
          kind: "parameter",
          default: "{}",
          optional: true,
        }),
      ])
    )
    expect(useAsync.returns).toBe("AsyncControls<T, TArgs>")
    expect(apiMember(options, "immediate").default).toBe("false")
    expect(itemRecord("use-async").meta.usage?.example).toBe(
      "const result = useAsync(/* arguments */)"
    )
  })

  it("emits syntactically valid copyable usage examples", () => {
    for (const item of catalog.items) {
      const example = itemRecord(item.name).meta.usage?.example
      if (
        !example ||
        example.startsWith("<") ||
        example.startsWith("@import")
      ) {
        continue
      }
      expect(example, item.name).not.toContain("…")
      expect(example, item.name).toMatch(
        /^(?:(?:const result = )?[A-Za-z_$][\w$]*\(\/\* arguments \*\/\)|type Example = [A-Za-z_$][\w$]*)$/u
      )
    }
  })

  it("emits a useful type-only import for type-only registry modules", () => {
    expect(itemRecord("upload").meta.usage).toEqual({
      importPath: "@/lib/upload",
      importStatement:
        'import type { EditorAssetUploadAdapter } from "@/lib/upload"',
      primaryExport: "EditorAssetUploadAdapter",
      example: "type Example = EditorAssetUploadAdapter",
    })
  })

  it("extracts JSDoc and classifies reexports with source provenance", () => {
    expect(apiEntry("rich-text-html", "generateRichTextHTML").description).toBe(
      "Convert canonical Tiptap JSON to HTML without creating an editor instance."
    )
    expect(
      apiEntry("rich-text-html", "RichTextHTMLConversionOptions").kind
    ).toBe("interface")

    const loadLanguage = apiEntry("code-editor", "loadCodeLanguage")
    expect(loadLanguage).toEqual(
      expect.objectContaining({
        kind: "function",
        source: "@/hooks/use-code-editor",
        signature: 'export { loadCodeLanguage } from "@/hooks/use-code-editor"',
      })
    )

    const directionProvider = apiEntry("direction", "DirectionProvider")
    expect(directionProvider).toEqual(
      expect.objectContaining({
        kind: "const",
        line: expect.any(Number),
        source: "@base-ui/react/direction-provider",
      })
    )
    expect(
      itemRecord("use-message-scroller").meta.api?.some(
        ({ name }) => name === "useMessageScrollerInternal"
      )
    ).toBe(false)
  })

  it("keeps editor dependencies granular", () => {
    const button = itemRecord("button")
    const codeBlock = itemRecord("code-block")
    const markdownEditor = itemRecord("markdown-editor")
    const markdownRenderer = itemRecord("markdown-renderer")
    const richTextEditor = itemRecord("rich-text-editor")
    const richTextHTML = itemRecord("rich-text-html")
    const useCodeEditor = itemRecord("use-code-editor")
    const codeEditorClosure = registryClosure("code-editor")

    expect(button.dependencies.join(" ")).not.toMatch(/codemirror|tiptap/u)
    expect(codeBlock.dependencies.join(" ")).not.toMatch(/codemirror/u)
    expect(useCodeEditor.dependencies.join(" ")).not.toMatch(
      /@codemirror\/lang-/u
    )
    for (const language of [
      "plaintext",
      "javascript",
      "typescript",
      "jsx",
      "tsx",
      "json",
      "html",
      "css",
      "markdown",
    ]) {
      expect(codeEditorClosure).toContain(`code-language-${language}`)
    }
    expect(codeEditorClosure).not.toContain("code-language-yaml")
    expect(codeEditorClosure).not.toContain("code-language-sql")
    expect(dependencyNames(itemRecord("code-language-javascript"))).toContain(
      "@codemirror/lang-javascript"
    )
    expect(dependencyNames(itemRecord("code-language-json"))).toContain(
      "@codemirror/lang-json"
    )
    expect(dependencyNames(itemRecord("code-language-html"))).toContain(
      "@codemirror/lang-html"
    )
    expect(dependencyNames(itemRecord("code-language-css"))).toContain(
      "@codemirror/lang-css"
    )
    expect(dependencyNames(itemRecord("code-language-markdown"))).toContain(
      "@codemirror/lang-markdown"
    )
    expect(dependencyNames(itemRecord("code-language-yaml"))).toContain(
      "@codemirror/lang-yaml"
    )
    expect(dependencyNames(itemRecord("code-language-sql"))).toContain(
      "@codemirror/lang-sql"
    )
    expect(markdownEditor.registryDependencies).toEqual(
      expect.arrayContaining([
        "code-editor",
        "markdown-renderer",
        "use-markdown-editor",
        "code-language-markdown",
      ])
    )
    expect(markdownRenderer.registryDependencies).toContain("code-block")
    expect(richTextEditor.registryDependencies).toEqual(
      expect.arrayContaining(["rich-text-renderer", "use-rich-text-editor"])
    )
    expect(registryClosure("rich-text-editor")).toContain("code-block")
    expect(dependencyNames(richTextHTML)).toEqual(
      expect.arrayContaining(["@tiptap/core", "@tiptap/html", "happy-dom"])
    )
  })
})
