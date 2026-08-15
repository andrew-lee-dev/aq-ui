"use client"

import { SearchIcon } from "lucide-react"
import dynamic from "next/dynamic"
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react"

function preloadSiteSearchDialog() {
  void import("./site-search-dialog").catch(() => undefined)
}

const LazySiteSearchDialog = dynamic(
  () =>
    import("./site-search-dialog").then((module) => module.SiteSearchDialog),
  {
    ssr: false,
    loading: () => (
      <span
        role="status"
        aria-live="polite"
        className="fixed start-1/2 top-20 z-50 max-w-[calc(100vw-2rem)] -translate-x-1/2 truncate rounded-lg border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-lg rtl:translate-x-1/2"
      >
        Opening search…
      </span>
    ),
  }
)

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false

  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [role="textbox"]'
    )
  )
}

function hasOpenModalDialog() {
  return Boolean(
    document.querySelector(
      '[role="dialog"][aria-modal="true"]:not([hidden]):not([aria-hidden="true"])'
    )
  )
}

export function SiteSearch() {
  const [open, setOpen] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)
  const [query, setQuery] = useState("")
  const triggerId = useId()
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const restoreFrameRef = useRef<number | null>(null)

  const restoreTriggerFocus = useCallback(() => {
    if (restoreFrameRef.current !== null) {
      cancelAnimationFrame(restoreFrameRef.current)
    }
    restoreFrameRef.current = requestAnimationFrame(() => {
      restoreFrameRef.current = null
      if (triggerRef.current?.isConnected) {
        triggerRef.current.focus({ preventScroll: true })
      }
    })
  }, [])

  const openSearch = useCallback(() => {
    setHasOpened(true)
    setOpen(true)
  }, [])

  const closeSearch = useCallback(() => {
    setOpen(false)
    setQuery("")
    restoreTriggerFocus()
  }, [restoreTriggerFocus])

  useEffect(
    () => () => {
      if (restoreFrameRef.current !== null) {
        cancelAnimationFrame(restoreFrameRef.current)
      }
    },
    []
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing || event.repeat) return

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        if (!open && hasOpenModalDialog()) return
        event.preventDefault()
        if (open) closeSearch()
        else openSearch()
        return
      }

      if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey &&
        !open &&
        !hasOpenModalDialog() &&
        !isEditableTarget(event.target)
      ) {
        event.preventDefault()
        openSearch()
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [closeSearch, open, openSearch])

  function onTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowDown") return
    event.preventDefault()
    openSearch()
  }

  return (
    <>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        onClick={openSearch}
        onKeyDown={onTriggerKeyDown}
        onPointerEnter={preloadSiteSearchDialog}
        onFocus={preloadSiteSearchDialog}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-keyshortcuts="Meta+K Control+K /"
        aria-label="Search documentation (Command K or Control K)"
        title="Search documentation (⌘K, Ctrl+K, or /)"
        className="inline-flex size-8 shrink-0 items-center justify-center gap-2 rounded-lg border bg-background px-0 text-sm text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none sm:w-auto sm:px-2.5"
      >
        <SearchIcon aria-hidden="true" className="size-4" />
        <span className="hidden sm:inline">Search docs</span>
        <kbd
          aria-hidden="true"
          className="hidden rounded border bg-muted px-1.5 py-0.5 font-sans text-[10px] leading-none text-muted-foreground lg:inline-flex"
        >
          ⌘/Ctrl K
        </kbd>
      </button>

      {hasOpened ? (
        <LazySiteSearchDialog
          open={open}
          onOpenChange={(nextOpen) => {
            if (nextOpen) openSearch()
            else closeSearch()
          }}
          query={query}
          onQueryChange={setQuery}
          triggerId={triggerId}
          onRequestRestoreFocus={restoreTriggerFocus}
        />
      ) : null}
    </>
  )
}
