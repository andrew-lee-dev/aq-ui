"use client"

import * as React from "react"

import { useIsomorphicLayoutEffect } from "@aq-ui/registry/hooks/use-isomorphic-layout-effect"

/* eslint-disable react-hooks/immutability -- Scrolling is an intentional DOM side effect; observer callbacks then publish its measured state. */

export type MessageScrollerDefaultScrollPosition =
  "start" | "end" | "last-anchor"

export type MessageScrollerButtonDirection = "start" | "end"
export type MessageScrollerScrollAlign = "start" | "center" | "end" | "nearest"

export interface MessageScrollerScrollOptions {
  align?: MessageScrollerScrollAlign
  behavior?: ScrollBehavior
  scrollMargin?: number
}

export interface MessageScrollerScrollable {
  start: boolean
  end: boolean
}

export interface MessageScrollerVisibilityState {
  currentAnchorId: string | null
  visibleMessageIds: string[]
}

export interface MessageScrollerProviderProps {
  children?: React.ReactNode
  autoScroll?: boolean
  defaultScrollPosition?: MessageScrollerDefaultScrollPosition
  scrollEdgeThreshold?: number
  scrollPreviousItemPeek?: number
  scrollMargin?: number
}

interface MessageScrollerContextValue {
  autoscrolling: boolean
  content: HTMLDivElement | null
  preserveScrollOnPrependRef: React.MutableRefObject<boolean>
  root: HTMLDivElement | null
  scrollable: MessageScrollerScrollable
  scrollToEnd: (options?: MessageScrollerScrollOptions) => boolean
  scrollToMessage: (
    messageId: string,
    options?: MessageScrollerScrollOptions
  ) => boolean
  scrollToStart: (options?: MessageScrollerScrollOptions) => boolean
  setContent: (node: HTMLDivElement | null) => void
  setRoot: (node: HTMLDivElement | null) => void
  setViewport: (node: HTMLDivElement | null) => void
  sync: (userInitiated?: boolean) => void
  userScrollIntent: () => void
  viewport: HTMLDivElement | null
  visibility: MessageScrollerVisibilityState
}

const EMPTY_SCROLLABLE: MessageScrollerScrollable = {
  start: false,
  end: false,
}
const EMPTY_VISIBILITY: MessageScrollerVisibilityState = {
  currentAnchorId: null,
  visibleMessageIds: [],
}
const EDGE_EPSILON = 0.5

const MessageScrollerContext =
  React.createContext<MessageScrollerContextValue | null>(null)

function useMessageScrollerContext(component: string) {
  const context = React.useContext(MessageScrollerContext)
  if (!context) {
    throw new Error(`${component} must be used within MessageScrollerProvider.`)
  }
  return context
}

function messageElements(content: HTMLElement | null) {
  if (!content) return []
  return Array.from(content.children).filter(
    (element): element is HTMLElement =>
      element instanceof HTMLElement &&
      element.dataset.messageScrollerSpacer == null
  )
}

function maxScrollTop(viewport: HTMLElement) {
  return Math.max(0, viewport.scrollHeight - viewport.clientHeight)
}

function getElementScrollTop(element: HTMLElement, viewport: HTMLElement) {
  const elementRect = element.getBoundingClientRect()
  const viewportRect = viewport.getBoundingClientRect()
  return elementRect.top - viewportRect.top + viewport.scrollTop
}

function shallowEqualScrollable(
  previous: MessageScrollerScrollable,
  next: MessageScrollerScrollable
) {
  return previous.start === next.start && previous.end === next.end
}

function shallowEqualVisibility(
  previous: MessageScrollerVisibilityState,
  next: MessageScrollerVisibilityState
) {
  return (
    previous.currentAnchorId === next.currentAnchorId &&
    previous.visibleMessageIds.length === next.visibleMessageIds.length &&
    previous.visibleMessageIds.every(
      (messageId, index) => messageId === next.visibleMessageIds[index]
    )
  )
}

/**
 * Owns the scroll state shared by all message-scroller parts.
 *
 * The implementation intentionally uses React and browser observers directly so
 * it works with both React 18.3 and React 19 and remains inert during SSR.
 */
export function MessageScrollerProvider({
  autoScroll = false,
  children,
  defaultScrollPosition = "end",
  scrollEdgeThreshold = 8,
  scrollPreviousItemPeek = 64,
  scrollMargin = 0,
}: MessageScrollerProviderProps) {
  const [root, setRoot] = React.useState<HTMLDivElement | null>(null)
  const [viewport, setViewport] = React.useState<HTMLDivElement | null>(null)
  const [content, setContent] = React.useState<HTMLDivElement | null>(null)
  const [scrollable, setScrollable] =
    React.useState<MessageScrollerScrollable>(EMPTY_SCROLLABLE)
  const [visibility, setVisibility] =
    React.useState<MessageScrollerVisibilityState>(EMPTY_VISIBILITY)
  const [autoscrolling, setAutoscrolling] = React.useState(false)
  const preserveScrollOnPrependRef = React.useRef(true)
  const defaultPositionAppliedRef = React.useRef(false)
  const followingEndRef = React.useRef(autoScroll)
  const previousMetricsRef = React.useRef({
    firstElement: null as Element | null,
    scrollHeight: 0,
  })
  const pendingScrollRef = React.useRef<{
    messageId: string
    options: MessageScrollerScrollOptions
  } | null>(null)
  const animationFrameRef = React.useRef<number | null>(null)
  const autoscrollTimerRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (!autoScroll) {
      followingEndRef.current = false
      return
    }
    if (viewport) {
      followingEndRef.current =
        maxScrollTop(viewport) - viewport.scrollTop <= scrollEdgeThreshold
    }
  }, [autoScroll, scrollEdgeThreshold, viewport])

  React.useEffect(() => {
    defaultPositionAppliedRef.current = false
  }, [defaultScrollPosition])

  const commitState = React.useCallback(
    (userInitiated = false) => {
      if (!viewport) return

      const remaining = maxScrollTop(viewport) - viewport.scrollTop
      const nextScrollable = {
        start: viewport.scrollTop > scrollEdgeThreshold,
        end: remaining > scrollEdgeThreshold,
      }

      setScrollable((previous) =>
        shallowEqualScrollable(previous, nextScrollable)
          ? previous
          : nextScrollable
      )

      if (userInitiated && autoScroll) {
        followingEndRef.current = remaining <= scrollEdgeThreshold
      }

      if (!content) {
        setVisibility((previous) =>
          shallowEqualVisibility(previous, EMPTY_VISIBILITY)
            ? previous
            : EMPTY_VISIBILITY
        )
        return
      }

      const viewportRect = viewport.getBoundingClientRect()
      const anchorLine =
        viewportRect.top + scrollMargin + scrollPreviousItemPeek
      const visibleMessageIds: string[] = []
      let currentAnchorId: string | null = null

      for (const element of messageElements(content)) {
        const messageId = element.dataset.messageId
        if (!messageId) continue
        const rect = element.getBoundingClientRect()
        if (rect.bottom > anchorLine && rect.top < viewportRect.bottom) {
          visibleMessageIds.push(messageId)
        }
        if (
          element.dataset.scrollAnchor === "true" &&
          rect.top <= anchorLine + EDGE_EPSILON
        ) {
          currentAnchorId = messageId
        }
      }

      const nextVisibility = { currentAnchorId, visibleMessageIds }
      setVisibility((previous) =>
        shallowEqualVisibility(previous, nextVisibility)
          ? previous
          : nextVisibility
      )
    },
    [
      autoScroll,
      content,
      scrollEdgeThreshold,
      scrollMargin,
      scrollPreviousItemPeek,
      viewport,
    ]
  )

  const sync = React.useCallback(
    (userInitiated = false) => {
      if (typeof window === "undefined") return
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current)
      }
      animationFrameRef.current = window.requestAnimationFrame(() => {
        animationFrameRef.current = null
        commitState(userInitiated)
      })
    },
    [commitState]
  )

  const markAutoscrolling = React.useCallback(() => {
    if (typeof window === "undefined") return
    setAutoscrolling(true)
    if (autoscrollTimerRef.current !== null) {
      window.clearTimeout(autoscrollTimerRef.current)
    }
    autoscrollTimerRef.current = window.setTimeout(() => {
      autoscrollTimerRef.current = null
      setAutoscrolling(false)
    }, 180)
  }, [])

  const scrollToTop = React.useCallback(
    (top: number, behavior: ScrollBehavior) => {
      if (!viewport) return false
      const boundedTop = Math.max(0, Math.min(top, maxScrollTop(viewport)))
      markAutoscrolling()
      if (typeof viewport.scrollTo === "function") {
        viewport.scrollTo({ top: boundedTop, behavior })
      } else {
        viewport.scrollTop = boundedTop
      }
      sync()
      return true
    },
    [markAutoscrolling, sync, viewport]
  )

  const scrollToStart = React.useCallback(
    (options: MessageScrollerScrollOptions = {}) => {
      followingEndRef.current = false
      return scrollToTop(0, options.behavior ?? "auto")
    },
    [scrollToTop]
  )

  const scrollToEnd = React.useCallback(
    (options: MessageScrollerScrollOptions = {}) => {
      if (!viewport) return false
      followingEndRef.current = autoScroll
      return scrollToTop(maxScrollTop(viewport), options.behavior ?? "auto")
    },
    [autoScroll, scrollToTop, viewport]
  )

  const scrollToMessage = React.useCallback(
    (messageId: string, options: MessageScrollerScrollOptions = {}) => {
      if (!content || !viewport) {
        pendingScrollRef.current = { messageId, options }
        return true
      }
      const elements = messageElements(content)
      const element = elements.find(
        (candidate) => candidate.dataset.messageId === messageId
      )
      if (!element) {
        if (elements.length === 0) {
          pendingScrollRef.current = { messageId, options }
          return true
        }
        return false
      }

      const align = options.align ?? "start"
      const margin = options.scrollMargin ?? scrollMargin
      const elementTop = getElementScrollTop(element, viewport)
      const elementHeight = element.getBoundingClientRect().height
      let target = elementTop - margin

      if (align === "center") {
        target = elementTop - (viewport.clientHeight - elementHeight) / 2
      } else if (align === "end") {
        target = elementTop - viewport.clientHeight + elementHeight + margin
      } else if (align === "nearest") {
        const visibleStart = viewport.scrollTop + margin
        const visibleEnd = viewport.scrollTop + viewport.clientHeight - margin
        const elementEnd = elementTop + elementHeight
        if (elementTop >= visibleStart && elementEnd <= visibleEnd) {
          return true
        }
        target =
          elementTop < visibleStart
            ? elementTop - margin
            : elementEnd - viewport.clientHeight + margin
      }

      followingEndRef.current = false
      pendingScrollRef.current = null
      return scrollToTop(target, options.behavior ?? "auto")
    },
    [content, scrollMargin, scrollToTop, viewport]
  )

  const applyDefaultPosition = React.useCallback(() => {
    if (
      defaultPositionAppliedRef.current ||
      !content ||
      !viewport ||
      messageElements(content).length === 0
    ) {
      return
    }

    if (defaultScrollPosition === "start") {
      scrollToStart()
    } else if (defaultScrollPosition === "last-anchor") {
      const anchors = messageElements(content).filter(
        (element) => element.dataset.scrollAnchor === "true"
      )
      const lastAnchor = anchors.at(-1)
      if (lastAnchor?.dataset.messageId) {
        scrollToMessage(lastAnchor.dataset.messageId)
      } else {
        scrollToEnd()
      }
    } else {
      scrollToEnd()
    }
    defaultPositionAppliedRef.current = true
  }, [
    content,
    defaultScrollPosition,
    scrollToEnd,
    scrollToMessage,
    scrollToStart,
    viewport,
  ])

  const handleContentChange = React.useCallback(() => {
    if (!content || !viewport) return
    const elements = messageElements(content)
    const pendingScroll = pendingScrollRef.current
    if (
      pendingScroll &&
      scrollToMessage(pendingScroll.messageId, pendingScroll.options)
    ) {
      previousMetricsRef.current = {
        firstElement: elements[0] ?? null,
        scrollHeight: viewport.scrollHeight,
      }
      return
    }
    const previous = previousMetricsRef.current
    const firstElement = elements[0] ?? null
    const wasPrepended =
      preserveScrollOnPrependRef.current &&
      previous.firstElement !== null &&
      firstElement !== previous.firstElement &&
      elements.includes(previous.firstElement as HTMLElement)

    if (wasPrepended) {
      viewport.scrollTop += Math.max(
        0,
        viewport.scrollHeight - previous.scrollHeight
      )
    } else if (autoScroll && followingEndRef.current) {
      scrollToEnd()
    }

    previousMetricsRef.current = {
      firstElement,
      scrollHeight: viewport.scrollHeight,
    }
    applyDefaultPosition()
    sync()
  }, [
    applyDefaultPosition,
    autoScroll,
    content,
    scrollToEnd,
    scrollToMessage,
    sync,
    viewport,
  ])

  useIsomorphicLayoutEffect(() => {
    if (!content || !viewport) return

    previousMetricsRef.current = {
      firstElement: messageElements(content)[0] ?? null,
      scrollHeight: viewport.scrollHeight,
    }
    const pendingScroll = pendingScrollRef.current
    if (pendingScroll) {
      scrollToMessage(pendingScroll.messageId, pendingScroll.options)
    }
    applyDefaultPosition()
    commitState()

    const mutationObserver =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(handleContentChange)
    mutationObserver?.observe(content, { childList: true })

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(handleContentChange)
    resizeObserver?.observe(content)
    resizeObserver?.observe(viewport)

    return () => {
      mutationObserver?.disconnect()
      resizeObserver?.disconnect()
    }
  }, [
    applyDefaultPosition,
    commitState,
    content,
    handleContentChange,
    scrollToMessage,
    viewport,
  ])

  React.useEffect(
    () => () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current)
      }
      if (autoscrollTimerRef.current !== null) {
        window.clearTimeout(autoscrollTimerRef.current)
      }
    },
    []
  )

  const userScrollIntent = React.useCallback(() => {
    if (!viewport || !autoScroll) return
    const remaining = maxScrollTop(viewport) - viewport.scrollTop
    followingEndRef.current = remaining <= scrollEdgeThreshold
  }, [autoScroll, scrollEdgeThreshold, viewport])

  React.useEffect(() => {
    for (const node of [root, viewport]) {
      if (!node) continue
      const directions = [
        scrollable.start ? "start" : null,
        scrollable.end ? "end" : null,
      ]
        .filter(Boolean)
        .join(" ")
      if (directions) node.setAttribute("data-scrollable", directions)
      else node.removeAttribute("data-scrollable")
      node.toggleAttribute("data-autoscrolling", autoscrolling)
    }
  }, [autoscrolling, root, scrollable, viewport])

  const value = React.useMemo<MessageScrollerContextValue>(
    () => ({
      autoscrolling,
      content,
      preserveScrollOnPrependRef,
      root,
      scrollable,
      scrollToEnd,
      scrollToMessage,
      scrollToStart,
      setContent,
      setRoot,
      setViewport,
      sync,
      userScrollIntent,
      viewport,
      visibility,
    }),
    [
      autoscrolling,
      content,
      root,
      scrollable,
      scrollToEnd,
      scrollToMessage,
      scrollToStart,
      sync,
      userScrollIntent,
      viewport,
      visibility,
    ]
  )

  return React.createElement(
    MessageScrollerContext.Provider,
    { value },
    children
  )
}

export function useMessageScroller() {
  const { scrollToEnd, scrollToMessage, scrollToStart } =
    useMessageScrollerContext("useMessageScroller")
  return React.useMemo(
    () => ({ scrollToEnd, scrollToMessage, scrollToStart }),
    [scrollToEnd, scrollToMessage, scrollToStart]
  )
}

export function useMessageScrollerScrollable() {
  return useMessageScrollerContext("useMessageScrollerScrollable").scrollable
}

export function useMessageScrollerVisibility() {
  return useMessageScrollerContext("useMessageScrollerVisibility").visibility
}

/** @internal Shared by the component parts; not required by consumers. */
export function useMessageScrollerInternal(component: string) {
  return useMessageScrollerContext(component)
}
