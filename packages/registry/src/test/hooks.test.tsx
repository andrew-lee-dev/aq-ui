import { act, cleanup, renderHook, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useControllableState } from "@aq-ui/registry/hooks/use-controllable-state"
import { useAsync } from "@aq-ui/registry/hooks/use-async"
import { useIdle } from "@aq-ui/registry/hooks/use-idle"
import { useLongPress } from "@aq-ui/registry/hooks/use-long-press"
import { useDebouncedValue } from "@aq-ui/registry/hooks/use-debounced-value"
import { useHistoryState } from "@aq-ui/registry/hooks/use-history-state"
import { useLocalStorage } from "@aq-ui/registry/hooks/use-local-storage"
import { useThrottledCallback } from "@aq-ui/registry/hooks/use-throttled-callback"

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.useRealTimers()
})

describe("state hooks", () => {
  it("supports controlled and uncontrolled state without duplicate changes", () => {
    const onChange = vi.fn()
    const { result, rerender } = renderHook(
      ({ value }: { value?: number }) =>
        useControllableState({ value, defaultValue: 1, onChange }),
      { initialProps: { value: undefined as number | undefined } }
    )

    act(() => result.current[1]((current) => current + 1))
    expect(result.current[0]).toBe(2)
    expect(onChange).toHaveBeenLastCalledWith(2)

    rerender({ value: 10 })
    act(() => result.current[1](11))
    expect(result.current[0]).toBe(10)
    expect(onChange).toHaveBeenLastCalledWith(11)
  })

  it("debounces value updates", () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 100),
      { initialProps: { value: "first" } }
    )
    rerender({ value: "second" })
    expect(result.current).toBe("first")
    act(() => vi.advanceTimersByTime(100))
    expect(result.current).toBe("second")
  })

  it("tracks bounded undo and redo history", () => {
    const { result } = renderHook(() => useHistoryState(0, { capacity: 3 }))
    act(() => {
      result.current[1](1)
      result.current[1](2)
      result.current[1](3)
    })
    expect(result.current[0]).toBe(3)
    act(() => result.current[2].back())
    expect(result.current[0]).toBe(2)
    act(() => result.current[2].forward())
    expect(result.current[0]).toBe(3)
  })

  it("synchronizes local storage through the public setter", async () => {
    localStorage.setItem("aq-test", JSON.stringify({ count: 1 }))
    const { result } = renderHook(() =>
      useLocalStorage("aq-test", { count: 0 })
    )

    await waitFor(() => expect(result.current[0]).toEqual({ count: 1 }))

    act(() => result.current[1]({ count: 2 }))
    expect(result.current[0]).toEqual({ count: 2 })
    expect(JSON.parse(localStorage.getItem("aq-test") ?? "null")).toEqual({
      count: 2,
    })
    act(() => result.current[2]())
    expect(localStorage.getItem("aq-test")).toBeNull()
  })

  it("does not reinitialize storage when an inline fallback changes identity", async () => {
    localStorage.setItem("aq-stable", JSON.stringify({ count: 1 }))
    const getItem = vi.spyOn(Storage.prototype, "getItem")
    const { result, rerender } = renderHook(
      ({ fallback }) => useLocalStorage("aq-stable", fallback),
      { initialProps: { fallback: { count: 0 } } }
    )

    await waitFor(() => expect(result.current[0]).toEqual({ count: 1 }))
    const readsAfterInitialization = getItem.mock.calls.length
    rerender({ fallback: { count: 0 } })
    await act(async () => Promise.resolve())

    expect(getItem).toHaveBeenCalledTimes(readsAfterInitialization)
  })

  it("executes an immediate async task once without requiring initial args", async () => {
    const task = vi.fn(async () => "ready")
    const { result } = renderHook(() =>
      useAsync(task, { immediate: true, initialArgs: [] })
    )

    await waitFor(() => expect(result.current.status).toBe("success"))
    expect(result.current.data).toBe("ready")
    expect(task).toHaveBeenCalledOnce()
  })

  it("keeps the idle state after the default timeout fires", () => {
    vi.useFakeTimers()
    const onIdle = vi.fn()
    const onActive = vi.fn()
    const { result } = renderHook(() =>
      useIdle({ timeout: 100, onIdle, onActive })
    )

    act(() => vi.advanceTimersByTime(100))

    expect(result.current).toBe(true)
    expect(onIdle).toHaveBeenCalledOnce()
    expect(onActive).not.toHaveBeenCalled()
  })

  it("only cancels an active long press once", () => {
    vi.useFakeTimers()
    const onCancel = vi.fn()
    const { result, unmount } = renderHook(() =>
      useLongPress(vi.fn(), { onCancel })
    )
    const pointerEvent = {
      button: 0,
      clientX: 0,
      clientY: 0,
      preventDefault: vi.fn(),
    } as unknown as React.PointerEvent<HTMLElement>

    act(() => {
      result.current.onPointerDown(pointerEvent)
      result.current.onPointerLeave(pointerEvent)
      result.current.onPointerUp(pointerEvent)
    })
    unmount()

    expect(onCancel).toHaveBeenCalledOnce()
  })

  it("does not flush a suppressed trailing throttle call", () => {
    vi.useFakeTimers()
    const callback = vi.fn((value: string) => value)
    const { result } = renderHook(() =>
      useThrottledCallback(callback, 100, { trailing: false })
    )

    expect(result.current("first")).toBe("first")
    expect(result.current("second")).toBeUndefined()
    expect(result.current.flush()).toBeUndefined()
    expect(callback).toHaveBeenCalledOnce()
  })
})
