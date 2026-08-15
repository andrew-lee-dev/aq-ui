"use client"

import * as React from "react"
import { Code2Icon, PaletteIcon, SettingsIcon } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@aq-ui/registry/components/breadcrumb"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@aq-ui/registry/components/menubar"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@aq-ui/registry/components/navigation-menu"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@aq-ui/registry/components/pagination"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@aq-ui/registry/components/sidebar"

function BreadcrumbExample() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="../">Docs</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

function PaginationExample() {
  const [page, setPage] = React.useState(2)
  const selectPage = (next: number) => (event: React.MouseEvent) => {
    event.preventDefault()
    setPage(Math.max(1, Math.min(5, next)))
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={`?page=${Math.max(1, page - 1)}`}
            disabled={page === 1}
            onClick={selectPage(page - 1)}
          />
        </PaginationItem>
        {[1, 2, 3].map((value) => (
          <PaginationItem key={value}>
            <PaginationLink
              href={`?page=${value}`}
              isActive={page === value}
              onClick={selectPage(value)}
            >
              {value}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            href={`?page=${Math.min(5, page + 1)}`}
            disabled={page === 5}
            onClick={selectPage(page + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

function NavigationMenuExample() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-80 gap-1 p-1">
              <NavigationMenuLink href="../">
                <Code2Icon />
                <span>
                  <span className="block font-medium">Components</span>
                  <span className="block text-xs text-muted-foreground">
                    Accessible building blocks for product UI.
                  </span>
                </span>
              </NavigationMenuLink>
              <NavigationMenuLink href="../../utilities/aq-neutral/">
                <PaletteIcon />
                <span>
                  <span className="block font-medium">Themes</span>
                  <span className="block text-xs text-muted-foreground">
                    OKLCH tokens, dark mode, and RTL.
                  </span>
                </span>
              </NavigationMenuLink>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="../../getting-started/">
            Documentation
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

function MenubarExample() {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            New project <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Open… <MenubarShortcut>⌘O</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Export registry</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Toggle sidebar</MenubarItem>
          <MenubarItem>Command palette</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}

const sidebarItems = [
  { label: "Components", icon: Code2Icon, active: true },
  { label: "Themes", icon: PaletteIcon, active: false },
  { label: "Settings", icon: SettingsIcon, active: false },
]

function SidebarExample() {
  return (
    <SidebarProvider
      className="h-80 min-h-0 overflow-hidden rounded-xl border"
      style={{ "--sidebar-width": "13rem" } as React.CSSProperties}
    >
      <Sidebar collapsible="none" className="border-e">
        <SidebarHeader className="border-b p-3 font-semibold">
          aq-ui
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Documentation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {sidebarItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton isActive={item.active}>
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="min-w-0 p-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <span className="font-medium">Component workspace</span>
        </div>
        <div className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          Select a section from the sidebar to continue.
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

const AdvancedNavigationExamples: Record<string, React.ComponentType> = {
  breadcrumb: BreadcrumbExample,
  pagination: PaginationExample,
  "navigation-menu": NavigationMenuExample,
  menubar: MenubarExample,
  sidebar: SidebarExample,
}

interface AdvancedNavigationRendererProps {
  name: string
}

function AdvancedNavigationRenderer({ name }: AdvancedNavigationRendererProps) {
  const Example = AdvancedNavigationExamples[name]

  if (!Example) {
    return <p role="alert">The preview for {name} is unavailable.</p>
  }

  return <Example />
}

export { AdvancedNavigationRenderer }
