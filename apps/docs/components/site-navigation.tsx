"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import styles from "./site-navigation.module.css"

type MobileDrawerModule = {
  default: typeof import("@/components/mobile-navigation-drawer").MobileNavigationDrawer
}

let mobileDrawerPromise: Promise<MobileDrawerModule> | undefined

function loadMobileNavigationDrawer() {
  mobileDrawerPromise ??= import("@/components/mobile-navigation-drawer").then(
    (drawerModule) => ({
      default: drawerModule.MobileNavigationDrawer,
    })
  )
  return mobileDrawerPromise
}

const MobileNavigationDrawer = React.lazy(loadMobileNavigationDrawer)
const desktopNavigationQuery = "(min-width: 48rem)"

type NavigationItem = {
  href: string
  label: string
  count?: number
}

type NavigationSection = {
  label: string
  items: NavigationItem[]
}

const navigationSections: NavigationSection[] = [
  {
    label: "Start",
    items: [
      { href: "/", label: "Home" },
      { href: "/getting-started/", label: "Getting started" },
      { href: "/cli/", label: "CLI" },
    ],
  },
  {
    label: "Library",
    items: [
      {
        href: "/components/",
        label: "Components",
        count: 75,
      },
      { href: "/hooks/", label: "Hooks", count: 72 },
      {
        href: "/editors/",
        label: "Editors",
        count: 5,
      },
      {
        href: "/utilities/",
        label: "Utilities",
        count: 4,
      },
    ],
  },
  {
    label: "Contribute",
    items: [
      {
        href: "/contributing/registry-authoring/",
        label: "Registry authoring",
      },
    ],
  },
]

const editorComponentPaths = new Set([
  "/components/code-block/",
  "/components/code-editor/",
  "/components/markdown-editor/",
  "/components/markdown-renderer/",
  "/components/rich-text-editor/",
])

function isCurrentPath(pathname: string, href: string) {
  const docsPathname =
    pathname === "/aq-ui"
      ? "/"
      : pathname.startsWith("/aq-ui/")
        ? pathname.slice("/aq-ui".length)
        : pathname
  const normalizedPathname = docsPathname.endsWith("/")
    ? docsPathname
    : `${docsPathname}/`
  const editorDetail = editorComponentPaths.has(normalizedPathname)

  if (href === "/editors/" && editorDetail) return true
  if (href === "/components/" && editorDetail) return false

  if (href === "/") {
    return docsPathname === href
  }

  const pathWithoutTrailingSlash = href.slice(0, -1)
  return (
    docsPathname === pathWithoutTrailingSlash || docsPathname.startsWith(href)
  )
}

function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Documentation navigation" className={styles.navigation}>
      {navigationSections.map((section) => (
        <div key={section.label}>
          <p>{section.label}</p>
          <ul>
            {section.items.map((item) => {
              const active = isCurrentPath(pathname, item.href)

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    prefetch={false}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                  >
                    {item.label}
                    {item.count !== undefined ? (
                      <span data-count="" aria-label={`${item.count} items`}>
                        {item.count}
                      </span>
                    ) : null}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function SiteNavigation() {
  return (
    <aside aria-label="Documentation sidebar" className={styles.sidebar}>
      <div>
        <NavigationLinks />
      </div>
    </aside>
  )
}

function NoScriptNavigation() {
  return (
    <nav
      aria-label="Documentation navigation"
      className={`${styles.mobileFallback} ${styles.navigation}`}
    >
      {navigationSections.flatMap((section) =>
        section.items.map((item) => (
          <Link key={item.href} href={item.href} prefetch={false}>
            {item.label}
          </Link>
        ))
      )}
    </nav>
  )
}

function MobileSiteNavigation() {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [drawerMounted, setDrawerMounted] = React.useState(false)
  const [drawerReady, setDrawerReady] = React.useState(false)
  const [drawerSide, setDrawerSide] = React.useState<"left" | "right">("left")
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    const desktopNavigation = window.matchMedia(desktopNavigationQuery)

    function closeMobileNavigation(event: MediaQueryListEvent) {
      if (event.matches) setMobileOpen(false)
    }

    desktopNavigation.addEventListener("change", closeMobileNavigation)
    return () =>
      desktopNavigation.removeEventListener("change", closeMobileNavigation)
  }, [])

  function preloadNavigation() {
    void loadMobileNavigationDrawer().then(() => setDrawerReady(true))
  }

  function openNavigation() {
    const direction =
      document.documentElement.dir ||
      window.getComputedStyle(document.documentElement).direction

    preloadNavigation()
    setDrawerSide(direction === "rtl" ? "right" : "left")
    setDrawerMounted(true)
    setMobileOpen(true)
  }

  return (
    <>
      <button
        ref={triggerRef}
        id="docs-navigation-trigger"
        type="button"
        data-js-navigation-trigger=""
        className={styles.menuButton}
        aria-label="Open documentation navigation"
        aria-haspopup="dialog"
        aria-expanded={mobileOpen}
        aria-controls={
          mobileOpen && drawerReady ? "docs-navigation-drawer" : undefined
        }
        title="Open navigation"
        onClick={openNavigation}
        onFocus={preloadNavigation}
        onPointerEnter={preloadNavigation}
        aria-busy={mobileOpen && !drawerReady}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={styles.menuIcon}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <noscript>
        <style>{`[data-js-navigation-trigger] { display: none !important; }`}</style>
        <details className={styles.noScriptMenu}>
          <summary
            className={styles.menuButton}
            aria-label="Open documentation navigation"
          >
            ☰
          </summary>
          <NoScriptNavigation />
        </details>
      </noscript>
      {drawerMounted ? (
        <React.Suspense
          fallback={
            <span role="status" className={styles.loadingStatus}>
              Opening navigation…
            </span>
          }
        >
          <MobileNavigationDrawer
            open={mobileOpen}
            onOpenChange={setMobileOpen}
            finalFocusRef={triggerRef}
            side={drawerSide}
          >
            <NavigationLinks onNavigate={() => setMobileOpen(false)} />
          </MobileNavigationDrawer>
        </React.Suspense>
      ) : null}
    </>
  )
}

export { MobileSiteNavigation, SiteNavigation }
