"use client"

import * as React from "react"
import { useRender } from "@base-ui/react/use-render"
import { ArrowDownIcon } from "lucide-react"

import { Button } from "@aq-ui/registry/components/button"
import { useMergedRefs } from "@aq-ui/registry/hooks/use-merged-refs"
import {
  MessageScrollerProvider,
  type MessageScrollerProviderProps,
  type MessageScrollerButtonDirection,
  useMessageScroller,
  useMessageScrollerInternal,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
} from "@aq-ui/registry/hooks/use-message-scroller"
import { cn } from "@aq-ui/registry/lib/utils"

export type { MessageScrollerProviderProps }

export type MessageScrollerProps = React.ComponentPropsWithoutRef<"div">

export interface MessageScrollerViewportProps extends React.ComponentPropsWithoutRef<"div"> {
  preserveScrollOnPrepend?: boolean
}

export interface MessageScrollerContentProps extends React.ComponentPropsWithoutRef<"div"> {
  spacerClassName?: string
}

export interface MessageScrollerItemProps extends React.ComponentPropsWithoutRef<"div"> {
  messageId?: string
  scrollAnchor?: boolean
}

interface MessageScrollerButtonState extends Record<string, unknown> {
  active: boolean
  direction: MessageScrollerButtonDirection
}

export type MessageScrollerButtonProps = useRender.ComponentProps<
  "button",
  MessageScrollerButtonState
> & {
  behavior?: ScrollBehavior
  direction?: MessageScrollerButtonDirection
  variant?: React.ComponentProps<typeof Button>["variant"]
  size?: React.ComponentProps<typeof Button>["size"]
}

const USER_SCROLL_KEYS = new Set([
  "ArrowDown",
  "ArrowUp",
  "End",
  "Home",
  "PageDown",
  "PageUp",
  " ",
])

const MessageScroller = React.forwardRef<HTMLDivElement, MessageScrollerProps>(
  ({ className, ...props }, forwardedRef) => {
    const { setRoot } = useMessageScrollerInternal("MessageScroller")
    const ref = useMergedRefs(forwardedRef, setRoot)

    return (
      <div
        ref={ref}
        data-slot="message-scroller"
        className={cn(
          "group/message-scroller relative flex size-full min-h-0 flex-col overflow-hidden",
          className
        )}
        {...props}
      />
    )
  }
)
MessageScroller.displayName = "MessageScroller"

const MessageScrollerViewport = React.forwardRef<
  HTMLDivElement,
  MessageScrollerViewportProps
>(
  (
    {
      "aria-label": ariaLabel = "Messages",
      children,
      className,
      onKeyDown,
      onScroll,
      onTouchMove,
      onWheel,
      preserveScrollOnPrepend = true,
      role = "region",
      tabIndex = 0,
      ...props
    },
    forwardedRef
  ) => {
    const { preserveScrollOnPrependRef, setViewport, sync, userScrollIntent } =
      useMessageScrollerInternal("MessageScrollerViewport")
    preserveScrollOnPrependRef.current = preserveScrollOnPrepend
    const ref = useMergedRefs(forwardedRef, setViewport)

    return (
      <div
        ref={ref}
        data-slot="message-scroller-viewport"
        aria-label={ariaLabel}
        role={role}
        tabIndex={tabIndex}
        className={cn(
          "size-full min-h-0 min-w-0 scroll-fade-b scrollbar-thin scrollbar-gutter-stable overflow-y-auto overscroll-contain contain-content data-autoscrolling:scrollbar-thumb-transparent data-autoscrolling:scrollbar-track-transparent",
          className
        )}
        onKeyDown={(event) => {
          if (USER_SCROLL_KEYS.has(event.key)) userScrollIntent()
          onKeyDown?.(event)
        }}
        onScroll={(event) => {
          sync(true)
          onScroll?.(event)
        }}
        onTouchMove={(event) => {
          userScrollIntent()
          onTouchMove?.(event)
        }}
        onWheel={(event) => {
          userScrollIntent()
          onWheel?.(event)
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
MessageScrollerViewport.displayName = "MessageScrollerViewport"

const MessageScrollerContent = React.forwardRef<
  HTMLDivElement,
  MessageScrollerContentProps
>(
  (
    {
      "aria-relevant": ariaRelevant = "additions",
      children,
      className,
      role = "log",
      spacerClassName,
      ...props
    },
    forwardedRef
  ) => {
    const { setContent } = useMessageScrollerInternal("MessageScrollerContent")
    const ref = useMergedRefs(forwardedRef, setContent)

    return (
      <div
        ref={ref}
        data-slot="message-scroller-content"
        aria-relevant={ariaRelevant}
        role={role}
        className={cn("flex h-max min-h-full flex-col gap-6", className)}
        {...props}
      >
        {children}
        <div
          aria-hidden="true"
          data-message-scroller-spacer=""
          className={spacerClassName}
          hidden
        />
      </div>
    )
  }
)
MessageScrollerContent.displayName = "MessageScrollerContent"

const MessageScrollerItem = React.forwardRef<
  HTMLDivElement,
  MessageScrollerItemProps
>(({ className, messageId, scrollAnchor = false, ...props }, forwardedRef) => (
  <div
    ref={forwardedRef}
    data-slot="message-scroller-item"
    data-message-id={messageId}
    data-scroll-anchor={scrollAnchor ? "true" : "false"}
    className={cn(
      "min-w-0 shrink-0 [contain-intrinsic-size:auto_10rem] [content-visibility:auto]",
      className
    )}
    {...props}
  />
))
MessageScrollerItem.displayName = "MessageScrollerItem"

const MessageScrollerButton = React.forwardRef<
  HTMLButtonElement,
  MessageScrollerButtonProps
>(
  (
    {
      behavior = "smooth",
      children,
      className,
      direction = "end",
      onClick,
      render,
      size = "icon-sm",
      tabIndex,
      type = "button",
      variant = "secondary",
      ...props
    },
    forwardedRef
  ) => {
    const { scrollToEnd, scrollToStart } = useMessageScroller()
    const scrollable = useMessageScrollerScrollable()
    const active = direction === "start" ? scrollable.start : scrollable.end
    const state = React.useMemo(
      () => ({ active, direction }),
      [active, direction]
    )

    return useRender<MessageScrollerButtonState, HTMLButtonElement>({
      defaultTagName: "button",
      ref: forwardedRef,
      render: render ?? <Button variant={variant} size={size} />,
      state,
      props: {
        ...props,
        "aria-hidden": active ? undefined : true,
        "data-active": active ? "true" : "false",
        "data-slot": "message-scroller-button",
        "data-direction": direction,
        "data-variant": variant,
        "data-size": size,
        className: cn(
          "absolute inset-s-1/2 -translate-x-1/2 border-border bg-background text-foreground transition-[translate,scale,opacity] duration-200 hover:bg-muted hover:text-foreground data-[active=false]:pointer-events-none data-[active=false]:scale-95 data-[active=false]:opacity-0 data-[active=false]:duration-400 data-[active=false]:ease-[cubic-bezier(0.7,0,0.84,0)] data-[active=true]:translate-y-0 data-[active=true]:scale-100 data-[active=true]:opacity-100 data-[active=true]:ease-[cubic-bezier(0.23,1,0.32,1)] data-[direction=end]:bottom-4 data-[direction=end]:data-[active=false]:translate-y-full data-[direction=start]:top-4 data-[direction=start]:data-[active=false]:-translate-y-full rtl:translate-x-1/2 data-[direction=start]:[&_svg]:rotate-180",
          className
        ),
        inert: active ? undefined : true,
        tabIndex: active ? tabIndex : -1,
        type,
        children: children ?? (
          <>
            <ArrowDownIcon />
            <span className="sr-only">
              {direction === "end" ? "Scroll to end" : "Scroll to start"}
            </span>
          </>
        ),
        onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
          if (!active) return
          onClick?.(event)
          if (event.defaultPrevented) return
          event.currentTarget.blur()
          if (direction === "start") scrollToStart({ behavior })
          else scrollToEnd({ behavior })
        },
      },
    })
  }
)
MessageScrollerButton.displayName = "MessageScrollerButton"

export {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
}
