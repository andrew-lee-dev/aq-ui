"use client"

import * as React from "react"

import { useStableCallback } from "@aq-ui/registry/hooks/use-stable-callback"

export interface UseLongPressOptions {
  delay?: number
  movementTolerance?: number
  disabled?: boolean
  preventDefault?: boolean
  onStart?: () => void
  onCancel?: () => void
  onFinish?: () => void
}

export interface LongPressBind<T extends HTMLElement> {
  onPointerDown: React.PointerEventHandler<T>
  onPointerMove: React.PointerEventHandler<T>
  onPointerUp: React.PointerEventHandler<T>
  onPointerCancel: React.PointerEventHandler<T>
  onPointerLeave: React.PointerEventHandler<T>
}

export function useLongPress<T extends HTMLElement>(
  callback: (event: React.PointerEvent<T>) => void,
  {
    delay = 500,
    movementTolerance = 10,
    disabled = false,
    preventDefault = true,
    onStart,
    onCancel,
    onFinish,
  }: UseLongPressOptions = {}
): LongPressBind<T> {
  const callbackStable = useStableCallback(callback)
  const onStartStable = useStableCallback(onStart)
  const onCancelStable = useStableCallback(onCancel)
  const onFinishStable = useStableCallback(onFinish)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const originRef = React.useRef({ x: 0, y: 0 })
  const eventRef = React.useRef<React.PointerEvent<T> | null>(null)
  const triggeredRef = React.useRef(false)

  const cancel = React.useCallback(() => {
    const wasActive = timerRef.current !== null || eventRef.current !== null
    if (timerRef.current !== null) clearTimeout(timerRef.current)
    timerRef.current = null
    eventRef.current = null
    if (wasActive && !triggeredRef.current) onCancelStable()
    triggeredRef.current = false
  }, [onCancelStable])

  React.useEffect(() => {
    if (disabled) cancel()
    return cancel
  }, [cancel, disabled])

  return React.useMemo(
    () => ({
      onPointerDown(event: React.PointerEvent<T>) {
        if (disabled || event.button !== 0) return
        if (preventDefault) event.preventDefault()
        originRef.current = { x: event.clientX, y: event.clientY }
        eventRef.current = event
        triggeredRef.current = false
        onStartStable()
        timerRef.current = setTimeout(
          () => {
            timerRef.current = null
            triggeredRef.current = true
            if (eventRef.current) callbackStable(eventRef.current)
            onFinishStable()
          },
          Math.max(0, delay)
        )
      },
      onPointerMove(event: React.PointerEvent<T>) {
        if (timerRef.current === null) return
        const distance = Math.hypot(
          event.clientX - originRef.current.x,
          event.clientY - originRef.current.y
        )
        if (distance > movementTolerance) cancel()
      },
      onPointerUp: cancel,
      onPointerCancel: cancel,
      onPointerLeave: cancel,
    }),
    [
      callbackStable,
      cancel,
      delay,
      disabled,
      movementTolerance,
      onFinishStable,
      onStartStable,
      preventDefault,
    ]
  )
}
