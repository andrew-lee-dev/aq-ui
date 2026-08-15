import * as React from "react"

import { cn } from "@aq-ui/registry/lib/utils"

const TypographyH1 = React.forwardRef<
  React.ComponentRef<"h1">,
  React.ComponentProps<"h1">
>(function TypographyH1({ className, ...props }, ref) {
  return (
    <h1
      ref={ref}
      data-slot="typography-h1"
      className={cn(
        "scroll-m-20 text-4xl font-extrabold tracking-tight text-balance lg:text-5xl",
        className
      )}
      {...props}
    />
  )
})
TypographyH1.displayName = "TypographyH1"

const TypographyH2 = React.forwardRef<
  React.ComponentRef<"h2">,
  React.ComponentProps<"h2">
>(function TypographyH2({ className, ...props }, ref) {
  return (
    <h2
      ref={ref}
      data-slot="typography-h2"
      className={cn(
        "mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
        className
      )}
      {...props}
    />
  )
})
TypographyH2.displayName = "TypographyH2"

const TypographyH3 = React.forwardRef<
  React.ComponentRef<"h3">,
  React.ComponentProps<"h3">
>(function TypographyH3({ className, ...props }, ref) {
  return (
    <h3
      ref={ref}
      data-slot="typography-h3"
      className={cn(
        "mt-8 scroll-m-20 text-2xl font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  )
})
TypographyH3.displayName = "TypographyH3"

const TypographyH4 = React.forwardRef<
  React.ComponentRef<"h4">,
  React.ComponentProps<"h4">
>(function TypographyH4({ className, ...props }, ref) {
  return (
    <h4
      ref={ref}
      data-slot="typography-h4"
      className={cn(
        "mt-6 scroll-m-20 text-xl font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  )
})
TypographyH4.displayName = "TypographyH4"

const TypographyP = React.forwardRef<
  React.ComponentRef<"p">,
  React.ComponentProps<"p">
>(function TypographyP({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      data-slot="typography-p"
      className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}
      {...props}
    />
  )
})
TypographyP.displayName = "TypographyP"

const TypographyLead = React.forwardRef<
  React.ComponentRef<"p">,
  React.ComponentProps<"p">
>(function TypographyLead({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      data-slot="typography-lead"
      className={cn("text-xl text-muted-foreground", className)}
      {...props}
    />
  )
})
TypographyLead.displayName = "TypographyLead"

const TypographyLarge = React.forwardRef<
  React.ComponentRef<"div">,
  React.ComponentProps<"div">
>(function TypographyLarge({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="typography-large"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  )
})
TypographyLarge.displayName = "TypographyLarge"

const TypographySmall = React.forwardRef<
  React.ComponentRef<"small">,
  React.ComponentProps<"small">
>(function TypographySmall({ className, ...props }, ref) {
  return (
    <small
      ref={ref}
      data-slot="typography-small"
      className={cn("text-sm leading-none font-medium", className)}
      {...props}
    />
  )
})
TypographySmall.displayName = "TypographySmall"

const TypographyMuted = React.forwardRef<
  React.ComponentRef<"p">,
  React.ComponentProps<"p">
>(function TypographyMuted({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      data-slot="typography-muted"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
TypographyMuted.displayName = "TypographyMuted"

const TypographyBlockquote = React.forwardRef<
  React.ComponentRef<"blockquote">,
  React.ComponentProps<"blockquote">
>(function TypographyBlockquote({ className, ...props }, ref) {
  return (
    <blockquote
      ref={ref}
      data-slot="typography-blockquote"
      className={cn("mt-6 border-s-2 ps-6 italic", className)}
      {...props}
    />
  )
})
TypographyBlockquote.displayName = "TypographyBlockquote"

const TypographyInlineCode = React.forwardRef<
  React.ComponentRef<"code">,
  React.ComponentProps<"code">
>(function TypographyInlineCode({ className, ...props }, ref) {
  return (
    <code
      ref={ref}
      data-slot="typography-inline-code"
      className={cn(
        "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
        className
      )}
      {...props}
    />
  )
})
TypographyInlineCode.displayName = "TypographyInlineCode"

const TypographyList = React.forwardRef<
  React.ComponentRef<"ul">,
  React.ComponentProps<"ul">
>(function TypographyList({ className, ...props }, ref) {
  return (
    <ul
      ref={ref}
      data-slot="typography-list"
      className={cn("my-6 ms-6 list-disc [&>li]:mt-2", className)}
      {...props}
    />
  )
})
TypographyList.displayName = "TypographyList"

export {
  TypographyBlockquote,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyInlineCode,
  TypographyLarge,
  TypographyLead,
  TypographyList,
  TypographyMuted,
  TypographyP,
  TypographySmall,
}
