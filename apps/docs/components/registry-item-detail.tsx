import "server-only"

import Link from "next/link"

import { Badge } from "@aq-ui/registry/components/badge"

import { ApiReference } from "@/components/api-reference"
import { ComponentExample } from "@/components/examples/component-example"
import {
  ButtonGuide,
  buttonDescription,
} from "@/components/guides/button-guide"
import { RegistrySource } from "@/components/registry-source"
import { getRegistryRecord, type RegistryItem } from "@/lib/registry"

interface RegistryItemDetailProps {
  item: RegistryItem
  collection: "components" | "hooks" | "utilities"
}

const editorNames = new Set([
  "code-block",
  "code-editor",
  "markdown-editor",
  "markdown-renderer",
  "rich-text-editor",
])

export function registryItemDescription(item: RegistryItem) {
  return item.name === "button" ? buttonDescription : item.description
}

export function RegistryItemDetail({
  item,
  collection,
}: RegistryItemDetailProps) {
  const record = getRegistryRecord(item.name) ?? item
  const description = registryItemDescription(item)
  const isComponent = collection === "components"
  const isEditor = isComponent && editorNames.has(item.name)
  const backCollection = isEditor ? "editors" : collection
  const collectionLabel = isEditor
    ? "Editors"
    : collection === "components"
      ? "Components"
      : collection === "hooks"
        ? "Hooks"
        : "Utilities"
  const typeLabel = isEditor
    ? "Editor"
    : collection === "components"
      ? "Component"
      : collection === "hooks"
        ? "Hook"
        : item.type === "registry:style"
          ? "Style"
          : "Library"

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Link
        href={`/${backCollection}/`}
        prefetch={false}
        className="mb-5 flex w-fit gap-2 text-sm hover:underline focus-visible:outline focus-visible:outline-offset-2"
      >
        <span aria-hidden className="inline-block rtl:rotate-180">
          ←
        </span>
        Back to {collectionLabel}
      </Link>
      <Badge variant="outline">{typeLabel}</Badge>
      <h1 className="mt-4 text-4xl font-bold tracking-tight">{item.title}</h1>
      <p className="mt-3 text-lg text-muted-foreground">{description}</p>
      {isComponent ? <ComponentExample name={item.name} /> : null}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Installation</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl border bg-muted/40 p-4 text-sm">
          <code>{`pnpm dlx aq-ui@alpha add ${item.name}`}</code>
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
