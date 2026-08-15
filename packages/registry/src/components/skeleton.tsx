import * as React from "react"
import { cn } from "@aq-ui/registry/lib/utils"

const Skeleton = React.forwardRef<
  React.ComponentRef<"div">,
  React.ComponentProps<"div">
>(function Skeleton({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
})
Skeleton.displayName = "Skeleton"

export { Skeleton }
