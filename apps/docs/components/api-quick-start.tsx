"use client"

import type { ReactNode } from "react"

import { CopyButton } from "@/components/copy-button"

type EncodedHighlight = [classNames: string[], ranges: string]

interface ApiQuickStartProps {
  code: string
  highlight: EncodedHighlight
  title: string
}

function renderHighlightedCode(code: string, highlight: EncodedHighlight) {
  const [classNames, encodedRanges] = highlight
  const children: ReactNode[] = []
  let cursor = 0

  for (const [index, encodedRange] of encodedRanges.split(",").entries()) {
    const [encodedStart, encodedLength, encodedClass] = encodedRange.split(":")
    const start = Number.parseInt(encodedStart ?? "", 36)
    const length = Number.parseInt(encodedLength ?? "", 36)
    const className = classNames[Number.parseInt(encodedClass ?? "", 36)]

    if (!className || !Number.isFinite(start) || !Number.isFinite(length)) {
      continue
    }
    if (start > cursor) children.push(code.slice(cursor, start))
    children.push(
      <span key={index} className={className}>
        {code.slice(start, start + length)}
      </span>
    )
    cursor = start + length
  }

  if (cursor < code.length) children.push(code.slice(cursor))
  return children
}

function ApiQuickStart({ code, highlight, title }: ApiQuickStartProps) {
  const highlightedCode = renderHighlightedCode(code, highlight)

  return (
    <div className="mt-4 overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between border-b px-3 py-1">
        <h3 className="text-sm font-semibold">Quick start</h3>
        <CopyButton
          value={code}
          label="Copy quick start"
          className="p-1 text-xs hover:underline"
        />
      </div>
      <pre
        tabIndex={0}
        aria-label={`${title} quick start. Use arrow keys to scroll.`}
        className="overflow-x-auto p-3 text-sm leading-6"
      >
        <code className="aq-code-highlight block min-w-max font-mono">
          {highlightedCode}
        </code>
      </pre>
    </div>
  )
}

export { ApiQuickStart }
export type { EncodedHighlight }
