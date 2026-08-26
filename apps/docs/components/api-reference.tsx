import { ApiEntryCards } from "@/components/api-entry-cards"
import {
  ApiQuickStart,
  type EncodedHighlight,
} from "@/components/api-quick-start"
import { LazyApiDetails } from "@/components/lazy-api-details"
import { exportAnchor } from "@/lib/api-anchor"
import { quickStart } from "@/lib/api-reference-quick-start"
import type { RegistryItem } from "@/lib/registry"
import {
  highlightCodeLines,
  type HighlightToken,
} from "@aq-ui/registry/lib/code-highlighter"

interface ApiReferenceProps {
  item: RegistryItem
  compactMembers?: boolean
}

function encodeHighlight(lines: HighlightToken[][]): EncodedHighlight {
  const classNames: string[] = []
  const ranges: string[] = []
  let offset = 0

  lines.forEach((tokens, lineIndex) => {
    for (const token of tokens) {
      if (token.className) {
        let classIndex = classNames.indexOf(token.className)
        if (classIndex < 0) {
          classIndex = classNames.push(token.className) - 1
        }
        ranges.push(
          [offset, token.text.length, classIndex]
            .map((value) => value.toString(36))
            .join(":")
        )
      }
      offset += token.text.length
    }
    if (lineIndex < lines.length - 1) offset += 1
  })

  return [classNames, ranges.join(",")]
}

function QuickStart({ item, code }: { item: RegistryItem; code: string }) {
  const highlight = encodeHighlight(highlightCodeLines(code, "tsx"))
  return <ApiQuickStart code={code} highlight={highlight} title={item.title} />
}

function CompactReference({
  item,
  code,
  anchoredIndex,
  deferDetails,
}: {
  item: RegistryItem
  code: string
  anchoredIndex: boolean
  deferDetails: boolean
}) {
  const api = item.meta?.api ?? []
  return (
    <section id="public-api" className="mt-8 min-w-0 scroll-mt-20">
      <header className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold">API reference</h2>
        <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
          {item.meta?.ssr ? "SSR-safe" : "Client module"}
        </span>
        <a
          href="#source"
          className="ms-auto text-sm text-primary hover:underline"
        >
          View full source
        </a>
      </header>
      {code ? <QuickStart item={item} code={code} /> : null}
      <section className="mt-4 text-sm">
        <h3 className="font-semibold">Exports</h3>
        {anchoredIndex ? (
          <ul
            aria-label={`${item.title} API exports`}
            className="mt-1 flex min-w-0 flex-wrap gap-x-4 gap-y-1"
          >
            {api.map((entry) => (
              <li
                id={exportAnchor(item.name, entry.name, "api", api)}
                key={entry.name}
                className="min-w-0 scroll-mt-20"
              >
                <code className="break-all">{entry.name}</code>{" "}
                <span className="text-xs text-muted-foreground">
                  {entry.kind}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1">
            <code>
              {api.map((entry) => `${entry.name} (${entry.kind})`).join(", ")}
            </code>
          </p>
        )}
      </section>
      {deferDetails ? <LazyApiDetails name={item.name} /> : null}
    </section>
  )
}

function ApiReference({ item, compactMembers = false }: ApiReferenceProps) {
  const api = item.meta?.api ?? []
  if (!api.length) return null
  const quickStartCode = quickStart(item, api)
  const lazyDetails = api.length > 8
  const deferDetails = compactMembers || lazyDetails

  if (deferDetails) {
    return (
      <CompactReference
        item={item}
        code={quickStartCode}
        anchoredIndex={lazyDetails}
        deferDetails
      />
    )
  }

  return (
    <section id="public-api" className="mt-8 min-w-0 scroll-mt-20">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold">API reference</h2>
            {typeof item.meta?.ssr === "boolean" ? (
              <span className="rounded-full border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
                {item.meta.ssr ? "SSR-safe" : "Client module"}
              </span>
            ) : null}
          </div>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Import the parts you need, then jump to an export for its contract.
          </p>
        </div>
        <a
          href="#source"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          View full source
        </a>
      </div>

      {quickStartCode ? <QuickStart item={item} code={quickStartCode} /> : null}

      <nav
        aria-label={`${item.title} API exports`}
        className="mt-6 rounded-xl border bg-muted/20 p-3"
      >
        <h3 className="text-sm font-semibold">Exports</h3>
        <ul className="mt-2 flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-sm">
          {api.map((entry) => (
            <li key={entry.name} className="min-w-0">
              <a
                href={`#${exportAnchor(item.name, entry.name, "api", api)}`}
                className="font-mono break-all underline-offset-4 hover:underline"
              >
                {entry.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <ApiEntryCards item={item} />
    </section>
  )
}

export { ApiReference }
