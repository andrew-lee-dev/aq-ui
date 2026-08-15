import type { Metadata } from "next"
import Link from "next/link"

import {
  CatalogSearch,
  type CatalogSearchSection,
} from "@/components/catalog-search"
import { getRegistry } from "@/lib/registry"

export const metadata: Metadata = { title: "Components" }

const contentComponentNames = new Set([
  "code-block",
  "code-editor",
  "markdown-editor",
  "markdown-renderer",
  "rich-text-editor",
])

export default function ComponentsPage() {
  const components = getRegistry().items.filter(
    (item) => item.type === "registry:ui"
  )
  const sections: CatalogSearchSection[] = [
    {
      id: "ui-components",
      title: "UI components",
      description:
        "Accessible controls, forms, overlays, navigation, data display, feedback, and advanced application patterns.",
      items: components
        .filter((item) => !contentComponentNames.has(item.name))
        .map((item) => ({
          name: item.name,
          title: item.title,
          description: item.description,
          href: `/components/${item.name}/`,
        })),
    },
    {
      id: "content-components",
      title: "Content and editors",
      description:
        "Static code and Markdown rendering plus CodeMirror, Markdown, and rich-text editing families.",
      items: components
        .filter((item) => contentComponentNames.has(item.name))
        .map((item) => ({
          name: item.name,
          title: item.title,
          description: item.description,
          href: `/components/${item.name}/`,
        })),
    },
  ]

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight">
        {components.length} component families
      </h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        Browse every public <code>registry:ui</code> family. Each component is
        installed as editable source with only the dependencies it needs.
      </p>
      <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
        Looking for production editor guidance? Visit the dedicated{" "}
        <Link
          href="/editors/"
          prefetch={false}
          className="font-medium text-foreground underline underline-offset-4"
        >
          Editors overview
        </Link>
        .
      </p>
      <CatalogSearch
        sections={sections}
        itemLabel="component"
        itemLabelPlural="components"
        searchLabel="Search components"
        placeholder="Search by component name or capability…"
        emptyTitle="No components found"
        emptyDescription="Try a broader term such as form, navigation, data, Markdown, or editor."
      />
    </main>
  )
}
