"use client"

import Link from "next/link"
import { useId, useMemo, useRef, useState } from "react"

export interface CatalogSearchItem {
  name: string
  title: string
  description: string
  href: string
}

export interface CatalogSearchSection {
  id: string
  title: string
  description?: string
  items: CatalogSearchItem[]
}

interface CatalogSearchProps {
  sections: CatalogSearchSection[]
  itemLabel: string
  itemLabelPlural: string
  searchLabel: string
  placeholder: string
  emptyTitle: string
  emptyDescription: string
}

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase("en")
}

export function CatalogSearch({
  sections,
  itemLabel,
  itemLabelPlural,
  searchLabel,
  placeholder,
  emptyTitle,
  emptyDescription,
}: CatalogSearchProps) {
  const [query, setQuery] = useState("")
  const searchId = useId()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const normalizedQuery = normalizeSearch(query)
  const total = sections.reduce(
    (count, section) => count + section.items.length,
    0
  )
  const filteredSections = useMemo(
    () =>
      sections
        .map((section) => ({
          ...section,
          items: normalizedQuery
            ? section.items.filter((item) =>
                normalizeSearch(
                  `${item.name} ${item.title} ${item.description}`
                ).includes(normalizedQuery)
              )
            : section.items,
        }))
        .filter((section) => section.items.length > 0),
    [normalizedQuery, sections]
  )
  const visibleCount = filteredSections.reduce(
    (count, section) => count + section.items.length,
    0
  )
  const visibleLabel = visibleCount === 1 ? itemLabel : itemLabelPlural

  function clearSearch() {
    setQuery("")
    searchInputRef.current?.focus()
  }

  return (
    <div className="mt-10">
      <div className="rounded-xl border bg-muted/20 p-4 sm:p-5">
        <label htmlFor={searchId} className="text-sm font-medium">
          {searchLabel}
        </label>
        <input
          ref={searchInputRef}
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key !== "Escape") return
            event.preventDefault()
            clearSearch()
          }}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          aria-describedby={`${searchId}-status`}
          className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
        <p
          id={`${searchId}-status`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="mt-2 text-sm [overflow-wrap:anywhere] text-muted-foreground"
        >
          {normalizedQuery
            ? `${visibleCount} of ${total} ${visibleLabel} match “${query.trim()}”.`
            : `${total} ${itemLabelPlural} available.`}
        </p>
      </div>

      {visibleCount > 0 ? (
        <div id={`${searchId}-results`}>
          {filteredSections.map((section) => {
            const sectionHeadingId = `${searchId}-${section.id}-heading`
            const originalSection = sections.find(
              (candidate) => candidate.id === section.id
            )
            const sectionTotal = originalSection?.items.length ?? 0
            return (
              <section
                key={section.id}
                aria-labelledby={sectionHeadingId}
                className="mt-12"
              >
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2
                      id={sectionHeadingId}
                      className="text-2xl font-semibold"
                    >
                      {section.title}
                    </h2>
                    {section.description ? (
                      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                        {section.description}
                      </p>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                    {normalizedQuery
                      ? `${section.items.length} of ${sectionTotal}`
                      : section.items.length}
                  </span>
                </div>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {section.items.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        prefetch={false}
                        className="block h-full rounded-xl border bg-card p-5 text-card-foreground transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                      >
                        <span className="font-semibold">{item.title}</span>
                        <code className="mt-1 block text-xs text-muted-foreground">
                          {item.name}
                        </code>
                        <span className="mt-3 block text-sm leading-6 text-muted-foreground">
                          {item.description}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      ) : (
        <div className="mt-12 rounded-xl border border-dashed p-8 text-center">
          <h2 className="text-xl font-semibold">{emptyTitle}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            {emptyDescription}
          </p>
          <button
            type="button"
            onClick={clearSearch}
            className="mt-5 rounded-lg border bg-background px-3 py-2 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  )
}
