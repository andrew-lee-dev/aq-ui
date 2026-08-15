import * as React from "react"

import { cn } from "@aq-ui/registry/lib/utils"
import {
  buttonVariants,
  type ButtonProps,
} from "@aq-ui/registry/components/button"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react"

const Pagination = React.forwardRef<
  React.ComponentRef<"nav">,
  React.ComponentProps<"nav">
>(function Pagination({ className, ...props }, ref) {
  return (
    <nav
      ref={ref}
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
      data-slot="pagination"
    />
  )
})
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  React.ComponentRef<"ul">,
  React.ComponentProps<"ul">
>(function PaginationContent({ className, ...props }, ref) {
  return (
    <ul
      ref={ref}
      className={cn("flex items-center gap-0.5", className)}
      {...props}
      data-slot="pagination-content"
    />
  )
})
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  React.ComponentRef<"li">,
  React.ComponentProps<"li">
>(function PaginationItem({ ...props }, ref) {
  return <li ref={ref} {...props} data-slot="pagination-item" />
})
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  disabled?: boolean
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

const PaginationLink = React.forwardRef<
  React.ComponentRef<"a">,
  PaginationLinkProps
>(function PaginationLink(
  {
    "aria-disabled": ariaDisabled,
    className,
    disabled = false,
    isActive,
    onClick,
    onKeyDown,
    size: sizeProp,
    tabIndex,
    ...props
  },
  ref
) {
  const variant = isActive ? "outline" : "ghost"
  const size = sizeProp ?? "icon"
  const isDisabled =
    disabled || ariaDisabled === true || ariaDisabled === "true"

  return (
    <a
      {...props}
      ref={ref}
      aria-current={isActive ? "page" : props["aria-current"]}
      aria-disabled={isDisabled ? true : ariaDisabled}
      data-slot="pagination-link"
      data-active={isActive || undefined}
      data-disabled={isDisabled || undefined}
      data-variant={variant}
      data-size={size}
      tabIndex={isDisabled ? -1 : tabIndex}
      className={cn(buttonVariants({ variant, size }), className)}
      onClick={(event) => {
        if (isDisabled) {
          event.preventDefault()
          event.stopPropagation()
          return
        }
        onClick?.(event)
      }}
      onKeyDown={(event) => {
        if (isDisabled && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault()
          event.stopPropagation()
          return
        }
        onKeyDown?.(event)
      }}
    />
  )
})
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = React.forwardRef<
  React.ComponentRef<typeof PaginationLink>,
  React.ComponentProps<typeof PaginationLink> & { text?: string }
>(function PaginationPrevious({ className, text = "Previous", ...props }, ref) {
  return (
    <PaginationLink
      ref={ref}
      aria-label="Go to previous page"
      size="default"
      className={cn("ps-1.5!", className)}
      {...props}
    >
      <ChevronLeftIcon data-icon="inline-start" className="rtl:rotate-180" />
      <span className="hidden sm:block">{text}</span>
    </PaginationLink>
  )
})
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = React.forwardRef<
  React.ComponentRef<typeof PaginationLink>,
  React.ComponentProps<typeof PaginationLink> & { text?: string }
>(function PaginationNext({ className, text = "Next", ...props }, ref) {
  return (
    <PaginationLink
      ref={ref}
      aria-label="Go to next page"
      size="default"
      className={cn("pe-1.5!", className)}
      {...props}
    >
      <span className="hidden sm:block">{text}</span>
      <ChevronRightIcon data-icon="inline-end" className="rtl:rotate-180" />
    </PaginationLink>
  )
})
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = React.forwardRef<
  React.ComponentRef<"span">,
  React.ComponentProps<"span">
>(function PaginationEllipsis({ className, ...props }, ref) {
  return (
    <span
      ref={ref}
      aria-hidden
      className={cn(
        "flex size-8 items-center justify-center [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
      data-slot="pagination-ellipsis"
    >
      <MoreHorizontalIcon />
      <span className="sr-only">More pages</span>
    </span>
  )
})
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
export type { PaginationLinkProps }
