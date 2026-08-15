"use client"

import * as React from "react"
import { Code2Icon, MoreHorizontalIcon, Trash2Icon } from "lucide-react"
import { Button } from "@aq-ui/registry/components/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@aq-ui/registry/components/context-menu"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@aq-ui/registry/components/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@aq-ui/registry/components/dropdown-menu"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@aq-ui/registry/components/hover-card"
import { Input } from "@aq-ui/registry/components/input"
import { Label } from "@aq-ui/registry/components/label"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@aq-ui/registry/components/popover"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@aq-ui/registry/components/sheet"

function DrawerExample() {
  return (
    <Drawer showSwipeHandle>
      <DrawerTrigger render={<Button variant="outline" />}>
        Open drawer
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Install component</DrawerTitle>
          <DrawerDescription>
            Add the component and its exact dependencies to your project.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 py-6">
          <code className="rounded-md bg-muted px-2 py-1 text-sm">
            pnpm dlx aq-ui add drawer
          </code>
        </div>
        <DrawerFooter>
          <DrawerClose render={<Button />}>Done</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function SheetExample() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>
        Open settings
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Project settings</SheetTitle>
          <SheetDescription>
            Update defaults used by newly installed components.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-2 px-4">
          <Label htmlFor="advanced-sheet-namespace">Namespace</Label>
          <Input id="advanced-sheet-namespace" defaultValue="aq" />
        </div>
        <SheetFooter>
          <SheetClose render={<Button />}>Save changes</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function PopoverExample() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>
        Open popover
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription>
            Set the width of the preview surface.
          </PopoverDescription>
        </PopoverHeader>
        <div className="grid grid-cols-[4rem_1fr] items-center gap-2">
          <Label htmlFor="advanced-popover-width">Width</Label>
          <Input id="advanced-popover-width" defaultValue="640px" />
        </div>
      </PopoverContent>
    </Popover>
  )
}

function HoverCardExample() {
  return (
    <HoverCard>
      <HoverCardTrigger
        href="#"
        className="font-medium text-primary underline underline-offset-4"
      >
        @aq-ui
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Code2Icon className="size-5" />
          </div>
          <div>
            <p className="font-semibold">aq-ui</p>
            <p className="mt-1 text-muted-foreground">
              Open-code React components with a registry-first workflow.
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

function DropdownMenuExample() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        Actions <MoreHorizontalIcon data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Project</DropdownMenuLabel>
        <DropdownMenuItem>
          Edit details <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>Duplicate</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Trash2Icon /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ContextMenuExample() {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-40 w-full max-w-md items-center justify-center rounded-xl border border-dashed bg-muted/30 text-sm text-muted-foreground">
        Right-click inside this area
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>Canvas</ContextMenuLabel>
        <ContextMenuItem>
          Copy <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          Paste <ContextMenuShortcut>⌘V</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>Inspect component</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

const AdvancedOverlayExamples: Record<string, React.ComponentType> = {
  drawer: DrawerExample,
  sheet: SheetExample,
  popover: PopoverExample,
  "hover-card": HoverCardExample,
  "dropdown-menu": DropdownMenuExample,
  "context-menu": ContextMenuExample,
}

interface AdvancedOverlayRendererProps {
  name: string
}

function AdvancedOverlayRenderer({ name }: AdvancedOverlayRendererProps) {
  const Example = AdvancedOverlayExamples[name]

  if (!Example) {
    return <p role="alert">The preview for {name} is unavailable.</p>
  }

  return <Example />
}

export { AdvancedOverlayRenderer }
