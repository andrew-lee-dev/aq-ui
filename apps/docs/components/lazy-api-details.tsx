"use client"

import * as React from "react"

import { ApiEntryCards } from "@/components/api-entry-cards"
import type { RegistryItem } from "@/lib/registry"

const recordRequests = new Map<string, Promise<RegistryItem>>()

function loadRecord(name: string) {
  const cached = recordRequests.get(name)
  if (cached) return cached

  const request = fetch(`../../r/${encodeURIComponent(name)}.json`).then(
    async (response) => {
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}.`)
      }
      return (await response.json()) as RegistryItem
    }
  )
  recordRequests.set(name, request)
  void request.catch(() => recordRequests.delete(name))
  return request
}

function LazyApiDetails({ name }: { name: string }) {
  const [expanded, setExpanded] = React.useState(false)
  const [record, setRecord] = React.useState<RegistryItem>()
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const detailsId = `api-${name}-details`

  const requestDetails = async () => {
    if (record || loading) return
    setError("")
    setLoading(true)
    try {
      setRecord(await loadRecord(name))
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to load API details."
      )
    } finally {
      setLoading(false)
    }
  }

  const toggleDetails = () => {
    if (expanded) {
      setExpanded(false)
      return
    }
    setExpanded(true)
    void requestDetails()
  }

  return (
    <section className="mt-5 min-w-0">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={detailsId}
        className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        onClick={toggleDetails}
      >
        {expanded ? "Hide API details" : "Show API details"}
      </button>
      {expanded ? (
        <div id={detailsId}>
          {record ? (
            <ApiEntryCards item={record} anchorPrefix="api-detail" />
          ) : error ? (
            <div className="mt-3 text-sm">
              <p role="alert">{error}</p>
              <button
                type="button"
                className="mt-2 underline"
                onClick={() => void requestDetails()}
              >
                Retry
              </button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground" role="status">
              Loading API details…
            </p>
          )}
        </div>
      ) : null}
    </section>
  )
}

export { LazyApiDetails }
