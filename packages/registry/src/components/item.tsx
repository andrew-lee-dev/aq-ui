import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@aq-ui/registry/lib/utils"
import { Separator } from "@aq-ui/registry/components/separator"

const ItemGroup = React.forwardRef<
  React.ComponentRef<"div">,
  React.ComponentProps<"div">
>(function ItemGroup({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      role="list"
      data-slot="item-group"
      className={cn(
        "group/item-group flex w-full flex-col gap-4 has-data-[size=sm]:gap-2.5 has-data-[size=xs]:gap-2",
        className
      )}
      {...props}
    />
  )
})
ItemGroup.displayName = "ItemGroup"

const ItemSeparator = React.forwardRef<
  React.ComponentRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(function ItemSeparator({ className, ...props }, ref) {
  return (
    <Separator
      ref={ref}
      data-slot="item-separator"
      orientation="horizontal"
      className={cn("my-2", className)}
      {...props}
    />
  )
})
ItemSeparator.displayName = "ItemSeparator"

const itemVariants = cva(
  "group/item flex w-full flex-wrap items-center rounded-lg border text-sm transition-colors duration-100 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [a]:transition-colors [a]:hover:bg-muted",
  {
    variants: {
      variant: {
        default: "border-transparent",
        outline: "border-border",
        muted: "border-transparent bg-muted/50",
      },
      size: {
        default: "gap-2.5 px-3 py-2.5",
        sm: "gap-2.5 px-3 py-2.5",
        xs: "gap-2 px-2.5 py-2 in-data-[slot=dropdown-menu-content]:p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Item = React.forwardRef<
  React.ComponentRef<"div">,
  useRender.ComponentProps<"div"> & VariantProps<typeof itemVariants>
>(function Item(
  { className, variant = "default", size = "default", render, ...props },
  ref
) {
  return useRender({
    ref,
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn(itemVariants({ variant, size, className })),
      },
      props
    ),
    render,
    state: {
      slot: "item",
      variant,
      size,
    },
  })
})
Item.displayName = "Item"

const itemMediaVariants = cva(
  "flex shrink-0 items-center justify-center gap-2 group-has-data-[slot=item-description]/item:translate-y-0.5 group-has-data-[slot=item-description]/item:self-start [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "[&_svg:not([class*='size-'])]:size-4",
        image:
          "size-10 overflow-hidden rounded-sm group-data-[size=sm]/item:size-8 group-data-[size=xs]/item:size-6 [&_img]:size-full [&_img]:object-cover",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const ItemMedia = React.forwardRef<
  React.ComponentRef<"div">,
  React.ComponentProps<"div"> & VariantProps<typeof itemMediaVariants>
>(function ItemMedia({ className, variant = "default", ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="item-media"
      data-variant={variant}
      className={cn(itemMediaVariants({ variant, className }))}
      {...props}
    />
  )
})
ItemMedia.displayName = "ItemMedia"

const ItemContent = React.forwardRef<
  React.ComponentRef<"div">,
  React.ComponentProps<"div">
>(function ItemContent({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="item-content"
      className={cn(
        "flex flex-1 flex-col gap-1 group-data-[size=xs]/item:gap-0 [&+[data-slot=item-content]]:flex-none",
        className
      )}
      {...props}
    />
  )
})
ItemContent.displayName = "ItemContent"

const ItemTitle = React.forwardRef<
  React.ComponentRef<"div">,
  React.ComponentProps<"div">
>(function ItemTitle({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="item-title"
      className={cn(
        "line-clamp-1 flex w-fit items-center gap-2 text-sm leading-snug font-medium underline-offset-4",
        className
      )}
      {...props}
    />
  )
})
ItemTitle.displayName = "ItemTitle"

const ItemDescription = React.forwardRef<
  React.ComponentRef<"p">,
  React.ComponentProps<"p">
>(function ItemDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      data-slot="item-description"
      className={cn(
        "line-clamp-2 text-start text-sm leading-normal font-normal text-muted-foreground group-data-[size=xs]/item:text-xs [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className
      )}
      {...props}
    />
  )
})
ItemDescription.displayName = "ItemDescription"

const ItemActions = React.forwardRef<
  React.ComponentRef<"div">,
  React.ComponentProps<"div">
>(function ItemActions({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="item-actions"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  )
})
ItemActions.displayName = "ItemActions"

const ItemHeader = React.forwardRef<
  React.ComponentRef<"div">,
  React.ComponentProps<"div">
>(function ItemHeader({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="item-header"
      className={cn(
        "flex basis-full items-center justify-between gap-2",
        className
      )}
      {...props}
    />
  )
})
ItemHeader.displayName = "ItemHeader"

const ItemFooter = React.forwardRef<
  React.ComponentRef<"div">,
  React.ComponentProps<"div">
>(function ItemFooter({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="item-footer"
      className={cn(
        "flex basis-full items-center justify-between gap-2",
        className
      )}
      {...props}
    />
  )
})
ItemFooter.displayName = "ItemFooter"

export {
  Item,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
}
