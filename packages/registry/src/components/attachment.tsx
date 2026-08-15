import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@aq-ui/registry/lib/utils"
import { Button } from "@aq-ui/registry/components/button"

const attachmentVariants = cva(
  "group/attachment relative flex w-fit max-w-full min-w-0 shrink-0 flex-wrap rounded-xl border bg-card text-card-foreground transition-colors focus-within:ring-1 focus-within:ring-ring/50 has-[>a,>button]:hover:bg-muted/50 data-[state=error]:border-destructive/30 data-[state=idle]:border-dashed",
  {
    variants: {
      size: {
        default:
          "gap-2 text-sm has-data-[slot=attachment-content]:px-2.5 has-data-[slot=attachment-content]:py-2 has-data-[slot=attachment-media]:p-2",
        sm: "gap-2.5 text-xs has-data-[slot=attachment-content]:px-2 has-data-[slot=attachment-content]:py-1.5 has-data-[slot=attachment-media]:p-1.5",
        xs: "gap-1.5 rounded-lg text-xs has-data-[slot=attachment-content]:px-1.5 has-data-[slot=attachment-content]:py-1 has-data-[slot=attachment-media]:p-1",
      },
      orientation: {
        horizontal: "min-w-40 items-center",
        vertical: "w-24 flex-col has-data-[slot=attachment-content]:w-30",
      },
    },
  }
)

const Attachment = React.forwardRef<
  React.ComponentRef<"div">,
  React.ComponentProps<"div"> &
    VariantProps<typeof attachmentVariants> & {
      state?: "idle" | "uploading" | "processing" | "error" | "done"
    }
>(function Attachment(
  {
    className,
    state = "done",
    size = "default",
    orientation = "horizontal",
    ...props
  },
  ref
) {
  return (
    <div
      ref={ref}
      data-slot="attachment"
      data-state={state}
      data-size={size}
      data-orientation={orientation}
      className={cn(attachmentVariants({ size, orientation }), className)}
      {...props}
    />
  )
})
Attachment.displayName = "Attachment"

const attachmentMediaVariants = cva(
  "relative flex aspect-square w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-foreground group-data-[orientation=vertical]/attachment:w-full group-data-[size=sm]/attachment:w-8 group-data-[size=xs]/attachment:w-7 group-data-[size=xs]/attachment:rounded-md group-data-[state=error]/attachment:bg-destructive/10 group-data-[state=error]/attachment:text-destructive group-data-[orientation=vertical]/attachment:*:data-[slot=spinner]:size-6! [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 group-data-[orientation=vertical]/attachment:[&_svg:not([class*='size-'])]:size-6 group-data-[size=xs]/attachment:[&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        icon: "",
        image:
          "opacity-60 group-data-[state=done]/attachment:opacity-100 group-data-[state=idle]/attachment:opacity-100 *:[img]:aspect-square *:[img]:w-full *:[img]:object-cover",
      },
    },
    defaultVariants: {
      variant: "icon",
    },
  }
)

const AttachmentMedia = React.forwardRef<
  React.ComponentRef<"div">,
  React.ComponentProps<"div"> & VariantProps<typeof attachmentMediaVariants>
>(function AttachmentMedia({ className, variant = "icon", ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="attachment-media"
      data-variant={variant}
      className={cn(attachmentMediaVariants({ variant }), className)}
      {...props}
    />
  )
})
AttachmentMedia.displayName = "AttachmentMedia"

const AttachmentContent = React.forwardRef<
  React.ComponentRef<"div">,
  React.ComponentProps<"div">
>(function AttachmentContent({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="attachment-content"
      className={cn(
        "max-w-full min-w-0 flex-1 leading-tight group-data-[orientation=vertical]/attachment:px-1",
        className
      )}
      {...props}
    />
  )
})
AttachmentContent.displayName = "AttachmentContent"

const AttachmentTitle = React.forwardRef<
  React.ComponentRef<"span">,
  React.ComponentProps<"span">
>(function AttachmentTitle({ className, ...props }, ref) {
  return (
    <span
      ref={ref}
      data-slot="attachment-title"
      className={cn(
        "block max-w-full min-w-0 truncate font-medium group-data-[state=processing]/attachment:shimmer group-data-[state=uploading]/attachment:shimmer",
        className
      )}
      {...props}
    />
  )
})
AttachmentTitle.displayName = "AttachmentTitle"

const AttachmentDescription = React.forwardRef<
  React.ComponentRef<"span">,
  React.ComponentProps<"span">
>(function AttachmentDescription({ className, ...props }, ref) {
  return (
    <span
      ref={ref}
      data-slot="attachment-description"
      className={cn(
        "mt-0.5 block min-w-0 truncate text-xs text-muted-foreground group-data-[state=error]/attachment:text-destructive/80",
        "max-w-full",
        className
      )}
      {...props}
    />
  )
})
AttachmentDescription.displayName = "AttachmentDescription"

const AttachmentActions = React.forwardRef<
  React.ComponentRef<"div">,
  React.ComponentProps<"div">
>(function AttachmentActions({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="attachment-actions"
      className={cn(
        "relative z-20 flex shrink-0 items-center group-data-[orientation=vertical]/attachment:absolute group-data-[orientation=vertical]/attachment:end-3 group-data-[orientation=vertical]/attachment:top-3 group-data-[orientation=vertical]/attachment:gap-1",
        className
      )}
      {...props}
    />
  )
})
AttachmentActions.displayName = "AttachmentActions"

const AttachmentAction = React.forwardRef<
  React.ComponentRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(function AttachmentAction(
  { className, variant, size = "icon-xs", ...props },
  ref
) {
  return (
    <Button
      ref={ref}
      data-slot="attachment-action"
      variant={variant ?? "ghost"}
      size={size}
      className={cn(className)}
      {...props}
    />
  )
})
AttachmentAction.displayName = "AttachmentAction"

const AttachmentTrigger = React.forwardRef<
  React.ComponentRef<"button">,
  useRender.ComponentProps<"button">
>(function AttachmentTrigger({ className, render, type, ...props }, ref) {
  return useRender({
    ref,
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        type: render ? type : (type ?? "button"),
        className: cn("absolute inset-0 z-10 outline-none", className),
      },
      props
    ),
    render,
    state: {
      slot: "attachment-trigger",
    },
  })
})
AttachmentTrigger.displayName = "AttachmentTrigger"

const AttachmentGroup = React.forwardRef<
  React.ComponentRef<"div">,
  React.ComponentProps<"div">
>(function AttachmentGroup({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="attachment-group"
      className={cn(
        "flex min-w-0 scroll-fade-x snap-x snap-mandatory scroll-px-1 scrollbar-none gap-3 overflow-x-auto overscroll-x-contain py-1 *:data-[slot=attachment]:flex-none *:data-[slot=attachment]:snap-start",
        className
      )}
      {...props}
    />
  )
})
AttachmentGroup.displayName = "AttachmentGroup"

export {
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
  AttachmentTrigger,
}
