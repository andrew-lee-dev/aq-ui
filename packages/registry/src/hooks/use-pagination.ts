"use client"

import * as React from "react"

import { useControllableState } from "@aq-ui/registry/hooks/use-controllable-state"

export type PaginationToken = number | "ellipsis"

export type PaginationItem =
  | { type: "page"; page: number; key: string; selected: boolean }
  | { type: "ellipsis"; key: string }

export interface UsePaginationOptions {
  totalItems: number
  page?: number
  defaultPage?: number
  pageSize?: number
  defaultPageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  siblingCount?: number
  boundaryCount?: number
}

export interface PaginationControls {
  page: number
  pageSize: number
  pageCount: number
  totalItems: number
  startIndex: number
  endIndex: number
  pages: PaginationToken[]
  items: PaginationItem[]
  canPrevious: boolean
  canNext: boolean
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  first: () => void
  previous: () => void
  next: () => void
  last: () => void
}

function integer(value: number, minimum: number) {
  return Math.max(minimum, Math.floor(Number.isFinite(value) ? value : minimum))
}

function range(start: number, end: number) {
  return Array.from(
    { length: Math.max(0, end - start + 1) },
    (_, index) => start + index
  )
}

export function createPaginationRange(
  page: number,
  pageCount: number,
  siblingCount = 1,
  boundaryCount = 1
): PaginationToken[] {
  if (pageCount <= 0) return []
  const siblings = integer(siblingCount, 0)
  const boundaries = integer(boundaryCount, 0)
  const totalSlots = boundaries * 2 + siblings * 2 + 3

  if (pageCount <= totalSlots) return range(1, pageCount)

  const startPages = range(1, Math.min(boundaries, pageCount))
  const endPages = range(
    Math.max(pageCount - boundaries + 1, boundaries + 1),
    pageCount
  )
  const siblingsStart = Math.max(
    Math.min(page - siblings, pageCount - boundaries - siblings * 2 - 1),
    boundaries + 2
  )
  const siblingsEnd = Math.min(
    Math.max(page + siblings, boundaries + siblings * 2 + 2),
    endPages[0] ? endPages[0] - 2 : pageCount - 1
  )

  return [
    ...startPages,
    ...(siblingsStart > boundaries + 2
      ? (["ellipsis"] as const)
      : boundaries + 1 < pageCount - boundaries
        ? [boundaries + 1]
        : []),
    ...range(siblingsStart, siblingsEnd),
    ...(siblingsEnd < pageCount - boundaries - 1
      ? (["ellipsis"] as const)
      : pageCount - boundaries > boundaries
        ? [pageCount - boundaries]
        : []),
    ...endPages,
  ]
}

export function usePagination({
  totalItems,
  page,
  defaultPage = 1,
  pageSize,
  defaultPageSize = 10,
  onPageChange,
  onPageSizeChange,
  siblingCount = 1,
  boundaryCount = 1,
}: UsePaginationOptions): PaginationControls {
  const normalizedTotal = integer(totalItems, 0)
  const [currentPageSize, setCurrentPageSize] = useControllableState({
    value: pageSize,
    defaultValue: integer(defaultPageSize, 1),
    onChange: onPageSizeChange,
  })
  const normalizedPageSize = integer(currentPageSize, 1)
  const pageCount = Math.ceil(normalizedTotal / normalizedPageSize)
  const [requestedPage, setRequestedPage] = useControllableState({
    value: page,
    defaultValue: integer(defaultPage, 1),
    onChange: onPageChange,
  })
  const currentPage =
    pageCount === 0
      ? 1
      : Math.min(Math.max(1, integer(requestedPage, 1)), pageCount)

  const setPage = React.useCallback(
    (nextPage: number) => {
      const maximum = Math.max(1, pageCount)
      setRequestedPage(Math.min(Math.max(1, integer(nextPage, 1)), maximum))
    },
    [pageCount, setRequestedPage]
  )

  const updatePageSize = React.useCallback(
    (nextPageSize: number) => {
      const normalized = integer(nextPageSize, 1)
      const firstVisibleItem = (currentPage - 1) * normalizedPageSize
      setCurrentPageSize(normalized)
      setRequestedPage(Math.floor(firstVisibleItem / normalized) + 1)
    },
    [currentPage, normalizedPageSize, setCurrentPageSize, setRequestedPage]
  )

  const pages = React.useMemo(
    () =>
      createPaginationRange(
        currentPage,
        pageCount,
        siblingCount,
        boundaryCount
      ),
    [boundaryCount, currentPage, pageCount, siblingCount]
  )

  const items = React.useMemo<PaginationItem[]>(() => {
    return pages.map((token, index) => {
      if (token === "ellipsis") {
        return { type: "ellipsis", key: "ellipsis-" + index }
      }
      return {
        type: "page",
        page: token,
        key: "page-" + token,
        selected: token === currentPage,
      }
    })
  }, [currentPage, pages])

  const startIndex =
    normalizedTotal === 0 ? 0 : (currentPage - 1) * normalizedPageSize + 1
  const endIndex = Math.min(normalizedTotal, currentPage * normalizedPageSize)

  return {
    page: currentPage,
    pageSize: normalizedPageSize,
    pageCount,
    totalItems: normalizedTotal,
    startIndex,
    endIndex,
    pages,
    items,
    canPrevious: currentPage > 1,
    canNext: currentPage < pageCount,
    setPage,
    setPageSize: updatePageSize,
    first: () => setPage(1),
    previous: () => setPage(currentPage - 1),
    next: () => setPage(currentPage + 1),
    last: () => setPage(pageCount),
  }
}
