"use client"

import * as React from "react"

import { Progress as ProgressPrimitive } from "@base-ui/react/progress"

import { cn } from "@aq-ui/registry/lib/utils"

const Progress = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  ProgressPrimitive.Root.Props
>(function Progress({ className, children, value, ...props }, ref) {
  return (
    <ProgressPrimitive.Root
      ref={ref}
      value={value}
      data-slot="progress"
      className={cn("flex flex-wrap gap-3", className)}
      {...props}
    >
      {children}
      <ProgressTrack>
        <ProgressIndicator />
      </ProgressTrack>
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = "Progress"

const ProgressTrack = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Track>,
  ProgressPrimitive.Track.Props
>(function ProgressTrack({ className, ...props }, ref) {
  return (
    <ProgressPrimitive.Track
      ref={ref}
      className={cn(
        "relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted",
        className
      )}
      data-slot="progress-track"
      {...props}
    />
  )
})
ProgressTrack.displayName = "ProgressTrack"

const ProgressIndicator = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Indicator>,
  ProgressPrimitive.Indicator.Props
>(function ProgressIndicator({ className, ...props }, ref) {
  return (
    <ProgressPrimitive.Indicator
      ref={ref}
      data-slot="progress-indicator"
      className={cn("h-full bg-primary transition-all", className)}
      {...props}
    />
  )
})
ProgressIndicator.displayName = "ProgressIndicator"

const ProgressLabel = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Label>,
  ProgressPrimitive.Label.Props
>(function ProgressLabel({ className, ...props }, ref) {
  return (
    <ProgressPrimitive.Label
      ref={ref}
      className={cn("text-sm font-medium", className)}
      data-slot="progress-label"
      {...props}
    />
  )
})
ProgressLabel.displayName = "ProgressLabel"

const ProgressValue = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Value>,
  ProgressPrimitive.Value.Props
>(function ProgressValue({ className, ...props }, ref) {
  return (
    <ProgressPrimitive.Value
      ref={ref}
      className={cn(
        "ms-auto text-sm text-muted-foreground tabular-nums",
        className
      )}
      data-slot="progress-value"
      {...props}
    />
  )
})
ProgressValue.displayName = "ProgressValue"

export {
  Progress,
  ProgressTrack,
  ProgressIndicator,
  ProgressLabel,
  ProgressValue,
}
