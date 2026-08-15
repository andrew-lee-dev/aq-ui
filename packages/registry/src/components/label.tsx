"use client"

import * as React from "react"

import { cn } from "@aq-ui/registry/lib/utils"

const Label = React.forwardRef<
  React.ComponentRef<"label">,
  React.ComponentProps<"label">
>(function Label({ className, ...props }, ref) {
  return (
    <label
      ref={ref}
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
})
Label.displayName = "Label"

export { Label }
