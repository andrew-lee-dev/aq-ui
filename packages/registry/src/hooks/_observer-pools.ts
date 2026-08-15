type ResizeSubscriber = (entry: ResizeObserverEntry) => void
type IntersectionSubscriber = (entry: IntersectionObserverEntry) => void
type MutationSubscriber = (records: MutationRecord[]) => void

interface FrameBatch<Entry extends { readonly target: Element }> {
  cancel: () => void
  deleteTarget: (target: Element) => void
  enqueue: (entries: Entry[]) => void
}

function scheduleFrame(document: Document, callback: FrameRequestCallback) {
  const window = document.defaultView

  if (window?.requestAnimationFrame && window.cancelAnimationFrame) {
    const frame = window.requestAnimationFrame(callback)
    return () => window.cancelAnimationFrame(frame)
  }

  const timeout = setTimeout(() => callback(Date.now()), 16)
  return () => clearTimeout(timeout)
}

function createFrameBatch<Entry extends { readonly target: Element }>(
  document: Document,
  subscribers: Map<Element, Set<(entry: Entry) => void>>
): FrameBatch<Entry> {
  const pendingEntries = new Map<Element, Entry>()
  let cancelScheduledFrame: (() => void) | null = null

  const flush = () => {
    cancelScheduledFrame = null
    const entries = [...pendingEntries.values()]
    pendingEntries.clear()

    entries.forEach((entry) => {
      const targetSubscribers = subscribers.get(entry.target)
      if (!targetSubscribers) return
      for (const notify of [...targetSubscribers]) notify(entry)
    })
  }

  return {
    enqueue(entries) {
      entries.forEach((entry) => pendingEntries.set(entry.target, entry))
      cancelScheduledFrame ??= scheduleFrame(document, flush)
    },
    deleteTarget(target) {
      pendingEntries.delete(target)
    },
    cancel() {
      cancelScheduledFrame?.()
      cancelScheduledFrame = null
      pendingEntries.clear()
    },
  }
}

interface ResizePool {
  observer: ResizeObserver
  subscribers: Map<Element, Set<ResizeSubscriber>>
  batch: FrameBatch<ResizeObserverEntry>
  count: number
}

const resizePools = new WeakMap<
  Document,
  Map<ResizeObserverBoxOptions, ResizePool>
>()

export function subscribeResizeObserver(
  element: Element,
  box: ResizeObserverBoxOptions,
  subscriber: ResizeSubscriber
): (() => void) | null {
  const document = element.ownerDocument
  const ResizeObserverConstructor =
    document.defaultView?.ResizeObserver ??
    (typeof ResizeObserver === "undefined" ? undefined : ResizeObserver)
  if (!ResizeObserverConstructor) return null

  let documentPools = resizePools.get(document)
  if (!documentPools) {
    documentPools = new Map()
    resizePools.set(document, documentPools)
  }

  let pool = documentPools.get(box)
  if (!pool) {
    const subscribers = new Map<Element, Set<ResizeSubscriber>>()
    const batch = createFrameBatch(document, subscribers)
    const observer = new ResizeObserverConstructor((entries) => {
      batch.enqueue(entries)
    })
    pool = { observer, subscribers, batch, count: 0 }
    documentPools.set(box, pool)
  }

  let elementSubscribers = pool.subscribers.get(element)
  if (!elementSubscribers) {
    elementSubscribers = new Set()
    pool.subscribers.set(element, elementSubscribers)
    pool.observer.observe(element, { box })
  }
  const registration: ResizeSubscriber = (entry) => subscriber(entry)
  elementSubscribers.add(registration)
  pool.count += 1

  let active = true
  return () => {
    if (!active || !pool) return
    active = false
    const currentSubscribers = pool.subscribers.get(element)
    currentSubscribers?.delete(registration)
    pool.count -= 1
    if (currentSubscribers?.size === 0) {
      pool.observer.unobserve(element)
      pool.subscribers.delete(element)
      pool.batch.deleteTarget(element)
    }
    if (pool.count === 0) {
      pool.batch.cancel()
      pool.observer.disconnect()
      documentPools?.delete(box)
    }
  }
}

interface IntersectionPool {
  observer: IntersectionObserver
  subscribers: Map<Element, Set<IntersectionSubscriber>>
  batch: FrameBatch<IntersectionObserverEntry>
  root: Element | Document | null
  rootMargin: string
  thresholdKey: string
  count: number
}

const intersectionPools = new WeakMap<Document, IntersectionPool[]>()

function thresholdKey(threshold: number | number[] | undefined) {
  return (Array.isArray(threshold) ? threshold : [threshold ?? 0])
    .slice()
    .sort((left, right) => left - right)
    .join(",")
}

export function subscribeIntersectionObserver(
  element: Element,
  options: IntersectionObserverInit,
  subscriber: IntersectionSubscriber
): (() => void) | null {
  const document = element.ownerDocument
  const IntersectionObserverConstructor =
    document.defaultView?.IntersectionObserver ??
    (typeof IntersectionObserver === "undefined"
      ? undefined
      : IntersectionObserver)
  if (!IntersectionObserverConstructor) return null

  const root = options.root ?? null
  const rootMargin = options.rootMargin ?? "0px"
  const key = thresholdKey(options.threshold)
  let pools = intersectionPools.get(document)
  if (!pools) {
    pools = []
    intersectionPools.set(document, pools)
  }

  let pool = pools.find(
    (candidate) =>
      candidate.root === root &&
      candidate.rootMargin === rootMargin &&
      candidate.thresholdKey === key
  )

  if (!pool) {
    const subscribers = new Map<Element, Set<IntersectionSubscriber>>()
    const batch = createFrameBatch(document, subscribers)
    const observer = new IntersectionObserverConstructor((entries) => {
      batch.enqueue(entries)
    }, options)
    pool = {
      observer,
      subscribers,
      batch,
      root,
      rootMargin,
      thresholdKey: key,
      count: 0,
    }
    pools.push(pool)
  }

  let elementSubscribers = pool.subscribers.get(element)
  if (!elementSubscribers) {
    elementSubscribers = new Set()
    pool.subscribers.set(element, elementSubscribers)
    pool.observer.observe(element)
  }
  const registration: IntersectionSubscriber = (entry) => subscriber(entry)
  elementSubscribers.add(registration)
  pool.count += 1

  let active = true
  return () => {
    if (!active || !pool) return
    active = false
    const currentSubscribers = pool.subscribers.get(element)
    currentSubscribers?.delete(registration)
    pool.count -= 1
    if (currentSubscribers?.size === 0) {
      pool.observer.unobserve(element)
      pool.subscribers.delete(element)
      pool.batch.deleteTarget(element)
    }
    if (pool.count === 0) {
      pool.batch.cancel()
      pool.observer.disconnect()
      const index = pools?.indexOf(pool) ?? -1
      if (index >= 0) pools?.splice(index, 1)
    }
  }
}

interface MutationPool {
  observer: MutationObserver
  subscribers: Map<Node, Set<MutationSubscriber>>
  options: MutationObserverInit
  count: number
}

const mutationPools = new WeakMap<Document, Map<string, MutationPool>>()

function mutationDocument(target: Node): Document | null {
  if (target.ownerDocument) return target.ownerDocument
  return target.nodeType === 9 ? (target as Document) : null
}

function cloneMutationOptions(
  options: MutationObserverInit
): MutationObserverInit {
  return {
    attributes: options.attributes,
    attributeFilter: options.attributeFilter
      ? [...options.attributeFilter]
      : undefined,
    attributeOldValue: options.attributeOldValue,
    characterData: options.characterData,
    characterDataOldValue: options.characterDataOldValue,
    childList: options.childList,
    subtree: options.subtree,
  }
}

export function getMutationObserverOptionsKey(
  options: MutationObserverInit
): string {
  return JSON.stringify([
    options.attributes,
    options.attributeFilter ? [...options.attributeFilter].sort() : null,
    options.attributeOldValue,
    options.characterData,
    options.characterDataOldValue,
    options.childList,
    options.subtree,
  ])
}

function dispatchMutations(
  subscribers: Map<Node, Set<MutationSubscriber>>,
  options: MutationObserverInit,
  records: MutationRecord[]
) {
  subscribers.forEach((targetSubscribers, target) => {
    const targetRecords = records.filter(
      (record) =>
        record.target === target ||
        (options.subtree === true && target.contains(record.target))
    )

    if (targetRecords.length === 0) return
    for (const notify of [...targetSubscribers]) notify(targetRecords)
  })
}

export function subscribeMutationObserver(
  target: Node,
  options: MutationObserverInit,
  subscriber: MutationSubscriber
): (() => void) | null {
  const document = mutationDocument(target)
  if (!document) return null

  const MutationObserverConstructor =
    document.defaultView?.MutationObserver ??
    (typeof MutationObserver === "undefined" ? undefined : MutationObserver)
  if (!MutationObserverConstructor) return null

  let documentPools = mutationPools.get(document)
  if (!documentPools) {
    documentPools = new Map()
    mutationPools.set(document, documentPools)
  }

  const observerOptions = cloneMutationOptions(options)
  const optionsKey = getMutationObserverOptionsKey(observerOptions)
  let pool = documentPools.get(optionsKey)

  if (!pool) {
    const subscribers = new Map<Node, Set<MutationSubscriber>>()
    const observer = new MutationObserverConstructor((records) => {
      dispatchMutations(subscribers, observerOptions, records)
    })
    pool = {
      observer,
      subscribers,
      options: observerOptions,
      count: 0,
    }
    documentPools.set(optionsKey, pool)
  }

  let targetSubscribers = pool.subscribers.get(target)
  if (!targetSubscribers) {
    targetSubscribers = new Set()
    try {
      pool.observer.observe(target, pool.options)
    } catch (error) {
      if (pool.count === 0) {
        pool.observer.disconnect()
        documentPools.delete(optionsKey)
      }
      throw error
    }
    pool.subscribers.set(target, targetSubscribers)
  }

  const registration: MutationSubscriber = (records) => subscriber(records)
  targetSubscribers.add(registration)
  pool.count += 1

  let active = true
  return () => {
    if (!active || !pool) return
    active = false
    const currentSubscribers = pool.subscribers.get(target)
    currentSubscribers?.delete(registration)
    pool.count -= 1

    if (currentSubscribers?.size === 0) {
      pool.subscribers.delete(target)
      if (pool.count > 0) {
        pool.observer.disconnect()
        const currentPool = pool
        pool.subscribers.forEach((_subscribers, observedTarget) => {
          currentPool.observer.observe(observedTarget, currentPool.options)
        })
      }
    }

    if (pool.count === 0) {
      pool.observer.disconnect()
      documentPools?.delete(optionsKey)
    }
  }
}
