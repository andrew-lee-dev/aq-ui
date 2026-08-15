import * as React from "react"

import { cn } from "@aq-ui/registry/lib/utils"

const Timeline = React.forwardRef<
  React.ComponentRef<"ol">,
  React.ComponentProps<"ol">
>(function Timeline({ className, ...props }, ref) {
  return (
    <ol
      ref={ref}
      data-slot="timeline"
      className={cn("relative flex flex-col", className)}
      {...props}
    />
  )
})
Timeline.displayName = "Timeline"

const TimelineItem = React.forwardRef<
  React.ComponentRef<"li">,
  React.ComponentProps<"li">
>(function TimelineItem({ className, ...props }, ref) {
  return (
    <li
      ref={ref}
      data-slot="timeline-item"
      className={cn(
        "group/timeline-item relative grid grid-cols-[auto_1fr] gap-x-3 pb-8 last:pb-0",
        className
      )}
      {...props}
    />
  )
})
TimelineItem.displayName = "TimelineItem"

const TimelineMarker = React.forwardRef<
  React.ComponentRef<"span">,
  React.ComponentProps<"span">
>(function TimelineMarker({ className, ...props }, ref) {
  return (
    <span
      ref={ref}
      data-slot="timeline-marker"
      className={cn(
        "relative z-10 mt-1 flex size-3 rounded-full border-2 border-background bg-primary ring-1 ring-border",
        className
      )}
      {...props}
    />
  )
})
TimelineMarker.displayName = "TimelineMarker"

const TimelineConnector = React.forwardRef<
  React.ComponentRef<"span">,
  React.ComponentProps<"span">
>(function TimelineConnector({ className, ...props }, ref) {
  return (
    <span
      ref={ref}
      aria-hidden
      data-slot="timeline-connector"
      className={cn(
        "absolute start-[5px] top-4 h-[calc(100%-0.5rem)] w-px bg-border group-last/timeline-item:hidden",
        className
      )}
      {...props}
    />
  )
})
TimelineConnector.displayName = "TimelineConnector"

const TimelineContent = React.forwardRef<
  React.ComponentRef<"div">,
  React.ComponentProps<"div">
>(function TimelineContent({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="timeline-content"
      className={cn("min-w-0", className)}
      {...props}
    />
  )
})
TimelineContent.displayName = "TimelineContent"

const TimelineTitle = React.forwardRef<
  React.ComponentRef<"h3">,
  React.ComponentProps<"h3">
>(function TimelineTitle({ className, ...props }, ref) {
  return (
    <h3
      ref={ref}
      data-slot="timeline-title"
      className={cn("leading-none font-medium", className)}
      {...props}
    />
  )
})
TimelineTitle.displayName = "TimelineTitle"

const TimelineDescription = React.forwardRef<
  React.ComponentRef<"p">,
  React.ComponentProps<"p">
>(function TimelineDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      data-slot="timeline-description"
      className={cn("mt-1 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
TimelineDescription.displayName = "TimelineDescription"

const TimelineTime = React.forwardRef<
  React.ComponentRef<"time">,
  React.ComponentProps<"time">
>(function TimelineTime({ className, ...props }, ref) {
  return (
    <time
      ref={ref}
      data-slot="timeline-time"
      className={cn("mt-2 block text-xs text-muted-foreground", className)}
      {...props}
    />
  )
})
TimelineTime.displayName = "TimelineTime"

export {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineItem,
  TimelineMarker,
  TimelineTime,
  TimelineTitle,
}
