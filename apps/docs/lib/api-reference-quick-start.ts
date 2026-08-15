import type { RegistryApiEntry, RegistryItem } from "@/lib/registry"

const curatedExamples: Record<string, string> = {
  accordion: [
    "import {",
    "  Accordion,",
    "  AccordionContent,",
    "  AccordionItem,",
    "  AccordionTrigger,",
    '} from "@/components/ui/accordion"',
    "",
    '<Accordion defaultValue={["item-1"]}>',
    '  <AccordionItem value="item-1">',
    "    <AccordionTrigger>Is it accessible?</AccordionTrigger>",
    "    <AccordionContent>",
    "      Yes. It follows the WAI-ARIA accordion pattern.",
    "    </AccordionContent>",
    "  </AccordionItem>",
    "</Accordion>",
  ].join("\n"),
  button: [
    'import { Button } from "@/components/ui/button"',
    "",
    '<Button type="button">Save changes</Button>',
  ].join("\n"),
  "use-async": [
    'import { useAsync } from "@/hooks/use-async"',
    "",
    "export function ProfileButton() {",
    "  const profile = useAsync(",
    "    async (signal: AbortSignal, id: string) => {",
    "      const response = await fetch(`/api/profiles/${id}`, { signal })",
    '      if (!response.ok) throw new Error("Could not load profile")',
    "      return response.json() as Promise<{ name: string }>",
    "    }",
    "  )",
    "",
    "  return (",
    "    <button",
    '      type="button"',
    '      disabled={profile.status === "pending"}',
    '      onClick={() => void profile.execute("42")}',
    "    >",
    '      {profile.status === "pending" ? "Loading…" : "Load profile"}',
    "    </button>",
    "  )",
    "}",
  ].join("\n"),
}

const typeKinds = new Set(["interface", "type"])

function normalizedName(value: string) {
  return value.replace(/[^a-z0-9]/giu, "").toLowerCase()
}

function modulePath(item: RegistryItem) {
  if (item.meta?.usage?.importPath) return item.meta.usage.importPath
  const file = item.files?.find((entry) => /\.[cm]?[jt]sx?$/u.test(entry.path))
  if (file) return `@/${file.path.replace(/\.[cm]?[jt]sx?$/u, "")}`
  const directory = item.type === "registry:hook" ? "hooks" : "components/ui"
  return `@/${directory}/${item.name}`
}

function primaryEntry(item: RegistryItem, api: RegistryApiEntry[]) {
  const configured = item.meta?.usage?.primaryExport
  if (configured) {
    const match = api.find((entry) => entry.name === configured)
    if (match) return match
  }

  const itemName = normalizedName(item.name)
  return (
    api.find(
      (entry) =>
        !typeKinds.has(entry.kind) && normalizedName(entry.name) === itemName
    ) ?? api.find((entry) => !typeKinds.has(entry.kind))
  )
}

function quickImport(item: RegistryItem, api: RegistryApiEntry[]) {
  if (item.meta?.usage?.importStatement) {
    return item.meta.usage.importStatement
  }

  const primary = primaryEntry(item, api)
  const prefix = primary
    ? normalizedName(primary.name)
    : normalizedName(item.name)
  const runtime = api.filter((entry) => !typeKinds.has(entry.kind))
  const related = runtime.filter((entry) =>
    normalizedName(entry.name).startsWith(prefix)
  )
  const selected = [primary, ...related]
    .filter((entry): entry is RegistryApiEntry => Boolean(entry))
    .filter((entry, index, entries) => entries.indexOf(entry) === index)
    .slice(0, 8)
  const exports = selected.length ? selected : runtime.slice(0, 8)
  if (!exports.length) return ""

  const names = exports.map((entry) => entry.name)
  if (names.length <= 2 && names.join(", ").length < 48) {
    return `import { ${names.join(", ")} } from "${modulePath(item)}"`
  }
  return [
    "import {",
    ...names.map((name) => `  ${name},`),
    `} from "${modulePath(item)}"`,
  ].join("\n")
}

function safeGeneratedExample(item: RegistryItem, api: RegistryApiEntry[]) {
  const example = item.meta?.usage?.example
  if (!example?.includes("/* arguments */")) return example
  return safeCallableUsage(primaryEntry(item, api), example)
}

function safeCallableUsage(entry: RegistryApiEntry | undefined, usage: string) {
  if (!usage.includes("/* arguments */")) return usage
  if (entry?.kind !== "function") return ""

  const parameters = entry.parameters ?? []
  const hasRequiredParameters = parameters.some(
    (parameter) => !parameter.optional && parameter.default === undefined
  )
  const escapedName = entry.name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
  const hasExplicitEmptySignature = new RegExp(
    `\\b${escapedName}(?:<[^>]*>)?\\(\\)`,
    "u"
  ).test(entry.signature ?? "")
  if (
    hasRequiredParameters ||
    (!parameters.length && !hasExplicitEmptySignature)
  ) {
    return ""
  }
  return usage.replace("/* arguments */", "")
}

function quickStart(item: RegistryItem, api: RegistryApiEntry[]) {
  const curated = curatedExamples[item.name]
  const importStatement = quickImport(item, api)
  const example = safeGeneratedExample(item, api)
  const code = curated
    ? curated
    : example?.includes("import ")
      ? example
      : [importStatement, example].filter(Boolean).join("\n\n")
  return item.meta?.ssr === false && code
    ? ['"use client"', code].join("\n\n")
    : code
}

export { primaryEntry, quickStart, safeCallableUsage }
