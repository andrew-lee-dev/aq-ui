import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@aq-ui/registry/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-[color-mix(in_oklch,var(--destructive),black_8%)] focus-visible:border-destructive focus-visible:ring-destructive/70 dark:hover:bg-[color-mix(in_oklch,var(--destructive),white_8%)]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = Omit<ButtonPrimitive.Props, "className"> &
  VariantProps<typeof buttonVariants> & {
    /** Class names or a Base UI state callback composed after aq-ui variants. */
    className?: ButtonPrimitive.Props["className"]
    /** Whether the button is busy. Busy buttons are disabled automatically. */
    loading?: boolean
    /** Optional indicator rendered while the button is busy. Pass `null` to hide it. */
    loadingIndicator?: React.ReactNode
    /** Replaces the visible button content while loading without adding a live region. */
    loadingText?: React.ReactNode
    /** Places the loading indicator at the logical start or end of the content. */
    loadingPosition?: "start" | "end"
  }

const defaultLoadingIndicator = (
  <span
    data-slot="button-loading-spinner"
    className="size-4 animate-spin rounded-full border-2 border-current border-e-transparent motion-reduce:animate-none"
  />
)

const Button = React.forwardRef<
  React.ComponentRef<typeof ButtonPrimitive>,
  ButtonProps
>(function Button(
  {
    className,
    variant: variantProp,
    size: sizeProp,
    disabled,
    loading = false,
    loadingIndicator,
    loadingText,
    loadingPosition = "start",
    children,
    "aria-busy": ariaBusy,
    ...props
  },
  ref
) {
  const variant = variantProp ?? "default"
  const size = sizeProp ?? "default"
  const isDisabled = Boolean(disabled || loading)
  const variantClassName = buttonVariants({ variant, size })
  const resolvedClassName =
    typeof className === "function"
      ? (state: ButtonPrimitive.State) => cn(variantClassName, className(state))
      : cn(variantClassName, className)
  const indicator =
    loadingIndicator === undefined ? defaultLoadingIndicator : loadingIndicator
  const indicatorElement =
    loading && indicator !== null && typeof indicator !== "boolean" ? (
      <span
        data-slot="button-loading-indicator"
        data-icon={loadingPosition === "start" ? "inline-start" : "inline-end"}
        className="inline-flex shrink-0 items-center justify-center"
        aria-hidden="true"
      >
        {indicator}
      </span>
    ) : null
  const content = loading
    ? loadingText === undefined
      ? children
      : loadingText
    : children

  return (
    <ButtonPrimitive
      {...props}
      ref={ref}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={loading ? "" : undefined}
      disabled={isDisabled}
      aria-busy={loading ? true : ariaBusy}
      className={resolvedClassName}
    >
      {loadingPosition === "start" ? indicatorElement : null}
      {content}
      {loadingPosition === "end" ? indicatorElement : null}
    </ButtonPrimitive>
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
export type { ButtonProps }
