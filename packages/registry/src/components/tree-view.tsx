"use client"

import * as React from "react"
import {
  ChevronRightIcon,
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
} from "lucide-react"

import { useMergedRefs } from "@aq-ui/registry/hooks/use-merged-refs"
import { cn } from "@aq-ui/registry/lib/utils"

interface TreeViewNode {
  id: string
  label: string
  children?: TreeViewNode[]
  disabled?: boolean
  icon?: React.ReactNode
}

interface FlatTreeNode {
  node: TreeViewNode
  level: number
  parentId?: string
  position: number
  setSize: number
}

interface TreeViewProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  items: TreeViewNode[]
  selectedIds?: string[]
  defaultSelectedIds?: string[]
  onSelectedIdsChange?: (ids: string[]) => void
  expandedIds?: string[]
  defaultExpandedIds?: string[]
  onExpandedIdsChange?: (ids: string[]) => void
  multiple?: boolean
  draggable?: boolean
  onMove?: (event: {
    sourceId: string
    targetId: string
    position: "inside"
  }) => void
  renderLabel?: (node: TreeViewNode) => React.ReactNode
  emptyMessage?: React.ReactNode
}

const TreeView = React.forwardRef<HTMLDivElement, TreeViewProps>(
  function TreeView(
    {
      items,
      selectedIds,
      defaultSelectedIds = [],
      onSelectedIdsChange,
      expandedIds,
      defaultExpandedIds = [],
      onExpandedIdsChange,
      multiple = false,
      draggable = false,
      onMove,
      renderLabel = (node) => node.label,
      emptyMessage = "No items.",
      className,
      onKeyDown,
      ...props
    },
    ref
  ) {
    const rootRef = React.useRef<HTMLDivElement>(null)
    const mergedRef = useMergedRefs(rootRef, ref)
    const typeahead = React.useRef("")
    const typeaheadTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
      null
    )
    const [internalSelected, setInternalSelected] =
      React.useState(defaultSelectedIds)
    const [internalExpanded, setInternalExpanded] =
      React.useState(defaultExpandedIds)
    const [focusedId, setFocusedId] = React.useState<string | undefined>()
    const [draggedId, setDraggedId] = React.useState<string | undefined>()
    const selected = selectedIds ?? internalSelected
    const expanded = expandedIds ?? internalExpanded
    const flat = React.useMemo(
      () => flattenTree(items, new Set(expanded)),
      [expanded, items]
    )
    const activeFocusedId = flat.some((entry) => entry.node.id === focusedId)
      ? focusedId
      : flat[0]?.node.id

    React.useEffect(
      () => () => {
        if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current)
      },
      []
    )

    const changeExpanded = React.useCallback(
      (next: string[]) => {
        if (expandedIds === undefined) setInternalExpanded(next)
        onExpandedIdsChange?.(next)
      },
      [expandedIds, onExpandedIdsChange]
    )

    const toggleExpanded = React.useCallback(
      (id: string, force?: boolean) => {
        const next = new Set(expanded)
        const shouldExpand = force ?? !next.has(id)
        if (shouldExpand) next.add(id)
        else next.delete(id)
        changeExpanded([...next])
      },
      [changeExpanded, expanded]
    )

    const select = React.useCallback(
      (id: string, additive = false) => {
        let next: string[]
        if (multiple && additive)
          next = selected.includes(id)
            ? selected.filter((item) => item !== id)
            : [...selected, id]
        else next = selected.includes(id) && multiple ? [] : [id]
        if (selectedIds === undefined) setInternalSelected(next)
        onSelectedIdsChange?.(next)
      },
      [multiple, onSelectedIdsChange, selected, selectedIds]
    )

    const focusAt = React.useCallback(
      (index: number) => {
        const entry = flat[Math.max(0, Math.min(flat.length - 1, index))]
        if (!entry) return
        setFocusedId(entry.node.id)
        requestAnimationFrame(() =>
          rootRef.current
            ?.querySelector<HTMLElement>(
              `[data-tree-id="${CSS.escape(entry.node.id)}"]`
            )
            ?.focus()
        )
      },
      [flat]
    )

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event)
      if (event.defaultPrevented) return

      const currentIndex = flat.findIndex(
        (entry) => entry.node.id === activeFocusedId
      )
      const current = flat[currentIndex]
      if (!current) return
      if (event.key === "ArrowDown") {
        event.preventDefault()
        focusAt(currentIndex + 1)
        return
      }
      if (event.key === "ArrowUp") {
        event.preventDefault()
        focusAt(currentIndex - 1)
        return
      }
      if (event.key === "Home") {
        event.preventDefault()
        focusAt(0)
        return
      }
      if (event.key === "End") {
        event.preventDefault()
        focusAt(flat.length - 1)
        return
      }
      if (event.key === "ArrowRight") {
        event.preventDefault()
        if (
          current.node.children?.length &&
          !expanded.includes(current.node.id)
        )
          toggleExpanded(current.node.id, true)
        else if (flat[currentIndex + 1]?.parentId === current.node.id)
          focusAt(currentIndex + 1)
        return
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        if (current.node.children?.length && expanded.includes(current.node.id))
          toggleExpanded(current.node.id, false)
        else if (current.parentId)
          focusAt(flat.findIndex((entry) => entry.node.id === current.parentId))
        return
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        if (!current.node.disabled)
          select(current.node.id, event.metaKey || event.ctrlKey)
        return
      }
      if (
        event.key.length === 1 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        typeahead.current += event.key.toLocaleLowerCase()
        if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current)
        typeaheadTimer.current = setTimeout(() => {
          typeahead.current = ""
        }, 500)
        const ordered = [
          ...flat.slice(currentIndex + 1),
          ...flat.slice(0, currentIndex + 1),
        ]
        const match = ordered.find((entry) =>
          entry.node.label.toLocaleLowerCase().startsWith(typeahead.current)
        )
        if (match) focusAt(flat.indexOf(match))
      }
    }

    if (!items.length)
      return (
        <div
          ref={mergedRef}
          data-slot="tree-view-empty"
          className={cn(
            "rounded-lg border p-6 text-center text-sm text-muted-foreground",
            className
          )}
          {...props}
        >
          {emptyMessage}
        </div>
      )

    return (
      <div
        ref={mergedRef}
        role="tree"
        aria-multiselectable={multiple || undefined}
        data-slot="tree-view"
        className={cn("flex flex-col rounded-lg border p-1", className)}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {flat.map(({ node, level, position, setSize }) => {
          const branch = Boolean(node.children?.length)
          const open = expanded.includes(node.id)
          const isSelected = selected.includes(node.id)
          return (
            <button
              key={node.id}
              type="button"
              role="treeitem"
              data-tree-id={node.id}
              data-slot="tree-view-item"
              data-state={isSelected ? "selected" : "unselected"}
              aria-level={level}
              aria-posinset={position}
              aria-setsize={setSize}
              aria-expanded={branch ? open : undefined}
              aria-selected={isSelected}
              aria-disabled={node.disabled || undefined}
              tabIndex={activeFocusedId === node.id ? 0 : -1}
              disabled={node.disabled}
              draggable={draggable && !node.disabled}
              className="flex h-8 w-full items-center gap-1.5 rounded-md pe-2 text-start text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=selected]:bg-accent data-[state=selected]:text-accent-foreground"
              style={{
                paddingInlineStart: `calc(${level - 1} * 1rem + 0.375rem)`,
              }}
              onFocus={() => setFocusedId(node.id)}
              onClick={(event) =>
                select(node.id, event.metaKey || event.ctrlKey)
              }
              onDoubleClick={() => {
                if (branch) toggleExpanded(node.id)
              }}
              onDragStart={(event) => {
                setDraggedId(node.id)
                event.dataTransfer.effectAllowed = "move"
                event.dataTransfer.setData("text/plain", node.id)
              }}
              onDragOver={(event) => {
                if (draggable && draggedId && draggedId !== node.id) {
                  event.preventDefault()
                  event.dataTransfer.dropEffect = "move"
                }
              }}
              onDrop={(event) => {
                event.preventDefault()
                const sourceId =
                  draggedId ?? event.dataTransfer.getData("text/plain")
                if (sourceId && sourceId !== node.id)
                  onMove?.({ sourceId, targetId: node.id, position: "inside" })
                setDraggedId(undefined)
              }}
              onDragEnd={() => setDraggedId(undefined)}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-5 items-center justify-center",
                  !branch && "invisible"
                )}
                onClick={(event) => {
                  event.stopPropagation()
                  if (branch) toggleExpanded(node.id)
                }}
              >
                <ChevronRightIcon
                  className={cn(
                    "size-4 transition-transform rtl:rotate-180",
                    open && "rotate-90 rtl:rotate-90"
                  )}
                />
              </span>
              <span className="text-muted-foreground">
                {node.icon ??
                  (branch ? (
                    open ? (
                      <FolderOpenIcon className="size-4" />
                    ) : (
                      <FolderIcon className="size-4" />
                    )
                  ) : (
                    <FileIcon className="size-4" />
                  ))}
              </span>
              <span className="truncate">{renderLabel(node)}</span>
            </button>
          )
        })}
      </div>
    )
  }
)
TreeView.displayName = "TreeView"

function flattenTree(
  items: TreeViewNode[],
  expanded: Set<string>,
  level = 1,
  parentId?: string
): FlatTreeNode[] {
  const result: FlatTreeNode[] = []
  items.forEach((node, index) => {
    result.push({
      node,
      level,
      parentId,
      position: index + 1,
      setSize: items.length,
    })
    if (node.children?.length && expanded.has(node.id))
      result.push(...flattenTree(node.children, expanded, level + 1, node.id))
  })
  return result
}

export { TreeView, type TreeViewNode, type TreeViewProps }
