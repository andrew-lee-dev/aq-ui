import type { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  RegistryItemDetail,
  registryItemDescription,
} from "@/components/registry-item-detail"
import { getRegistry, getRegistryItem } from "@/lib/registry"

interface UtilityPageProps {
  params: Promise<{ name: string }>
}

export const dynamicParams = false

function isUtilityType(type: string | undefined) {
  return type === "registry:style" || type === "registry:lib"
}

export function generateStaticParams() {
  return getRegistry()
    .items.filter((item) => isUtilityType(item.type))
    .map((item) => ({ name: item.name }))
}

export async function generateMetadata({
  params,
}: UtilityPageProps): Promise<Metadata> {
  const item = getRegistryItem((await params).name)
  return item && isUtilityType(item.type)
    ? { title: item.title, description: registryItemDescription(item) }
    : {}
}

export default async function UtilityPage({ params }: UtilityPageProps) {
  const item = getRegistryItem((await params).name)
  if (!item || !isUtilityType(item.type)) notFound()
  return <RegistryItemDetail item={item} collection="utilities" />
}
