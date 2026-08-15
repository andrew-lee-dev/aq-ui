"use client"

import * as React from "react"

import { useControllableState } from "@aq-ui/registry/hooks/use-controllable-state"
import { useStableCallback } from "@aq-ui/registry/hooks/use-stable-callback"

export interface TreeViewItem {
  id: string
  label: string
  children?: TreeViewItem[]
  disabled?: boolean
}

export interface FlatTreeViewItem<T> {
  item: T
  id: string
  level: number
  parentId?: string
  position: number
  setSize: number
  hasChildren: boolean
}

export interface TreeViewMoveEvent {
  sourceId: string
  targetId: string
  position: "inside"
}

export interface UseTreeViewOptions<T extends TreeViewItem> {
  items: T[]
  selectedIds?: string[]
  defaultSelectedIds?: string[]
  onSelectedIdsChange?: (ids: string[]) => void
  expandedIds?: string[]
  defaultExpandedIds?: string[]
  onExpandedIdsChange?: (ids: string[]) => void
  multiple?: boolean
  direction?: "ltr" | "rtl"
  draggable?: boolean
  onMove?: (event: TreeViewMoveEvent) => void
  getId?: (item: T) => string
  getTextValue?: (item: T) => string
  getChildren?: (item: T) => T[] | undefined
  isDisabled?: (item: T) => boolean
}

export interface TreeViewItemProps<T extends HTMLElement> {
  ref: (element: T | null) => void
  role: "treeitem"
  tabIndex: 0 | -1
  "aria-level": number
  "aria-posinset": number
  "aria-setsize": number
  "aria-expanded": boolean | undefined
  "aria-selected": boolean
  "aria-disabled": boolean | undefined
  draggable: boolean
  onFocus: () => void
  onClick: (event: React.MouseEvent<T>) => void
  onDoubleClick: () => void
  onDragStart: (event: React.DragEvent<T>) => void
  onDragOver: (event: React.DragEvent<T>) => void
  onDrop: (event: React.DragEvent<T>) => void
  onDragEnd: () => void
}

export interface TreeViewController<T extends TreeViewItem> {
  flatItems: FlatTreeViewItem<T>[]
  selectedIds: string[]
  expandedIds: string[]
  focusedId: string | undefined
  draggedId: string | undefined
  setSelectedIds: (ids: string[]) => void
  setExpandedIds: (ids: string[]) => void
  select: (id: string, additive?: boolean) => void
  toggleExpanded: (id: string, force?: boolean) => void
  focusId: (id: string) => void
  focusIndex: (index: number) => void
  onKeyDown: React.KeyboardEventHandler<HTMLElement>
  getItemProps: <TElement extends HTMLElement>(
    id: string
  ) => TreeViewItemProps<TElement>
}

function defaultGetId<T extends TreeViewItem>(item: T) {
  return item.id
}

function defaultGetText<T extends TreeViewItem>(item: T) {
  return item.label
}

function defaultGetChildren<T extends TreeViewItem>(item: T) {
  return item.children as T[] | undefined
}

function defaultIsDisabled<T extends TreeViewItem>(item: T) {
  return Boolean(item.disabled)
}

function flattenTree<T extends TreeViewItem>(
  items: T[],
  expanded: Set<string>,
  getId: (item: T) => string,
  getChildren: (item: T) => T[] | undefined,
  level = 1,
  parentId?: string,
  ancestors = new Set<string>()
): FlatTreeViewItem<T>[] {
  const result: FlatTreeViewItem<T>[] = []

  items.forEach((item, index) => {
    const id = getId(item)
    const children = getChildren(item) ?? []
    result.push({
      item,
      id,
      level,
      parentId,
      position: index + 1,
      setSize: items.length,
      hasChildren: children.length > 0,
    })

    if (children.length > 0 && expanded.has(id) && !ancestors.has(id)) {
      const nextAncestors = new Set(ancestors)
      nextAncestors.add(id)
      result.push(
        ...flattenTree(
          children,
          expanded,
          getId,
          getChildren,
          level + 1,
          id,
          nextAncestors
        )
      )
    }
  })

  return result
}

const EMPTY_IDS: string[] = []

export function useTreeView<T extends TreeViewItem>({
  items,
  selectedIds: selectedIdsProp,
  defaultSelectedIds = EMPTY_IDS,
  onSelectedIdsChange,
  expandedIds: expandedIdsProp,
  defaultExpandedIds = EMPTY_IDS,
  onExpandedIdsChange,
  multiple = false,
  direction = "ltr",
  draggable = false,
  onMove,
  getId = defaultGetId,
  getTextValue = defaultGetText,
  getChildren = defaultGetChildren,
  isDisabled = defaultIsDisabled,
}: UseTreeViewOptions<T>): TreeViewController<T> {
  const [selectedIds, setSelectedIds] = useControllableState({
    value: selectedIdsProp,
    defaultValue: defaultSelectedIds,
    onChange: onSelectedIdsChange,
  })
  const [expandedIds, setExpandedIds] = useControllableState({
    value: expandedIdsProp,
    defaultValue: defaultExpandedIds,
    onChange: onExpandedIdsChange,
  })
  const [internalFocusedId, setFocusedId] = React.useState<string>()
  const [draggedId, setDraggedId] = React.useState<string>()
  const itemRefs = React.useRef(new Map<string, HTMLElement>())
  const typeaheadRef = React.useRef("")
  const typeaheadTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
  const onMoveStable = useStableCallback(onMove)
  const expandedSet = React.useMemo(() => new Set(expandedIds), [expandedIds])
  const flatItems = React.useMemo(
    () => flattenTree(items, expandedSet, getId, getChildren),
    [expandedSet, getChildren, getId, items]
  )
  const focusedId = flatItems.some((entry) => entry.id === internalFocusedId)
    ? internalFocusedId
    : flatItems[0]?.id

  const toggleExpanded = React.useCallback(
    (id: string, force?: boolean) => {
      const next = new Set(expandedIds)
      const shouldExpand = force ?? !next.has(id)
      if (shouldExpand) next.add(id)
      else next.delete(id)
      setExpandedIds(Array.from(next))
    },
    [expandedIds, setExpandedIds]
  )

  const select = React.useCallback(
    (id: string, additive = false) => {
      const entry = flatItems.find((candidate) => candidate.id === id)
      if (!entry || isDisabled(entry.item)) return
      if (!multiple) {
        setSelectedIds([id])
      } else if (additive) {
        setSelectedIds(
          selectedIds.includes(id)
            ? selectedIds.filter((selectedId) => selectedId !== id)
            : [...selectedIds, id]
        )
      } else {
        setSelectedIds(selectedIds.includes(id) ? [] : [id])
      }
    },
    [flatItems, isDisabled, multiple, selectedIds, setSelectedIds]
  )

  const focusId = React.useCallback((id: string) => {
    setFocusedId(id)
    requestAnimationFrame(() => itemRefs.current.get(id)?.focus())
  }, [])

  const focusIndex = React.useCallback(
    (index: number) => {
      const entry =
        flatItems[Math.max(0, Math.min(flatItems.length - 1, index))]
      if (entry) focusId(entry.id)
    },
    [flatItems, focusId]
  )

  const onKeyDown = React.useCallback<React.KeyboardEventHandler<HTMLElement>>(
    (event) => {
      const currentIndex = flatItems.findIndex(
        (entry) => entry.id === focusedId
      )
      const current = flatItems[currentIndex]
      if (!current) return

      const expandKey = direction === "rtl" ? "ArrowLeft" : "ArrowRight"
      const collapseKey = direction === "rtl" ? "ArrowRight" : "ArrowLeft"

      if (event.key === "ArrowDown") {
        event.preventDefault()
        focusIndex(currentIndex + 1)
        return
      }
      if (event.key === "ArrowUp") {
        event.preventDefault()
        focusIndex(currentIndex - 1)
        return
      }
      if (event.key === "Home") {
        event.preventDefault()
        focusIndex(0)
        return
      }
      if (event.key === "End") {
        event.preventDefault()
        focusIndex(flatItems.length - 1)
        return
      }
      if (event.key === expandKey) {
        event.preventDefault()
        if (current.hasChildren && !expandedSet.has(current.id)) {
          toggleExpanded(current.id, true)
        } else if (flatItems[currentIndex + 1]?.parentId === current.id) {
          focusIndex(currentIndex + 1)
        }
        return
      }
      if (event.key === collapseKey) {
        event.preventDefault()
        if (current.hasChildren && expandedSet.has(current.id)) {
          toggleExpanded(current.id, false)
        } else if (current.parentId) {
          const parentIndex = flatItems.findIndex(
            (entry) => entry.id === current.parentId
          )
          focusIndex(parentIndex)
        }
        return
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        select(current.id, event.metaKey || event.ctrlKey)
        return
      }
      if (
        event.key.length === 1 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        if (typeaheadTimerRef.current !== null) {
          clearTimeout(typeaheadTimerRef.current)
        }
        typeaheadRef.current += event.key.toLocaleLowerCase()
        typeaheadTimerRef.current = setTimeout(() => {
          typeaheadRef.current = ""
        }, 500)
        const ordered = [
          ...flatItems.slice(currentIndex + 1),
          ...flatItems.slice(0, currentIndex + 1),
        ]
        const match = ordered.find((entry) =>
          getTextValue(entry.item)
            .trim()
            .toLocaleLowerCase()
            .startsWith(typeaheadRef.current)
        )
        if (match) {
          event.preventDefault()
          focusId(match.id)
        }
      }
    },
    [
      direction,
      expandedSet,
      flatItems,
      focusId,
      focusedId,
      focusIndex,
      getTextValue,
      select,
      toggleExpanded,
    ]
  )

  React.useEffect(
    () => () => {
      if (typeaheadTimerRef.current !== null) {
        clearTimeout(typeaheadTimerRef.current)
      }
    },
    []
  )

  const getItemProps = React.useCallback(
    <TElement extends HTMLElement>(id: string): TreeViewItemProps<TElement> => {
      const entry = flatItems.find((candidate) => candidate.id === id)
      if (!entry) {
        throw new Error("Unknown tree item: " + id)
      }
      const disabled = isDisabled(entry.item)
      return {
        ref(element) {
          if (element) itemRefs.current.set(id, element)
          else itemRefs.current.delete(id)
        },
        role: "treeitem",
        tabIndex: focusedId === id ? 0 : -1,
        "aria-level": entry.level,
        "aria-posinset": entry.position,
        "aria-setsize": entry.setSize,
        "aria-expanded": entry.hasChildren ? expandedSet.has(id) : undefined,
        "aria-selected": selectedIds.includes(id),
        "aria-disabled": disabled || undefined,
        draggable: draggable && !disabled,
        onFocus: () => setFocusedId(id),
        onClick: (event) => select(id, event.metaKey || event.ctrlKey),
        onDoubleClick: () => {
          if (entry.hasChildren) toggleExpanded(id)
        },
        onDragStart: (event) => {
          if (!draggable || disabled) return
          setDraggedId(id)
          event.dataTransfer.effectAllowed = "move"
          event.dataTransfer.setData("text/plain", id)
        },
        onDragOver: (event) => {
          if (draggable && draggedId && draggedId !== id) {
            event.preventDefault()
            event.dataTransfer.dropEffect = "move"
          }
        },
        onDrop: (event) => {
          if (!draggable) return
          event.preventDefault()
          const sourceId = draggedId || event.dataTransfer.getData("text/plain")
          if (sourceId && sourceId !== id) {
            onMoveStable({ sourceId, targetId: id, position: "inside" })
          }
          setDraggedId(undefined)
        },
        onDragEnd: () => setDraggedId(undefined),
      }
    },
    [
      draggable,
      draggedId,
      expandedSet,
      flatItems,
      focusedId,
      isDisabled,
      onMoveStable,
      select,
      selectedIds,
      toggleExpanded,
    ]
  )

  return {
    flatItems,
    selectedIds,
    expandedIds,
    focusedId,
    draggedId,
    setSelectedIds,
    setExpandedIds,
    select,
    toggleExpanded,
    focusId,
    focusIndex,
    onKeyDown,
    getItemProps,
  }
}
