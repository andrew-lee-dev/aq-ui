import * as React from "react"
import { cn } from "@aq-ui/registry/lib/utils"
import { Loader2Icon } from "lucide-react"

const Spinner = React.forwardRef<
  React.ComponentRef<typeof Loader2Icon>,
  React.ComponentProps<"svg">
>(function Spinner({ className, ...props }, ref) {
  return (
    <Loader2Icon
      ref={ref}
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
})
Spinner.displayName = "Spinner"

export { Spinner }
