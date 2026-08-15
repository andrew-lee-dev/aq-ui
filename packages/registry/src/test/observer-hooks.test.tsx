import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  subscribeIntersectionObserver,
  subscribeResizeObserver,
} from "@aq-ui/registry/hooks/_observer-pools"
import { useMutationObserver } from "@aq-ui/registry/hooks/use-mutation-observer"

class ResizeObserverMock {
  static instances: ResizeObserverMock[] = []

  readonly observe = vi.fn<ResizeObserver["observe"]>()
  readonly unobserve = vi.fn<ResizeObserver["unobserve"]>()
  readonly disconnect = vi.fn(() => undefined)

  constructor(private readonly callback: ResizeObserverCallback) {
    ResizeObserverMock.instances.push(this)
  }

  emit(entries: ResizeObserverEntry[]) {
    this.callback(entries, this as unknown as ResizeObserver)
  }
}

class IntersectionObserverMock {
  static instances: IntersectionObserverMock[] = []

  readonly root = null
  readonly rootMargin = "0px"
  readonly thresholds = [0]
  readonly observe = vi.fn<IntersectionObserver["observe"]>()
  readonly unobserve = vi.fn<IntersectionObserver["unobserve"]>()
  readonly disconnect = vi.fn(() => undefined)
  readonly takeRecords = vi.fn((): IntersectionObserverEntry[] => [])

  constructor(private readonly callback: IntersectionObserverCallback) {
    IntersectionObserverMock.instances.push(this)
  }

  emit(entries: IntersectionObserverEntry[]) {
    this.callback(entries, this as unknown as IntersectionObserver)
  }
}

class MutationObserverMock {
  static instances: MutationObserverMock[] = []

  readonly observe = vi.fn<MutationObserver["observe"]>()
  readonly disconnect = vi.fn(() => undefined)
  readonly takeRecords = vi.fn((): MutationRecord[] => [])

  constructor(private readonly callback: MutationCallback) {
    MutationObserverMock.instances.push(this)
  }

  emit(records: MutationRecord[]) {
    this.callback(records, this as unknown as MutationObserver)
  }
}

const propertyRestorers: Array<() => void> = []
let frames = new Map<number, FrameRequestCallback>()
let nextFrame = 1

function replaceWindowProperty(key: string, value: unknown) {
  const descriptor = Object.getOwnPropertyDescriptor(window, key)
  Object.defineProperty(window, key, {
    configurable: true,
    writable: true,
    value,
  })
  propertyRestorers.push(() => {
    if (descriptor) Object.defineProperty(window, key, descriptor)
    else Reflect.deleteProperty(window, key)
  })
}

function flushFrames() {
  const queuedFrames = [...frames.values()]
  frames.clear()
  queuedFrames.forEach((callback) => callback(performance.now()))
}

function resizeEntry(target: Element, width: number): ResizeObserverEntry {
  return {
    target,
    contentRect: { width } as DOMRectReadOnly,
  } as ResizeObserverEntry
}

function intersectionEntry(
  target: Element,
  intersectionRatio: number
): IntersectionObserverEntry {
  return {
    target,
    intersectionRatio,
    isIntersecting: intersectionRatio > 0,
  } as IntersectionObserverEntry
}

function mutationRecord(target: Node): MutationRecord {
  return { target, type: "childList" } as MutationRecord
}

beforeEach(() => {
  ResizeObserverMock.instances = []
  IntersectionObserverMock.instances = []
  MutationObserverMock.instances = []
  frames = new Map()
  nextFrame = 1

  replaceWindowProperty("ResizeObserver", ResizeObserverMock)
  replaceWindowProperty("IntersectionObserver", IntersectionObserverMock)
  replaceWindowProperty("MutationObserver", MutationObserverMock)
  replaceWindowProperty(
    "requestAnimationFrame",
    (callback: FrameRequestCallback) => {
      const frame = nextFrame++
      frames.set(frame, callback)
      return frame
    }
  )
  replaceWindowProperty("cancelAnimationFrame", (frame: number) => {
    frames.delete(frame)
  })
})

afterEach(() => {
  while (propertyRestorers.length > 0) propertyRestorers.pop()?.()
})

describe("observer pools", () => {
  it("pools and RAF-batches resize entries using the latest entry per target", () => {
    const firstTarget = document.createElement("div")
    const secondTarget = document.createElement("div")
    const firstSubscriber = vi.fn()
    const secondSubscriber = vi.fn()
    const unsubscribeFirst = subscribeResizeObserver(
      firstTarget,
      "content-box",
      firstSubscriber
    )
    const unsubscribeSecond = subscribeResizeObserver(
      secondTarget,
      "content-box",
      secondSubscriber
    )

    expect(ResizeObserverMock.instances).toHaveLength(1)
    const observer = ResizeObserverMock.instances[0]!
    const firstEntry = resizeEntry(firstTarget, 100)
    const latestFirstEntry = resizeEntry(firstTarget, 200)
    const secondEntry = resizeEntry(secondTarget, 300)

    observer.emit([firstEntry, secondEntry])
    observer.emit([latestFirstEntry])

    expect(firstSubscriber).not.toHaveBeenCalled()
    expect(secondSubscriber).not.toHaveBeenCalled()
    expect(frames).toHaveLength(1)

    flushFrames()

    expect(firstSubscriber).toHaveBeenCalledOnce()
    expect(firstSubscriber).toHaveBeenCalledWith(latestFirstEntry)
    expect(secondSubscriber).toHaveBeenCalledOnce()
    expect(secondSubscriber).toHaveBeenCalledWith(secondEntry)

    unsubscribeFirst?.()
    expect(observer.unobserve).toHaveBeenCalledWith(firstTarget)
    expect(observer.disconnect).not.toHaveBeenCalled()

    observer.emit([resizeEntry(secondTarget, 400)])
    unsubscribeSecond?.()
    unsubscribeSecond?.()

    expect(frames).toHaveLength(0)
    expect(observer.disconnect).toHaveBeenCalledOnce()
    expect(secondSubscriber).toHaveBeenCalledOnce()

    const unsubscribeReplacement = subscribeResizeObserver(
      firstTarget,
      "content-box",
      vi.fn()
    )
    expect(ResizeObserverMock.instances).toHaveLength(2)
    unsubscribeReplacement?.()
  })

  it("shares equivalent intersection observers and RAF-batches their entries", () => {
    const firstTarget = document.createElement("div")
    const secondTarget = document.createElement("div")
    const firstSubscriber = vi.fn()
    const secondSubscriber = vi.fn()
    const unsubscribeFirst = subscribeIntersectionObserver(
      firstTarget,
      { threshold: [0, 0.5] },
      firstSubscriber
    )
    const unsubscribeSecond = subscribeIntersectionObserver(
      secondTarget,
      { threshold: [0.5, 0] },
      secondSubscriber
    )

    expect(IntersectionObserverMock.instances).toHaveLength(1)
    const observer = IntersectionObserverMock.instances[0]!
    const latestEntry = intersectionEntry(firstTarget, 1)
    observer.emit([intersectionEntry(firstTarget, 0.5)])
    observer.emit([latestEntry, intersectionEntry(secondTarget, 0)])

    expect(firstSubscriber).not.toHaveBeenCalled()
    expect(secondSubscriber).not.toHaveBeenCalled()
    expect(frames).toHaveLength(1)

    flushFrames()

    expect(firstSubscriber).toHaveBeenCalledOnce()
    expect(firstSubscriber).toHaveBeenCalledWith(latestEntry)
    expect(secondSubscriber).toHaveBeenCalledOnce()

    unsubscribeFirst?.()
    unsubscribeSecond?.()
    expect(observer.disconnect).toHaveBeenCalledOnce()
  })

  it("pools mutation hooks, routes records, and releases native observers", () => {
    const firstTarget = document.createElement("div")
    const firstChild = document.createElement("span")
    const secondTarget = document.createElement("div")
    firstTarget.append(firstChild)
    const onFirstMutation = vi.fn()
    const onSecondMutation = vi.fn()
    const first = renderHook(() =>
      useMutationObserver(
        firstTarget,
        { childList: true, subtree: true },
        { onMutate: onFirstMutation }
      )
    )
    const second = renderHook(() =>
      useMutationObserver(
        secondTarget,
        { subtree: true, childList: true },
        { onMutate: onSecondMutation }
      )
    )

    expect(MutationObserverMock.instances).toHaveLength(1)
    const observer = MutationObserverMock.instances[0]!
    expect(observer.observe).toHaveBeenCalledTimes(2)
    const firstRecord = mutationRecord(firstChild)
    const secondRecord = mutationRecord(secondTarget)

    act(() => observer.emit([firstRecord, secondRecord]))

    expect(first.result.current.records).toEqual([firstRecord])
    expect(second.result.current.records).toEqual([secondRecord])
    expect(onFirstMutation).toHaveBeenCalledWith([firstRecord])
    expect(onSecondMutation).toHaveBeenCalledWith([secondRecord])

    first.unmount()
    expect(observer.disconnect).toHaveBeenCalledOnce()
    expect(observer.observe).toHaveBeenLastCalledWith(secondTarget, {
      attributes: undefined,
      attributeFilter: undefined,
      attributeOldValue: undefined,
      characterData: undefined,
      characterDataOldValue: undefined,
      childList: true,
      subtree: true,
    })

    act(() => observer.emit([firstRecord, secondRecord]))
    expect(onFirstMutation).toHaveBeenCalledOnce()
    expect(onSecondMutation).toHaveBeenCalledTimes(2)

    second.unmount()
    expect(observer.disconnect).toHaveBeenCalledTimes(2)

    const replacement = renderHook(() =>
      useMutationObserver(firstTarget, { childList: true })
    )
    expect(MutationObserverMock.instances).toHaveLength(2)
    replacement.unmount()
    expect(MutationObserverMock.instances[1]!.disconnect).toHaveBeenCalledOnce()
  })
})
