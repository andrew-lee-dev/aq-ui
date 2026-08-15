import type { Metadata } from "next"
import Link from "next/link"

import "@aq-ui/registry/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"

export const metadata: Metadata = {
  title: { default: "aq-ui", template: "%s · aq-ui" },
  description: "Open-code React components, hooks, and content editors.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="font-sans antialiased">
      <body className="min-h-svh">
        <ThemeProvider>
          <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
            <div className="mx-auto flex min-h-14 max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 sm:px-6 md:h-14 md:flex-nowrap md:py-0">
              <Link href="/" className="font-semibold tracking-tight">
                aq-ui
              </Link>
              <nav
                aria-label="Primary navigation"
                className="order-last flex w-full items-center gap-4 overflow-x-auto text-sm whitespace-nowrap text-muted-foreground md:order-none md:w-auto md:overflow-visible"
              >
                <Link
                  href="/getting-started/"
                  className="hover:text-foreground"
                >
                  Docs
                </Link>
                <Link href="/components/" className="hover:text-foreground">
                  Catalog
                </Link>
                <Link href="/hooks/" className="hover:text-foreground">
                  Hooks
                </Link>
                <Link href="/editors/" className="hover:text-foreground">
                  Editors
                </Link>
                <Link href="/cli/" className="hover:text-foreground">
                  CLI
                </Link>
              </nav>
              <div className="ms-auto flex items-center gap-2">
                <a
                  href="https://github.com/aq-ui/aq-ui"
                  className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
                >
                  GitHub
                </a>
                <ThemeToggle />
              </div>
            </div>
          </header>
          {children}
          <footer className="border-t">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:px-6">
              <p>aq-ui · Open source under the MIT License.</p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/contributing/registry-authoring/"
                  className="hover:text-foreground"
                >
                  Registry authoring
                </Link>
                <p>React 18.3/19 · Tailwind CSS 4 · Base UI</p>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  )
}
