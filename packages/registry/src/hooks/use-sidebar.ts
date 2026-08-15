"use client"

import * as React from "react"

import {
  useControllableState,
  type ControllableStateUpdater,
} from "@aq-ui/registry/hooks/use-controllable-state"
import { useHotkeys } from "@aq-ui/registry/hooks/use-hotkeys"
import { useBreakpoint } from "@aq-ui/registry/hooks/use-breakpoint"

export type SidebarState = "expanded" | "collapsed"

export interface UseSidebarOptions {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  openMobile?: boolean
  defaultOpenMobile?: boolean
  onOpenMobileChange?: (open: boolean) => void
  mobileBreakpoint?: number
  shortcut?: string | false
  persist?: boolean
  cookieName?: string
  cookieMaxAge?: number
}

export interface SidebarControls {
  state: SidebarState
  open: boolean
  setOpen: (open: ControllableStateUpdater<boolean>) => void
  openMobile: boolean
  setOpenMobile: (open: ControllableStateUpdater<boolean>) => void
  isMobile: boolean
  toggleSidebar: () => void
  closeSidebar: () => void
}

export function useSidebar({
  open,
  defaultOpen = true,
  onOpenChange,
  openMobile,
  defaultOpenMobile = false,
  onOpenMobileChange,
  mobileBreakpoint = 768,
  shortcut = "mod+b",
  persist = true,
  cookieName = "sidebar_state",
  cookieMaxAge = 60 * 60 * 24 * 7,
}: UseSidebarOptions = {}): SidebarControls {
  const isMobile = useBreakpoint(mobileBreakpoint, { direction: "down" })
  const [desktopOpen, setDesktopOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })
  const [mobileOpen, setMobileOpen] = useControllableState({
    value: openMobile,
    defaultValue: defaultOpenMobile,
    onChange: onOpenMobileChange,
  })

  const setOpen = React.useCallback(
    (next: ControllableStateUpdater<boolean>) => {
      setDesktopOpen((current) => {
        const resolved = typeof next === "function" ? next(current) : next
        if (persist && typeof document !== "undefined") {
          document.cookie =
            encodeURIComponent(cookieName) +
            "=" +
            String(resolved) +
            "; path=/; max-age=" +
            Math.max(0, Math.floor(cookieMaxAge)) +
            "; SameSite=Lax"
        }
        return resolved
      })
    },
    [cookieMaxAge, cookieName, persist, setDesktopOpen]
  )

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setMobileOpen((current) => !current)
    } else {
      setOpen((current) => !current)
    }
  }, [isMobile, setMobileOpen, setOpen])

  const closeSidebar = React.useCallback(() => {
    if (isMobile) setMobileOpen(false)
    else setOpen(false)
  }, [isMobile, setMobileOpen, setOpen])

  useHotkeys(shortcut || "", toggleSidebar, {
    enabled: Boolean(shortcut),
    preventDefault: true,
  })

  return {
    state: desktopOpen ? "expanded" : "collapsed",
    open: desktopOpen,
    setOpen,
    openMobile: mobileOpen,
    setOpenMobile: setMobileOpen,
    isMobile,
    toggleSidebar,
    closeSidebar,
  }
}
