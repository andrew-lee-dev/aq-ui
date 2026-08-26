import {
  primaryEntry,
  safeCallableUsage,
} from "@/lib/api-reference-quick-start"
import { exportAnchor } from "@/lib/api-anchor"
import type {
  RegistryApiEntry,
  RegistryApiMember,
  RegistryItem,
} from "@/lib/registry"

const typeKinds = new Set(["interface", "type"])
const compoundParts = [
  "Description",
  "Provider",
  "Content",
  "Trigger",
  "Overlay",
  "Header",
  "Footer",
  "Portal",
  "Action",
  "Title",
  "Close",
  "Item",
] as const

function exportDescription(
  item: RegistryItem,
  entry: RegistryApiEntry,
  primaryName?: string
) {
  if (entry.description) return entry.description
  if (entry.name === primaryName) return item.description
  if (typeKinds.has(entry.kind)) return `Type contract for ${entry.name}.`
  const part = compoundParts.find((suffix) => entry.name.endsWith(suffix))
  if (part) return `${part} export for composing ${item.title}.`
  return `Public ${entry.kind} export from ${item.title}.`
}

function MemberTable({
  exportName,
  label,
  members,
}: {
  exportName: string
  label: string
  members: RegistryApiMember[]
}) {
  if (!members.length) return null
  const hasTypes = members.some((member) => member.type)
  const hasDefaults = members.some((member) => member.default)
  const hasDescriptions = members.some((member) => member.description)
  return (
    <section className="mt-5 min-w-0">
      <h4 className="text-sm font-semibold">{label}</h4>
      <div
        tabIndex={0}
        role="region"
        aria-label={`${exportName} ${label.toLowerCase()}. Scroll horizontally to see every column.`}
        className="mt-2 max-w-full overflow-x-auto rounded-lg border focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <table className="w-full min-w-[38rem] text-start text-sm [&_code]:break-words [&_code]:whitespace-pre-wrap [&_tbody_tr]:border-b [&_tbody_tr:last-child]:border-0 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_th]:px-3 [&_th]:py-2 [&_th]:text-start [&_th]:align-top">
          <thead className="border-b bg-muted/40">
            <tr>
              <th scope="col">Name</th>
              {hasTypes ? <th scope="col">Type</th> : null}
              {hasDefaults ? <th scope="col">Default</th> : null}
              {hasDescriptions ? <th scope="col">Description</th> : null}
            </tr>
          </thead>
          <tbody>
            {members.map((member, index) => (
              <tr key={`${member.kind}-${member.name}-${index}`}>
                <th scope="row" className="font-normal">
                  <code>
                    {member.readonly ? "readonly " : ""}
                    {member.name}
                    {member.optional ? "?" : ""}
                  </code>
                </th>
                {hasTypes ? (
                  <td>
                    <code>{member.type ?? "—"}</code>
                  </td>
                ) : null}
                {hasDefaults ? (
                  <td>
                    <code>{member.default ?? "—"}</code>
                  </td>
                ) : null}
                {hasDescriptions ? (
                  <td className="text-muted-foreground">
                    {member.description ?? "—"}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ApiEntryCards({
  item,
  anchorPrefix = "api",
}: {
  item: RegistryItem
  anchorPrefix?: string
}) {
  const api = item.meta?.api ?? []
  const primary = primaryEntry(item, api)

  return (
    <div className="mt-6 grid min-w-0 gap-4">
      {api.map((entry) => {
        const description = exportDescription(item, entry, primary?.name)
        const propsTarget = entry.propsType
          ? api.find((candidate) => candidate.name === entry.propsType)
          : undefined
        const props = propsTarget ? [] : (entry.props ?? [])
        const usage = entry.usage ? safeCallableUsage(entry, entry.usage) : ""
        return (
          <article
            id={exportAnchor(item.name, entry.name, anchorPrefix, api)}
            key={entry.name}
            className="min-w-0 scroll-mt-20 overflow-hidden rounded-xl border p-4"
          >
            <header className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="min-w-0 font-mono text-base font-semibold break-all">
                {entry.name}
              </h3>
              <span className="rounded-full border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
                {entry.kind}
              </span>
              {entry.line && !entry.source ? (
                <a
                  href="#source"
                  className="ms-auto text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Source L{entry.line}
                </a>
              ) : null}
            </header>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              {description}
            </p>

            {entry.signature ? (
              <pre
                tabIndex={0}
                aria-label={`${entry.name} signature. Use arrow keys to scroll.`}
                className="mt-3 max-w-full overflow-x-auto rounded-lg bg-muted/40 p-3 text-sm leading-6 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <code>{entry.signature}</code>
              </pre>
            ) : null}

            {entry.source ? (
              <dl className="mt-3 text-sm">
                <div className="flex min-w-0 flex-wrap gap-x-2 rounded-lg border px-3 py-2">
                  <dt className="font-medium">Provenance</dt>
                  <dd className="min-w-0 text-muted-foreground">
                    Re-exported from{" "}
                    <code className="break-all">{entry.source}</code>
                  </dd>
                </div>
              </dl>
            ) : null}

            {entry.propsType || entry.returns ? (
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                {entry.propsType ? (
                  <div className="min-w-0 rounded-lg border p-3">
                    <dt className="font-medium">Props type</dt>
                    <dd className="mt-1 min-w-0 text-muted-foreground">
                      {propsTarget ? (
                        <a
                          href={`#${exportAnchor(item.name, propsTarget.name, anchorPrefix, api)}`}
                          className="font-mono break-words hover:underline"
                        >
                          {entry.propsType}
                        </a>
                      ) : (
                        <code className="break-words">{entry.propsType}</code>
                      )}
                    </dd>
                  </div>
                ) : null}
                {entry.returns ? (
                  <div className="min-w-0 rounded-lg border p-3">
                    <dt className="font-medium">Returns</dt>
                    <dd className="mt-1 min-w-0 text-muted-foreground">
                      <code className="break-words whitespace-pre-wrap">
                        {entry.returns}
                      </code>
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : null}

            <MemberTable
              exportName={entry.name}
              label="Props"
              members={props}
            />
            <MemberTable
              exportName={entry.name}
              label="Parameters"
              members={entry.parameters ?? []}
            />
            <MemberTable
              exportName={entry.name}
              label="Members"
              members={entry.members ?? []}
            />

            {usage ? (
              <div className="mt-4 rounded-lg border-s-2 border-primary ps-3 text-sm text-muted-foreground">
                {usage}
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}

export { ApiEntryCards, exportDescription }
