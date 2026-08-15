"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"

import { Button } from "@aq-ui/registry/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@aq-ui/registry/components/table"
import { cn } from "@aq-ui/registry/lib/utils"

interface DataTableProps<TData, TValue> extends Omit<
  React.ComponentPropsWithoutRef<"div">,
  "children"
> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  emptyMessage?: React.ReactNode
  pageSize?: number
  enablePagination?: boolean
  enableRowSelection?: boolean
  className?: string
  toolbar?: (table: ReturnType<typeof useReactTable<TData>>) => React.ReactNode
  getRowId?: (row: TData, index: number) => string
  onRowSelectionChange?: (selection: RowSelectionState) => void
}

function DataTableInner<TData, TValue>(
  {
    columns,
    data,
    emptyMessage = "No results.",
    pageSize = 10,
    enablePagination = true,
    enableRowSelection = false,
    className,
    toolbar,
    getRowId,
    onRowSelectionChange,
    ...props
  }: DataTableProps<TData, TValue>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  })

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
      rowSelection,
      pagination,
    },
    enableRowSelection,
    getRowId,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
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
    getPaginationRowModel: enablePagination
      ? getPaginationRowModel()
      : undefined,
  })

  return (
    <div
      ref={ref}
      data-slot="data-table"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    >
      {toolbar?.(table)}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {enablePagination ? (
        <div
          data-slot="data-table-pagination"
          className="flex items-center justify-between gap-3"
        >
          <p className="text-sm text-muted-foreground">
            {enableRowSelection
              ? `${table.getFilteredSelectedRowModel().rows.length} of ${table.getFilteredRowModel().rows.length} selected`
              : `${table.getFilteredRowModel().rows.length} row(s)`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <span className="text-sm tabular-nums">
              {table.getState().pagination.pageIndex + 1} /{" "}
              {Math.max(table.getPageCount(), 1)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

type DataTableComponent = <TData, TValue>(
  props: DataTableProps<TData, TValue> & React.RefAttributes<HTMLDivElement>
) => React.ReactElement

const DataTableForwardRef = React.forwardRef(DataTableInner)
DataTableForwardRef.displayName = "DataTable"
const DataTable = DataTableForwardRef as DataTableComponent

export { DataTable, type DataTableProps }
