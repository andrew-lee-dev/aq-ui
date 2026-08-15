import type { Metadata } from "next"
import Link from "next/link"

import { Badge } from "@aq-ui/registry/components/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@aq-ui/registry/components/card"

import { getRegistry, type RegistryItem } from "@/lib/registry"

export const metadata: Metadata = { title: "Components and hooks" }

export default function CatalogPage() {
  const groups = getRegistry().items.reduce<Record<string, RegistryItem[]>>(
    (result, item) => {
      const group = (result[item.type] ??= [])
      group.push(item)
      return result
    },
    {}
  )
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight">
        Components and hooks
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Every item is installed as editable source through the aq-ui registry.
      </p>
      {Object.entries(groups).map(([type, group]) => (
        <section key={type} className="mt-12">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-2xl font-semibold capitalize">
              {type.replace("registry:", "")}
            </h2>
            <Badge variant="secondary">{group?.length ?? 0}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group?.map((item) => (
              <Link
                key={item.name}
                href={`/components/${item.name}/`}
                prefetch={false}
              >
                <Card className="h-full transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}
