"use client"

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@aq-ui/registry/components/command"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { createSearchValue, scoreSearchResult } from "@/lib/search-score"

type RegistryItemType =
  "registry:ui" | "registry:hook" | "registry:style" | "registry:lib"

interface RegistrySearchItem {
  name: string
  title: string
  description: string
  type: RegistryItemType
}

interface SearchResult extends RegistrySearchItem {
  href: string
}

type LoadState = "loading" | "ready" | "error"

const staticPages = [
  {
    title: "Home",
    href: "/",
    keywords: "aq-ui documentation home overview",
  },
  {
    title: "Getting Started",
    href: "/getting-started/",
    keywords: "documentation installation setup introduction",
  },
  {
    title: "Components",
    href: "/components/",
    keywords: "component catalog ui",
  },
  {
    title: "Hooks",
    href: "/hooks/",
    keywords: "hook catalog react controller",
  },
  {
    title: "Editors",
    href: "/editors/",
    keywords: "rich text markdown code content editor",
  },
  {
    title: "Utilities",
    href: "/utilities/",
    keywords: "style library helper utility catalog",
  },
  {
    title: "CLI",
    href: "/cli/",
    keywords: "command line init add update doctor theme migrate",
  },
  {
    title: "Registry authoring",
    href: "/contributing/registry-authoring/",
    keywords: "contributing registry schema metadata authoring",
  },
] as const

const registryItemTypes: RegistryItemType[] = [
  "registry:ui",
  "registry:hook",
  "registry:style",
  "registry:lib",
]

function getDocsBasePath(pathname: string) {
  return pathname === "/aq-ui" || pathname.startsWith("/aq-ui/") ? "/aq-ui" : ""
}

function routeForItem(item: RegistrySearchItem) {
  switch (item.type) {
    case "registry:ui":
      return `/components/${item.name}/`
    case "registry:hook":
      return `/hooks/${item.name}/`
    case "registry:style":
    case "registry:lib":
      return `/utilities/${item.name}/`
  }
}

function isRegistrySearchItem(value: unknown): value is RegistrySearchItem {
  if (!value || typeof value !== "object") return false

  const item = value as Partial<RegistrySearchItem>
  return (
    typeof item.name === "string" &&
    typeof item.title === "string" &&
    typeof item.description === "string" &&
    registryItemTypes.some((type) => type === item.type)
  )
}

function searchItemsFrom(value: unknown): SearchResult[] {
  if (!value || typeof value !== "object" || !("items" in value)) return []

  const items = (value as { items?: unknown }).items
  if (!Array.isArray(items)) return []

  return items.filter(isRegistrySearchItem).map((item) => ({
    ...item,
    href: routeForItem(item),
  }))
}

interface SiteSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  query: string
  onQueryChange: (query: string) => void
  triggerId: string
  onRequestRestoreFocus: () => void
}

export function SiteSearchDialog({
  open,
  onOpenChange,
  query,
  onQueryChange,
  triggerId,
  onRequestRestoreFocus,
}: SiteSearchDialogProps) {
  const router = useRouter()
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [registryItems, setRegistryItems] = useState<SearchResult[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const loadSearchIndex = useCallback(() => {
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    return fetch(
      `${getDocsBasePath(window.location.pathname)}/search-index.json`,
      { signal: controller.signal }
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `Search index request failed with ${response.status}.`
          )
        }

        const items = searchItemsFrom(await response.json())
        if (items.length === 0) {
          throw new Error("The search index did not contain searchable items.")
        }

        setRegistryItems(items)
        setLoadState("ready")
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setLoadState("error")
      })
      .finally(() => {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null
        }
      })
  }, [])

  useEffect(() => {
    void loadSearchIndex()
    return () => abortControllerRef.current?.abort()
  }, [loadSearchIndex])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  function navigate(href: string) {
    onQueryChange("")
    onOpenChange(false)
    router.push(href)
  }

  function retrySearchIndex() {
    inputRef.current?.focus()
    setLoadState("loading")
    void loadSearchIndex()
  }

  const utilities = registryItems.filter(
    (item) => item.type === "registry:style" || item.type === "registry:lib"
  )

  return (
    <div hidden={!open}>
      <CommandDialog
        open={open}
        onOpenChange={onOpenChange}
        onOpenChangeComplete={(nextOpen) => {
          if (!nextOpen) onRequestRestoreFocus()
        }}
        triggerId={triggerId}
        title="Search aq-ui documentation"
        description="Search pages, components, hooks, editors, and utilities."
        showCloseButton
        className="top-4 max-h-[calc(100dvh-2rem)] shadow-2xl sm:top-[15dvh] sm:max-w-2xl"
      >
        <Command
          label="Search documentation"
          filter={scoreSearchResult}
          className="max-h-[calc(100dvh-2rem)] min-h-0 rounded-none! p-0"
        >
          <CommandInput
            ref={inputRef}
            value={query}
            onValueChange={onQueryChange}
            placeholder="Search documentation…"
            aria-label="Search documentation"
            className="pe-9"
          />
          {loadState === "loading" ? (
            <p
              role="status"
              aria-live="polite"
              className="px-3 py-2 text-xs text-muted-foreground"
            >
              Loading the search index…
            </p>
          ) : null}

          {loadState === "error" ? (
            <div
              role="alert"
              className="m-1 flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs"
            >
              <span>Search results could not be loaded.</span>
              <button
                type="button"
                onClick={retrySearchIndex}
                className="min-h-9 shrink-0 rounded-md px-3 py-1 font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                Try again
              </button>
            </div>
          ) : null}

          <CommandList
            aria-busy={loadState === "loading"}
            className="max-h-[calc(100dvh-8rem)] min-h-0 overscroll-contain [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]! sm:max-h-[min(65dvh,28rem)] [&::-webkit-scrollbar]:block! [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
          >
            {loadState === "ready" ? (
              <CommandEmpty className="px-4 py-10">
                <span className="block font-medium text-foreground">
                  No results found
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Try a component, hook, editor, or page name.
                </span>
              </CommandEmpty>
            ) : null}

            <CommandGroup heading="Documentation">
              {staticPages.map((page) => (
                <CommandItem
                  key={page.href}
                  value={createSearchValue(page.title, page.href)}
                  keywords={[page.keywords]}
                  onSelect={() => navigate(page.href)}
                  className="min-h-10"
                >
                  <span className="min-w-0 flex-1 truncate" title={page.title}>
                    {page.title}
                  </span>
                  <span className="ms-auto shrink-0 text-xs text-muted-foreground">
                    Page
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>

            {loadState === "ready" ? (
              <>
                <CommandGroup heading="Components">
                  {registryItems
                    .filter((item) => item.type === "registry:ui")
                    .map((item) => (
                      <RegistryCommandItem
                        key={item.name}
                        item={item}
                        onSelect={navigate}
                      />
                    ))}
                </CommandGroup>
                <CommandGroup heading="Hooks">
                  {registryItems
                    .filter((item) => item.type === "registry:hook")
                    .map((item) => (
                      <RegistryCommandItem
                        key={item.name}
                        item={item}
                        onSelect={navigate}
                      />
                    ))}
                </CommandGroup>
                <CommandGroup heading="Utilities">
                  {utilities.map((item) => (
                    <RegistryCommandItem
                      key={item.name}
                      item={item}
                      onSelect={navigate}
                    />
                  ))}
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
          <div
            aria-hidden="true"
            className="hidden shrink-0 items-center justify-end gap-4 border-t px-3 py-2 text-[11px] text-muted-foreground sm:flex"
          >
            <span className="inline-flex items-center gap-1.5">
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-sans leading-none">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-sans leading-none">
                Enter
              </kbd>
              Open
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-sans leading-none">
                Esc
              </kbd>
              Close
            </span>
          </div>
        </Command>
      </CommandDialog>
    </div>
  )
}

function RegistryCommandItem({
  item,
  onSelect,
}: {
  item: SearchResult
  onSelect: (href: string) => void
}) {
  return (
    <CommandItem
      value={createSearchValue(item.name, item.title)}
      keywords={[item.description]}
      onSelect={() => onSelect(item.href)}
      className="min-h-12 py-2"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium" title={item.title}>
          {item.title}
        </span>
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <code
            dir="ltr"
            className="max-w-[45%] shrink-0 truncate"
            title={item.name}
          >
            {item.name}
          </code>
          <span aria-hidden="true">·</span>
          <span className="truncate" title={item.description}>
            {item.description}
          </span>
        </span>
      </span>
    </CommandItem>
  )
}
