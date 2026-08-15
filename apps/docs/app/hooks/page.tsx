import type { Metadata } from "next"

import {
  CatalogSearch,
  type CatalogSearchSection,
} from "@/components/catalog-search"
import { getRegistry } from "@/lib/registry"

export const metadata: Metadata = { title: "Hooks" }

const controllerNames = new Set([
  "use-toast",
  "use-sidebar",
  "use-pagination",
  "use-data-grid",
  "use-file-upload",
  "use-tree-view",
  "use-stepper",
  "use-message-scroller",
  "use-form-field",
  "use-code-editor",
  "use-markdown-editor",
  "use-rich-text-editor",
])

export default function HooksPage() {
  const hooks = getRegistry().items.filter(
    (item) => item.type === "registry:hook"
  )
  const controllers = hooks.filter((item) => controllerNames.has(item.name))
  const general = hooks.filter((item) => !controllerNames.has(item.name))
  const sections: CatalogSearchSection[] = [
    {
      id: "controller-hooks",
      title: "Component controllers",
      description:
        "State and behavior contracts shared by complex components and content editors.",
      items: controllers.map((item) => ({
        name: item.name,
        title: item.title,
        description: item.description,
        href: `/hooks/${item.name}/`,
      })),
    },
    {
      id: "general-hooks",
      title: "State, browser, DOM, and accessibility",
      description:
        "General-purpose hooks built on React and Web APIs with SSR-safe browser integration.",
      items: general.map((item) => ({
        name: item.name,
        title: item.title,
        description: item.description,
        href: `/hooks/${item.name}/`,
      })),
    },
  ]

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight">
        {hooks.length} public hooks
      </h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        {general.length} general hooks and {controllers.length} component
        controllers. Browser state is SSR-safe, shared stores use{" "}
        <code>useSyncExternalStore</code>, observers are pooled, and
        asynchronous work supports cancellation.
      </p>
      <CatalogSearch
        sections={sections}
        itemLabel="hook"
        itemLabelPlural="hooks"
        searchLabel="Search hooks"
        placeholder="Search by hook name or behavior…"
        emptyTitle="No hooks found"
        emptyDescription="Try a broader term such as state, focus, storage, observer, or editor."
      />
    </main>
  )
}
