import * as React from "react"
import { cn } from "@aq-ui/registry/lib/utils"

const AspectRatio = React.forwardRef<
  React.ComponentRef<"div">,
  React.ComponentProps<"div"> & { ratio: number }
>(function AspectRatio({ ratio, className, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="aspect-ratio"
      style={
        {
          "--ratio": ratio,
        } as React.CSSProperties
      }
      className={cn("relative aspect-(--ratio)", className)}
      {...props}
    />
  )
})
AspectRatio.displayName = "AspectRatio"

export { AspectRatio }
