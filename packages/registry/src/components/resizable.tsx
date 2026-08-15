"use client"

import * as React from "react"

import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@aq-ui/registry/lib/utils"

const ResizablePanelGroup = React.forwardRef<
  HTMLDivElement,
  ResizablePrimitive.GroupProps
>(function ResizablePanelGroup({ className, ...props }, ref) {
  return (
    <ResizablePrimitive.Group
      elementRef={ref}
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full aria-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    />
  )
})
ResizablePanelGroup.displayName = "ResizablePanelGroup"

const ResizablePanel = React.forwardRef<
  HTMLDivElement,
  ResizablePrimitive.PanelProps
>(function ResizablePanel({ ...props }, ref) {
  return (
    <ResizablePrimitive.Panel
      elementRef={ref}
      data-slot="resizable-panel"
      {...props}
    />
  )
})
ResizablePanel.displayName = "ResizablePanel"

const ResizableHandle = React.forwardRef<
  HTMLDivElement,
  ResizablePrimitive.SeparatorProps & {
    withHandle?: boolean
  }
>(function ResizableHandle({ withHandle, className, ...props }, ref) {
  return (
    <ResizablePrimitive.Separator
      elementRef={ref}
      data-slot="resizable-handle"
      className={cn(
        "relative flex w-px items-center justify-center bg-border ring-offset-background after:absolute after:inset-y-0 after:start-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:start-0 aria-[orientation=horizontal]:after:h-1 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2 rtl:after:translate-x-1/2 rtl:aria-[orientation=horizontal]:after:-translate-x-0 [&[aria-orientation=horizontal]>div]:rotate-90",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-6 w-1 shrink-0 rounded-lg bg-border" />
      )}
    </ResizablePrimitive.Separator>
  )
})
ResizableHandle.displayName = "ResizableHandle"

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
