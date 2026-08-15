import type { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  RegistryItemDetail,
  registryItemDescription,
} from "@/components/registry-item-detail"
import { getRegistry, getRegistryItem } from "@/lib/registry"

interface HookPageProps {
  params: Promise<{ name: string }>
}

export const dynamicParams = false

export function generateStaticParams() {
  return getRegistry()
    .items.filter((item) => item.type === "registry:hook")
    .map((item) => ({ name: item.name }))
}

export async function generateMetadata({
  params,
}: HookPageProps): Promise<Metadata> {
  const item = getRegistryItem((await params).name)
  return item?.type === "registry:hook"
    ? { title: item.title, description: registryItemDescription(item) }
    : {}
}

export default async function HookPage({ params }: HookPageProps) {
  const item = getRegistryItem((await params).name)
  if (item?.type !== "registry:hook") notFound()
  return <RegistryItemDetail item={item} collection="hooks" />
}
