import type { Metadata } from "next"

import {
  CatalogSearch,
  type CatalogSearchSection,
} from "@/components/catalog-search"
import { getRegistry } from "@/lib/registry"

export const metadata: Metadata = { title: "Utilities" }

function isUtilityType(type: string) {
  return type === "registry:style" || type === "registry:lib"
}

export default function UtilitiesPage() {
  const utilities = getRegistry().items.filter((item) =>
    isUtilityType(item.type)
  )
  const sections: CatalogSearchSection[] = [
    {
      id: "styles",
      title: "Theme and styles",
      description:
        "CSS-first theme foundations, semantic tokens, dark mode, RTL, and reduced-motion defaults.",
      items: utilities
        .filter((item) => item.type === "registry:style")
        .map((item) => ({
          name: item.name,
          title: item.title,
          description: item.description,
          href: `/utilities/${item.name}/`,
        })),
    },
    {
      id: "libraries",
      title: "Shared libraries",
      description:
        "Focused helpers installed as editable source only when a component or application needs them.",
      items: utilities
        .filter((item) => item.type === "registry:lib")
        .map((item) => ({
          name: item.name,
          title: item.title,
          description: item.description,
          href: `/utilities/${item.name}/`,
        })),
    },
  ]

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight">
        {utilities.length} utilities and foundations
      </h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        Browse every public <code>registry:style</code> and{" "}
        <code>registry:lib</code> item. These focused dependencies support the
        component and editor catalogs without being presented as components or
        hooks.
      </p>
      <CatalogSearch
        sections={sections}
        itemLabel="utility"
        itemLabelPlural="utilities"
        searchLabel="Search utilities"
        placeholder="Search by utility name or capability…"
        emptyTitle="No utilities found"
        emptyDescription="Try a broader term such as theme, HTML, upload, or class names."
      />
    </main>
  )
}
