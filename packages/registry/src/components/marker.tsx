import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@aq-ui/registry/lib/utils"

const markerVariants = cva(
  "group/marker relative flex min-h-4 w-full items-center gap-2 text-start text-sm text-muted-foreground [&_svg:not([class*='size-'])]:size-4 [a]:underline [a]:underline-offset-3 [a]:hover:text-foreground",
  {
    variants: {
      variant: {
        default: "",
        separator:
          "before:me-1 before:h-px before:min-w-0 before:flex-1 before:bg-border after:ms-1 after:h-px after:min-w-0 after:flex-1 after:bg-border",
        border: "border-b border-border pb-2",
      },
    },
  }
)

const Marker = React.forwardRef<
  React.ComponentRef<"div">,
  useRender.ComponentProps<"div"> & VariantProps<typeof markerVariants>
>(function Marker({ className, variant = "default", render, ...props }, ref) {
  return useRender({
    ref,
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn(markerVariants({ variant, className })),
      },
      props
    ),
    render,
    state: {
      slot: "marker",
      variant,
    },
  })
})
Marker.displayName = "Marker"

const MarkerIcon = React.forwardRef<
  React.ComponentRef<"span">,
  React.ComponentProps<"span">
>(function MarkerIcon({ className, ...props }, ref) {
  return (
    <span
      ref={ref}
      data-slot="marker-icon"
      aria-hidden="true"
      className={cn(
        "size-4 shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
})
MarkerIcon.displayName = "MarkerIcon"

const MarkerContent = React.forwardRef<
  React.ComponentRef<"span">,
  React.ComponentProps<"span">
>(function MarkerContent({ className, ...props }, ref) {
  return (
    <span
      ref={ref}
      data-slot="marker-content"
      className={cn(
        "min-w-0 wrap-break-word group-data-[variant=separator]/marker:flex-none group-data-[variant=separator]/marker:text-center *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
})
MarkerContent.displayName = "MarkerContent"

export { Marker, MarkerIcon, MarkerContent, markerVariants }
