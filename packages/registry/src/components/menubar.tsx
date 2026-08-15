"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { Menubar as MenubarPrimitive } from "@base-ui/react/menubar"

import { cn } from "@aq-ui/registry/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@aq-ui/registry/components/dropdown-menu"
import { CheckIcon } from "lucide-react"

const Menubar = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive>,
  MenubarPrimitive.Props
>(function Menubar({ className, ...props }, ref) {
  return (
    <MenubarPrimitive
      ref={ref}
      data-slot="menubar"
      className={cn(
        "flex h-8 items-center gap-0.5 rounded-lg border p-[3px]",
        className
      )}
      {...props}
    />
  )
})
Menubar.displayName = "Menubar"

function MenubarMenu({ ...props }: React.ComponentProps<typeof DropdownMenu>) {
  return <DropdownMenu data-slot="menubar-menu" {...props} />
}

const MenubarGroup = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuGroup>,
  React.ComponentProps<typeof DropdownMenuGroup>
>(function MenubarGroup({ ...props }, ref) {
  return <DropdownMenuGroup ref={ref} data-slot="menubar-group" {...props} />
})
MenubarGroup.displayName = "MenubarGroup"

function MenubarPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPortal>) {
  return <DropdownMenuPortal data-slot="menubar-portal" {...props} />
}

const MenubarTrigger = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuTrigger>,
  React.ComponentProps<typeof DropdownMenuTrigger>
>(function MenubarTrigger({ className, ...props }, ref) {
  return (
    <DropdownMenuTrigger
      ref={ref}
      data-slot="menubar-trigger"
      className={cn(
        "flex items-center rounded-sm px-1.5 py-[2px] text-sm font-medium outline-hidden select-none hover:bg-muted aria-expanded:bg-muted",
        className
      )}
      {...props}
    />
  )
})
MenubarTrigger.displayName = "MenubarTrigger"

const MenubarContent = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuContent>,
  React.ComponentProps<typeof DropdownMenuContent>
>(function MenubarContent(
  { className, align = "start", alignOffset = -4, sideOffset = 8, ...props },
  ref
) {
  return (
    <DropdownMenuContent
      ref={ref}
      data-slot="menubar-content"
      align={align}
      alignOffset={alignOffset}
      sideOffset={sideOffset}
      className={cn(
        "min-w-36 rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-start-2 data-[side=inline-start]:slide-in-from-end-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
        className
      )}
      {...props}
    />
  )
})
MenubarContent.displayName = "MenubarContent"

const MenubarItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuItem>,
  React.ComponentProps<typeof DropdownMenuItem>
>(function MenubarItem(
  { className, inset, variant = "default", ...props },
  ref
) {
  return (
    <DropdownMenuItem
      ref={ref}
      data-slot="menubar-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "group/menubar-item gap-1.5 rounded-md px-1.5 py-1 text-sm focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:ps-7 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 data-[variant=destructive]:*:[svg]:text-destructive!",
        className
      )}
      {...props}
    />
  )
})
MenubarItem.displayName = "MenubarItem"

const MenubarCheckboxItem = React.forwardRef<
  React.ComponentRef<typeof MenuPrimitive.CheckboxItem>,
  MenuPrimitive.CheckboxItem.Props & {
    inset?: boolean
  }
>(function MenubarCheckboxItem(
  { className, children, checked, inset, ...props },
  ref
) {
  return (
    <MenuPrimitive.CheckboxItem
      ref={ref}
      data-slot="menubar-checkbox-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-default items-center gap-1.5 rounded-md py-1 ps-7 pe-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:ps-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute start-1.5 flex size-4 items-center justify-center [&_svg:not([class*='size-'])]:size-4">
        <MenuPrimitive.CheckboxItemIndicator>
          <CheckIcon />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  )
})
MenubarCheckboxItem.displayName = "MenubarCheckboxItem"

const MenubarRadioGroup = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuRadioGroup>,
  React.ComponentProps<typeof DropdownMenuRadioGroup>
>(function MenubarRadioGroup({ ...props }, ref) {
  return (
    <DropdownMenuRadioGroup
      ref={ref}
      data-slot="menubar-radio-group"
      {...props}
    />
  )
})
MenubarRadioGroup.displayName = "MenubarRadioGroup"

const MenubarRadioItem = React.forwardRef<
  React.ComponentRef<typeof MenuPrimitive.RadioItem>,
  MenuPrimitive.RadioItem.Props & {
    inset?: boolean
  }
>(function MenubarRadioItem({ className, children, inset, ...props }, ref) {
  return (
    <MenuPrimitive.RadioItem
      ref={ref}
      data-slot="menubar-radio-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-default items-center gap-1.5 rounded-md py-1 ps-7 pe-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:ps-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute start-1.5 flex size-4 items-center justify-center [&_svg:not([class*='size-'])]:size-4">
        <MenuPrimitive.RadioItemIndicator>
          <CheckIcon />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  )
})
MenubarRadioItem.displayName = "MenubarRadioItem"

const MenubarLabel = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuLabel>,
  React.ComponentProps<typeof DropdownMenuLabel> & {
    inset?: boolean
  }
>(function MenubarLabel({ className, inset, ...props }, ref) {
  return (
    <DropdownMenuLabel
      ref={ref}
      data-slot="menubar-label"
      data-inset={inset}
      className={cn(
        "px-1.5 py-1 text-sm font-medium data-inset:ps-7",
        className
      )}
      {...props}
    />
  )
})
MenubarLabel.displayName = "MenubarLabel"

const MenubarSeparator = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuSeparator>,
  React.ComponentProps<typeof DropdownMenuSeparator>
>(function MenubarSeparator({ className, ...props }, ref) {
  return (
    <DropdownMenuSeparator
      ref={ref}
      data-slot="menubar-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
})
MenubarSeparator.displayName = "MenubarSeparator"

const MenubarShortcut = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuShortcut>,
  React.ComponentProps<typeof DropdownMenuShortcut>
>(function MenubarShortcut({ className, ...props }, ref) {
  return (
    <DropdownMenuShortcut
      ref={ref}
      data-slot="menubar-shortcut"
      className={cn(
        "ms-auto text-xs tracking-widest text-muted-foreground group-focus/menubar-item:text-accent-foreground",
        className
      )}
      {...props}
    />
  )
})
MenubarShortcut.displayName = "MenubarShortcut"

function MenubarSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuSub>) {
  return <DropdownMenuSub data-slot="menubar-sub" {...props} />
}

const MenubarSubTrigger = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuSubTrigger>,
  React.ComponentProps<typeof DropdownMenuSubTrigger> & {
    inset?: boolean
  }
>(function MenubarSubTrigger({ className, inset, ...props }, ref) {
  return (
    <DropdownMenuSubTrigger
      ref={ref}
      data-slot="menubar-sub-trigger"
      data-inset={inset}
      className={cn(
        "gap-1.5 rounded-md px-1.5 py-1 text-sm focus:bg-accent focus:text-accent-foreground data-inset:ps-7 data-open:bg-accent data-open:text-accent-foreground [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
})
MenubarSubTrigger.displayName = "MenubarSubTrigger"

const MenubarSubContent = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuSubContent>,
  React.ComponentProps<typeof DropdownMenuSubContent>
>(function MenubarSubContent({ className, ...props }, ref) {
  return (
    <DropdownMenuSubContent
      ref={ref}
      data-slot="menubar-sub-content"
      className={cn(
        "min-w-32 rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
        className
      )}
      {...props}
    />
  )
})
MenubarSubContent.displayName = "MenubarSubContent"

export {
  Menubar,
  MenubarPortal,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarGroup,
  MenubarSeparator,
  MenubarLabel,
  MenubarItem,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
}
