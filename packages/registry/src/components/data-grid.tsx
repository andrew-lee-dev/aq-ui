"use client"

import * as React from "react"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnPinningState,
  type RowSelectionState,
  type SortingState,
  type Table as TanStackTable,
  type VisibilityState,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"

import { Button } from "@aq-ui/registry/components/button"
import { cn } from "@aq-ui/registry/lib/utils"

interface DataGridProps<TData, TValue> extends Omit<
  React.ComponentPropsWithoutRef<"div">,
  "children"
> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  height?: number | string
  estimateRowHeight?: number
  overscan?: number
  emptyMessage?: React.ReactNode
  className?: string
  enableRowSelection?: boolean
  getRowId?: (row: TData, index: number) => string
  toolbar?: (table: TanStackTable<TData>) => React.ReactNode
  onRowSelectionChange?: (selection: RowSelectionState) => void
}

function DataGridInner<TData, TValue>(
  {
    columns,
    data,
    height = 480,
    estimateRowHeight = 40,
    overscan = 8,
    emptyMessage = "No results.",
    className,
    enableRowSelection = false,
    getRowId,
    toolbar,
    onRowSelectionChange,
    ...props
  }: DataGridProps<TData, TValue>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>(
    {}
  )
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  // TanStack Table intentionally returns stateful functions that React Compiler
  // cannot memoize safely.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnPinning,
      rowSelection,
    },
    enableRowSelection,
    getRowId,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    onRowSelectionChange: (updater) => {
      setRowSelection((current) => {
        const next = typeof updater === "function" ? updater(current) : updater
        onRowSelectionChange?.(next)
        return next
      })
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: "onChange",
  })

  const rows = table.getRowModel().rows
  const headerGroups = table.getHeaderGroups()
  const headerRowCount = headerGroups.length
  const visibleColumnCount = table.getVisibleLeafColumns().length
  const ariaRowCount = headerRowCount + Math.max(rows.length, 1)
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateRowHeight,
    overscan,
    initialRect: {
      width: 0,
      height: getInitialGridHeight(height),
    },
  })
  const totalWidth = Math.max(table.getTotalSize(), 1)

  const focusCell = React.useCallback(
    (rowIndex: number, columnIndex: number) => {
      const nextRow = Math.max(0, Math.min(ariaRowCount - 1, rowIndex))
      const nextColumn = Math.max(
        0,
        Math.min(visibleColumnCount - 1, columnIndex)
      )
      const selector = `[data-grid-cell][data-grid-row-index="${nextRow}"][data-grid-column-index="${nextColumn}"]`
      const focus = () => {
        const cell = scrollRef.current?.querySelector<HTMLElement>(selector)
        cell?.focus()
        return Boolean(cell)
      }

      if (focus()) return
      if (nextRow >= headerRowCount && rows.length) {
        virtualizer.scrollToIndex(nextRow - headerRowCount, { align: "auto" })
        requestAnimationFrame(() => requestAnimationFrame(focus))
      }
    },
    [ariaRowCount, headerRowCount, rows.length, virtualizer, visibleColumnCount]
  )

  const handleGridKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const cell = target.closest<HTMLElement>("[data-grid-cell]")
      if (!cell || !scrollRef.current?.contains(cell)) return

      const rowIndex = Number(cell.dataset.gridRowIndex)
      const columnIndex = Number(cell.dataset.gridColumnIndex)
      if (!Number.isInteger(rowIndex) || !Number.isInteger(columnIndex)) return

      let nextRow = rowIndex
      let nextColumn = columnIndex
      switch (event.key) {
        case "ArrowDown":
          nextRow += 1
          break
        case "ArrowUp":
          nextRow -= 1
          break
        case "ArrowRight":
          nextColumn += 1
          break
        case "ArrowLeft":
          nextColumn -= 1
          break
        case "Home":
          nextColumn = 0
          if (event.ctrlKey || event.metaKey) nextRow = 0
          break
        case "End":
          nextColumn = visibleColumnCount - 1
          if (event.ctrlKey || event.metaKey) nextRow = ariaRowCount - 1
          break
        default:
          return
      }

      event.preventDefault()
      focusCell(nextRow, nextColumn)
    },
    [ariaRowCount, focusCell, visibleColumnCount]
  )

  const resizeColumnByKeyboard = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, column: Column<TData>) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      const { min, max } = getColumnResizeBounds(table, column)
      const step = event.shiftKey ? 24 : 8
      const nextSize =
        event.key === "Home"
          ? min
          : event.key === "End"
            ? max
            : column.getSize() + (event.key === "ArrowRight" ? step : -step)

      table.setColumnSizing((current) => ({
        ...current,
        [column.id]: Math.max(min, Math.min(max, nextSize)),
      }))
    },
    [table]
  )

  return (
    <div
      ref={ref}
      data-slot="data-grid"
      className={cn("flex min-w-0 flex-col gap-3", className)}
      {...props}
    >
      {toolbar?.(table)}
      <div
        ref={scrollRef}
        className="relative overflow-auto rounded-lg border"
        style={{ height }}
        role="grid"
        aria-rowcount={ariaRowCount}
        aria-colcount={visibleColumnCount}
        onKeyDown={handleGridKeyDown}
      >
        <div
          className="sticky top-0 z-20 border-b bg-background"
          role="rowgroup"
          style={{ minWidth: totalWidth }}
        >
          {headerGroups.map((headerGroup, headerRowIndex) => (
            <div
              key={headerGroup.id}
              role="row"
              aria-rowindex={headerRowIndex + 1}
              className="flex h-10"
            >
              {headerGroup.headers.map((header, columnIndex) => {
                const pinned = header.column.getIsPinned()
                const sorted = header.column.getIsSorted()
                const { min, max } = getColumnResizeBounds(table, header.column)
                return (
                  <div
                    key={header.id}
                    role="columnheader"
                    aria-colindex={columnIndex + 1}
                    aria-sort={
                      sorted === "asc"
                        ? "ascending"
                        : sorted === "desc"
                          ? "descending"
                          : header.column.getCanSort()
                            ? "none"
                            : undefined
                    }
                    data-grid-cell=""
                    data-grid-row-index={headerRowIndex}
                    data-grid-column-index={columnIndex}
                    tabIndex={
                      headerRowIndex === 0 && columnIndex === 0 ? 0 : -1
                    }
                    onKeyDown={(event) => {
                      if (
                        event.target === event.currentTarget &&
                        header.column.getCanSort() &&
                        (event.key === "Enter" || event.key === " ")
                      ) {
                        event.preventDefault()
                        header.column.toggleSorting()
                      }
                    }}
                    className={cn(
                      "relative flex shrink-0 items-center border-e ps-2 text-sm font-medium last:border-e-0",
                      header.column.getCanResize() ? "pe-6" : "pe-2",
                      pinned && "sticky z-30 bg-background"
                    )}
                    style={{
                      width: header.getSize(),
                      ...getPinnedStyles(header.column),
                    }}
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <Button
                        tabIndex={-1}
                        variant="ghost"
                        size="sm"
                        className="-ms-2 h-8"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {sorted === "asc" ? (
                          <ArrowUpIcon />
                        ) : sorted === "desc" ? (
                          <ArrowDownIcon />
                        ) : (
                          <ArrowUpDownIcon className="opacity-50" />
                        )}
                      </Button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                    {header.column.getCanResize() ? (
                      <button
                        type="button"
                        role="separator"
                        aria-orientation="vertical"
                        aria-label={`Resize ${String(header.column.columnDef.header ?? header.column.id)} column`}
                        aria-valuemin={min}
                        aria-valuemax={max}
                        aria-valuenow={Math.round(header.getSize())}
                        className="group absolute inset-y-0 end-0 z-10 min-h-6 w-6 min-w-6 cursor-col-resize touch-none outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                        data-resizing={
                          header.column.getIsResizing() || undefined
                        }
                        data-grid-resize-handle=""
                        onDoubleClick={() => header.column.resetSize()}
                        onKeyDown={(event) =>
                          resizeColumnByKeyboard(event, header.column)
                        }
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                      >
                        <span
                          aria-hidden="true"
                          data-grid-resize-indicator=""
                          className="pointer-events-none absolute inset-y-0 end-0 w-px bg-border transition-[width,background-color] group-hover:w-0.5 group-hover:bg-primary group-focus-visible:w-0.5 group-focus-visible:bg-primary group-data-[resizing=true]:w-0.5 group-data-[resizing=true]:bg-primary"
                        />
                      </button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        {rows.length ? (
          <div
            role="rowgroup"
            className="relative"
            style={{ height: virtualizer.getTotalSize(), minWidth: totalWidth }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index]
              if (!row) return null
              const gridRowIndex = headerRowCount + virtualRow.index
              return (
                <div
                  key={row.id}
                  ref={virtualizer.measureElement}
                  data-index={virtualRow.index}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  role="row"
                  aria-rowindex={gridRowIndex + 1}
                  className="absolute start-0 top-0 flex w-full border-b bg-background text-sm hover:bg-muted/50 data-[state=selected]:bg-muted"
                  style={{
                    minWidth: totalWidth,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {row.getVisibleCells().map((cell, columnIndex) => {
                    const pinned = cell.column.getIsPinned()
                    return (
                      <div
                        key={cell.id}
                        role="gridcell"
                        aria-colindex={columnIndex + 1}
                        data-grid-cell=""
                        data-grid-row-index={gridRowIndex}
                        data-grid-column-index={columnIndex}
                        tabIndex={-1}
                        className={cn(
                          "flex min-h-10 shrink-0 items-center border-e px-2 last:border-e-0",
                          pinned && "sticky z-10 bg-inherit"
                        )}
                        style={{
                          width: cell.column.getSize(),
                          ...getPinnedStyles(cell.column),
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ) : (
          <div
            className="flex h-24 items-center justify-center text-sm text-muted-foreground"
            role="row"
            aria-rowindex={headerRowCount + 1}
          >
            <span
              role="gridcell"
              aria-colindex={1}
              aria-colspan={visibleColumnCount}
              data-grid-cell=""
              data-grid-row-index={headerRowCount}
              data-grid-column-index={0}
              tabIndex={-1}
            >
              {emptyMessage}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

type DataGridComponent = <TData, TValue>(
  props: DataGridProps<TData, TValue> & React.RefAttributes<HTMLDivElement>
) => React.ReactElement

const DataGridForwardRef = React.forwardRef(DataGridInner)
DataGridForwardRef.displayName = "DataGrid"
const DataGrid = DataGridForwardRef as DataGridComponent

function getInitialGridHeight(height: number | string) {
  if (typeof height === "number") return Math.max(height, 1)
  const parsed = Number.parseFloat(height)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 480
}

function getColumnResizeBounds<TData>(
  table: TanStackTable<TData>,
  column: Column<TData>
) {
  const min =
    column.columnDef.minSize ?? table.options.defaultColumn?.minSize ?? 20
  const configuredMax =
    column.columnDef.maxSize ?? table.options.defaultColumn?.maxSize ?? 1000
  return { min, max: Math.max(min, configuredMax) }
}

function getPinnedStyles<TData>(
  column: Column<TData, unknown>
): React.CSSProperties {
  const pinned = column.getIsPinned()
  return {
    left: pinned === "left" ? column.getStart("left") : undefined,
    right: pinned === "right" ? column.getAfter("right") : undefined,
    boxShadow:
      pinned === "left" && column.getIsLastColumn("left")
        ? "-4px 0 4px -4px var(--border) inset"
        : pinned === "right" && column.getIsFirstColumn("right")
          ? "4px 0 4px -4px var(--border) inset"
          : undefined,
  }
}

export { DataGrid, type DataGridProps }
