import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Badge } from "@aq-ui/registry/components/badge"

import { ApiReference } from "@/components/api-reference"
import { ComponentExample } from "@/components/examples/component-example"
import {
  ButtonGuide,
  buttonDescription,
} from "@/components/guides/button-guide"
import { RegistrySource } from "@/components/registry-source"
import { getRegistry, getRegistryItem, getRegistryRecord } from "@/lib/registry"

interface RegistryItemPageProps {
  params: Promise<{ name: string }>
}

export const dynamicParams = false

export function generateStaticParams() {
  return getRegistry().items.map((item) => ({ name: item.name }))
}

export async function generateMetadata({
  params,
}: RegistryItemPageProps): Promise<Metadata> {
  const item = getRegistryItem((await params).name)
  return item
    ? {
        title: item.title,
        description:
          item.name === "button" ? buttonDescription : item.description,
      }
    : {}
}

export default async function RegistryItemPage({
  params,
}: RegistryItemPageProps) {
  const item = getRegistryItem((await params).name)
  if (!item) notFound()
  const record = getRegistryRecord(item.name) ?? item
  const description =
    item.name === "button" ? buttonDescription : item.description
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Badge variant="outline">{item.type.replace("registry:", "")}</Badge>
      <h1 className="mt-4 text-4xl font-bold tracking-tight">{item.title}</h1>
      <p className="mt-3 text-lg text-muted-foreground">{description}</p>
      {item.type === "registry:ui" ? (
        <ComponentExample name={item.name} />
      ) : null}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Installation</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl border bg-muted/40 p-4 text-sm">
          <code>{`pnpm dlx aq-ui add ${item.name}`}</code>
        </pre>
      </section>
      {item.name === "button" ? <ButtonGuide /> : null}
      <ApiReference item={record} compactMembers={item.name === "button"} />
      {item.registryDependencies?.length ? (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Registry dependencies</h2>
          <p className="mt-2 font-mono text-sm text-muted-foreground">
            {item.registryDependencies.join(", ")}
          </p>
        </section>
      ) : null}
      {item.dependencies?.length ? (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Package dependencies</h2>
          <p className="mt-2 font-mono text-sm text-muted-foreground">
            {item.dependencies.join(", ")}
          </p>
        </section>
      ) : null}
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Files</h2>
        <ul className="mt-3 space-y-2">
          {item.files?.map((file) => (
            <li
              key={file.path}
              className="rounded-lg border px-3 py-2 font-mono text-sm"
            >
              {file.path}
            </li>
          ))}
        </ul>
      </section>
      <RegistrySource name={item.name} />
    </main>
  )
}
