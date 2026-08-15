"use client"

import type { ReactNode, RefObject } from "react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@aq-ui/registry/components/sheet"

function MobileNavigationDrawer({
  children,
  open,
  onOpenChange,
  finalFocusRef,
  side,
}: {
  children: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  finalFocusRef: RefObject<HTMLButtonElement | null>
  side: "left" | "right"
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      triggerId="docs-navigation-trigger"
    >
      <SheetContent
        id="docs-navigation-drawer"
        side={side}
        finalFocus={finalFocusRef}
        className="h-svh! max-h-svh! w-screen! max-w-none! gap-0 overflow-hidden p-0 md:w-80!"
      >
        <SheetHeader className="shrink-0 border-b pe-14">
          <SheetTitle>Documentation</SheetTitle>
          <SheetDescription>
            Browse guides, components, hooks, editors, and utilities.
          </SheetDescription>
        </SheetHeader>
        <div
          data-docs-navigation-scroll=""
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-5 [scrollbar-gutter:stable]"
        >
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export { MobileNavigationDrawer }
