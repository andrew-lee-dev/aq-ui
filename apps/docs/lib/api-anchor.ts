interface ApiAnchorEntry {
  name: string
}

function exportSlug(exportName: string) {
  return (
    exportName
      .replace(/([a-z0-9])([A-Z])/gu, "$1-$2")
      .replace(/[^a-z0-9]+/giu, "-")
      .replace(/^-|-$/gu, "")
      .toLowerCase() || "export"
  )
}

function exportAnchor(
  itemName: string,
  exportName: string,
  prefix = "api",
  entries: readonly ApiAnchorEntry[] = []
) {
  const slug = exportSlug(exportName)
  const base = `${prefix}-${itemName}-${slug}`
  const collisions = entries.filter((entry) => exportSlug(entry.name) === slug)

  if (collisions.length < 2) return base

  const ordinal = collisions.findIndex((entry) => entry.name === exportName)
  return ordinal > 0 ? `${base}-${ordinal + 1}` : base
}

export { exportAnchor, exportSlug }
export type { ApiAnchorEntry }
