import * as React from "react"
import { cn } from "@aq-ui/registry/lib/utils"

const Kbd = React.forwardRef<
  React.ComponentRef<"kbd">,
  React.ComponentProps<"kbd">
>(function Kbd({ className, ...props }, ref) {
  return (
    <kbd
      ref={ref}
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm bg-muted px-1 font-sans text-xs font-medium text-muted-foreground select-none in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background dark:in-data-[slot=tooltip-content]:bg-background/10 [&_svg:not([class*='size-'])]:size-3",
        className
      )}
      {...props}
    />
  )
})
Kbd.displayName = "Kbd"

const KbdGroup = React.forwardRef<
  React.ComponentRef<"kbd">,
  React.ComponentProps<"div">
>(function KbdGroup({ className, ...props }, ref) {
  return (
    <kbd
      ref={ref}
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  )
})
KbdGroup.displayName = "KbdGroup"

export { Kbd, KbdGroup }
