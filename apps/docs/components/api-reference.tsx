import { Fragment } from "react"

import { ApiEntryCards } from "@/components/api-entry-cards"
import { CopyButton } from "@/components/copy-button"
import { LazyApiDetails } from "@/components/lazy-api-details"
import { exportAnchor } from "@/lib/api-anchor"
import { quickStart } from "@/lib/api-reference-quick-start"
import type { RegistryItem } from "@/lib/registry"
import {
  codeHighlightClassName,
  highlightCodeLines,
} from "@aq-ui/registry/lib/code-highlighter"

interface ApiReferenceProps {
  item: RegistryItem
  compactMembers?: boolean
}

function QuickStart({ item, code }: { item: RegistryItem; code: string }) {
  const lines = highlightCodeLines(code, "tsx")

  return (
    <div className="mt-4 overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between border-b px-3 py-1">
        <h3 className="text-sm font-semibold">Quick start</h3>
        <CopyButton
          value={code}
          label="Copy quick start"
          className="p-1 text-xs hover:underline"
        />
      </div>
      <pre
        tabIndex={0}
        aria-label={`${item.title} quick start. Use arrow keys to scroll.`}
        className="overflow-x-auto p-3 text-sm leading-6"
      >
        <code
          className={`block min-w-max font-mono ${codeHighlightClassName}`}
          data-language="tsx"
        >
          {lines.map((tokens, lineIndex) => (
            <Fragment key={lineIndex}>
              {tokens.length > 0
                ? tokens.map((token, tokenIndex) =>
                    token.className ? (
                      <span key={tokenIndex} className={token.className}>
                        {token.text}
                      </span>
                    ) : (
                      token.text
                    )
                  )
                : "\u200b"}
              {lineIndex < lines.length - 1 ? "\n" : null}
            </Fragment>
          ))}
        </code>
      </pre>
    </div>
  )
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
                data-api-export={entry.name}
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
          <p className="mt-1" data-api-export="summary">
            {api.map((entry, index) => (
              <span key={entry.name}>
                {index ? ", " : ""}
                <code>{entry.name}</code> ({entry.kind})
              </span>
            ))}
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
