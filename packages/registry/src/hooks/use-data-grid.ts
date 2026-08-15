"use client"

import * as React from "react"
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnPinningState,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type Table,
  type TableMeta,
  type Updater,
  type VisibilityState,
} from "@tanstack/react-table"

import { useControllableState } from "@aq-ui/registry/hooks/use-controllable-state"

const EMPTY_SORTING: SortingState = []
const EMPTY_FILTERS: ColumnFiltersState = []
const EMPTY_VISIBILITY: VisibilityState = {}
const EMPTY_PINNING: ColumnPinningState = {}
const EMPTY_SELECTION: RowSelectionState = {}
const DEFAULT_PAGINATION: PaginationState = { pageIndex: 0, pageSize: 10 }

export interface UseDataGridOptions<TData, TValue = unknown> {
  data: TData[]
  columns: ColumnDef<TData, TValue>[]
  sorting?: SortingState
  defaultSorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  columnFilters?: ColumnFiltersState
  defaultColumnFilters?: ColumnFiltersState
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void
  columnVisibility?: VisibilityState
  defaultColumnVisibility?: VisibilityState
  onColumnVisibilityChange?: (visibility: VisibilityState) => void
  columnPinning?: ColumnPinningState
  defaultColumnPinning?: ColumnPinningState
  onColumnPinningChange?: (pinning: ColumnPinningState) => void
  rowSelection?: RowSelectionState
  defaultRowSelection?: RowSelectionState
  onRowSelectionChange?: (selection: RowSelectionState) => void
  pagination?: PaginationState
  defaultPagination?: PaginationState
  onPaginationChange?: (pagination: PaginationState) => void
  globalFilter?: unknown
  defaultGlobalFilter?: unknown
  onGlobalFilterChange?: (filter: unknown) => void
  enableRowSelection?: boolean | ((row: Row<TData>) => boolean)
  enableMultiRowSelection?: boolean | ((row: Row<TData>) => boolean)
  getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string
  manualFiltering?: boolean
  manualSorting?: boolean
  manualPagination?: boolean
  pageCount?: number
  rowCount?: number
  meta?: TableMeta<TData>
}

export interface DataGridController<TData> {
  table: Table<TData>
  sorting: SortingState
  setSorting: (updater: Updater<SortingState>) => void
  columnFilters: ColumnFiltersState
  setColumnFilters: (updater: Updater<ColumnFiltersState>) => void
  columnVisibility: VisibilityState
  setColumnVisibility: (updater: Updater<VisibilityState>) => void
  columnPinning: ColumnPinningState
  setColumnPinning: (updater: Updater<ColumnPinningState>) => void
  rowSelection: RowSelectionState
  setRowSelection: (updater: Updater<RowSelectionState>) => void
  pagination: PaginationState
  setPagination: (updater: Updater<PaginationState>) => void
  globalFilter: unknown
  setGlobalFilter: (updater: Updater<unknown>) => void
  reset: () => void
}

export function useDataGrid<TData, TValue = unknown>({
  data,
  columns,
  sorting: sortingProp,
  defaultSorting = EMPTY_SORTING,
  onSortingChange,
  columnFilters: columnFiltersProp,
  defaultColumnFilters = EMPTY_FILTERS,
  onColumnFiltersChange,
  columnVisibility: columnVisibilityProp,
  defaultColumnVisibility = EMPTY_VISIBILITY,
  onColumnVisibilityChange,
  columnPinning: columnPinningProp,
  defaultColumnPinning = EMPTY_PINNING,
  onColumnPinningChange,
  rowSelection: rowSelectionProp,
  defaultRowSelection = EMPTY_SELECTION,
  onRowSelectionChange,
  pagination: paginationProp,
  defaultPagination = DEFAULT_PAGINATION,
  onPaginationChange,
  globalFilter: globalFilterProp,
  defaultGlobalFilter,
  onGlobalFilterChange,
  enableRowSelection,
  enableMultiRowSelection,
  getRowId,
  manualFiltering = false,
  manualSorting = false,
  manualPagination = false,
  pageCount,
  rowCount,
  meta,
}: UseDataGridOptions<TData, TValue>): DataGridController<TData> {
  const [sorting, setSorting] = useControllableState({
    value: sortingProp,
    defaultValue: defaultSorting,
    onChange: onSortingChange,
  })
  const [columnFilters, setColumnFilters] = useControllableState({
    value: columnFiltersProp,
    defaultValue: defaultColumnFilters,
    onChange: onColumnFiltersChange,
  })
  const [columnVisibility, setColumnVisibility] = useControllableState({
    value: columnVisibilityProp,
    defaultValue: defaultColumnVisibility,
    onChange: onColumnVisibilityChange,
  })
  const [columnPinning, setColumnPinning] = useControllableState({
    value: columnPinningProp,
    defaultValue: defaultColumnPinning,
    onChange: onColumnPinningChange,
  })
  const [rowSelection, setRowSelection] = useControllableState({
    value: rowSelectionProp,
    defaultValue: defaultRowSelection,
    onChange: onRowSelectionChange,
  })
  const [pagination, setPagination] = useControllableState({
    value: paginationProp,
    defaultValue: defaultPagination,
    onChange: onPaginationChange,
  })
  const [globalFilter, setGlobalFilter] = useControllableState<unknown>({
    value: globalFilterProp,
    defaultValue: defaultGlobalFilter,
    onChange: onGlobalFilterChange,
  })

  // TanStack Table intentionally exposes mutable callback-backed table methods.
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
      pagination,
      globalFilter,
    },
    enableRowSelection,
    enableMultiRowSelection,
    getRowId,
    manualFiltering,
    manualSorting,
    manualPagination,
    pageCount,
    rowCount,
    meta,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: manualFiltering ? undefined : getFilteredRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    getPaginationRowModel: manualPagination
      ? undefined
      : getPaginationRowModel(),
  })

  const reset = React.useCallback(() => {
    setSorting(defaultSorting)
    setColumnFilters(defaultColumnFilters)
    setColumnVisibility(defaultColumnVisibility)
    setColumnPinning(defaultColumnPinning)
    setRowSelection(defaultRowSelection)
    setPagination(defaultPagination)
    setGlobalFilter(defaultGlobalFilter)
  }, [
    defaultColumnFilters,
    defaultColumnPinning,
    defaultColumnVisibility,
    defaultGlobalFilter,
    defaultPagination,
    defaultRowSelection,
    defaultSorting,
    setColumnFilters,
    setColumnPinning,
    setColumnVisibility,
    setGlobalFilter,
    setPagination,
    setRowSelection,
    setSorting,
  ])

  return {
    table,
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
    columnPinning,
    setColumnPinning,
    rowSelection,
    setRowSelection,
    pagination,
    setPagination,
    globalFilter,
    setGlobalFilter,
    reset,
  }
}
