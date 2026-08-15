import type { Metadata } from "next"
import Link from "next/link"

import { Badge } from "@aq-ui/registry/components/badge"

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
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight">72 public hooks</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        The 60 general hooks depend only on React and Web APIs where possible.
        Browser state is SSR-safe, shared stores use{" "}
        <code>useSyncExternalStore</code>, observers are pooled, and
        asynchronous work supports cancellation.
      </p>
      <HookGroup title="Component controllers" items={controllers} />
      <HookGroup
        title="State, browser, DOM, and accessibility"
        items={general}
      />
    </main>
  )
}

function HookGroup({
  title,
  items,
}: {
  title: string
  items: ReturnType<typeof getRegistry>["items"]
}) {
  return (
    <section className="mt-12">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.name}
            href={`/components/${item.name}/`}
            prefetch={false}
            className="rounded-lg border px-3 py-2 font-mono text-sm transition-colors hover:bg-muted"
          >
            {item.name}
          </Link>
        ))}
      </div>
    </section>
  )
}
