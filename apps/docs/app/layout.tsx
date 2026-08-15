import type { Metadata } from "next"
import Link from "next/link"

import "@aq-ui/registry/globals.css"
import {
  MobileSiteNavigation,
  SiteNavigation,
} from "@/components/site-navigation"
import { SiteSearch } from "@/components/site-search"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"

export const metadata: Metadata = {
  title: { default: "aq-ui", template: "%s · aq-ui" },
  description: "Open-code React components, hooks, and content editors.",
}

const docsBasePath = process.env.GITHUB_ACTIONS ? "/aq-ui" : ""

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="scroll-pt-16 font-sans antialiased"
    >
      <body className="min-h-svh">
        <ThemeProvider>
          <a
            href="#main-content"
            className="fixed start-4 top-3 z-[100] -translate-y-20 rounded-md bg-background px-3 py-2 text-sm font-medium shadow-lg ring-1 ring-border transition-transform focus:translate-y-0 focus:ring-2 focus:ring-ring focus:outline-none"
          >
            Skip to content
          </a>
          <header className="sticky top-0 z-40 h-14 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/75">
            <div className="flex h-full items-center gap-2 px-3 sm:gap-4 sm:px-6">
              <MobileSiteNavigation />
              <Link
                href="/"
                prefetch={false}
                className="inline-flex shrink-0 items-center gap-1.5 font-semibold tracking-tight outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-ring"
              >
                {/* The metadata icon route is already optimized to 64px. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${docsBasePath}/icon.png`}
                  alt=""
                  width={28}
                  height={28}
                  className="dark:invert"
                />
                aq-ui
              </Link>
              <div className="ms-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
                <SiteSearch />
                <a
                  href="https://github.com/andrew-lee-dev/aq-ui"
                  className="hidden text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:rounded focus-visible:ring-2 focus-visible:ring-ring md:inline"
                >
                  GitHub
                </a>
                <ThemeToggle />
              </div>
            </div>
          </header>
          <div className="flex min-h-[calc(100svh-3.5rem)]">
            <SiteNavigation />
            <div className="flex min-w-0 flex-1 flex-col">
              <div
                id="main-content"
                tabIndex={-1}
                className="min-w-0 flex-1 scroll-mt-16 outline-none"
              >
                {children}
              </div>
              <footer className="border-t">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:px-6">
                  <p>aq-ui · Open source under the MIT License.</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <Link
                      href="/contributing/registry-authoring/"
                      prefetch={false}
                      className="outline-none hover:text-foreground focus-visible:rounded focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Registry authoring
                    </Link>
                    <p>React 18.3/19 · Tailwind CSS 4 · Base UI</p>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
