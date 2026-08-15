import * as React from "react"

import { CodeBlockCopyButton } from "@aq-ui/registry/components/code-block-copy-button"
import {
  highlightCodeLines,
  normalizeHighlightLanguage,
  type CodeBlockLanguage,
} from "@aq-ui/registry/lib/code-highlighter"
import { cn } from "@aq-ui/registry/lib/utils"

type CodeBlockDiff = "none" | "added" | "removed" | "mixed"

interface CodeBlockProps extends Omit<
  React.ComponentProps<"figure">,
  "children"
> {
  code: string
  language?: CodeBlockLanguage
  filename?: string
  lineNumbers?: boolean
  wrapLines?: boolean
  highlightedLines?: readonly number[]
  diff?: CodeBlockDiff
  copyButton?: boolean
  maxHeight?: string | number
  onCopyError?: (error: Error) => void
}

function CodeBlock({
  code,
  language = "plaintext",
  filename,
  lineNumbers = false,
  wrapLines = false,
  highlightedLines: emphasizedLines = [],
  diff = "none",
  copyButton = true,
  maxHeight,
  onCopyError,
  className,
  style,
  ...props
}: CodeBlockProps) {
  const lines = highlightCodeLines(code, language)
  const emphasized = new Set(emphasizedLines)

  return (
    <figure
      data-slot="code-block"
      data-language={language}
      data-diff={diff}
      className={cn(
        "group/code-block relative my-4 flex flex-col overflow-hidden rounded-lg border bg-muted/35 text-sm text-foreground shadow-xs",
        className
      )}
      style={{ maxHeight, ...style }}
      {...props}
    >
      {filename || copyButton ? (
        <figcaption
          data-slot="code-block-header"
          className="sticky top-0 z-10 flex min-h-9 items-center border-b bg-muted/85 px-3 text-xs text-muted-foreground backdrop-blur"
        >
          <span className="min-w-0 flex-1 truncate font-medium">
            {filename ?? language}
          </span>
          {copyButton ? (
            <CodeBlockCopyButton value={code} onCopyError={onCopyError} />
          ) : null}
        </figcaption>
      ) : null}
      <pre
        data-slot="code-block-pre"
        className={cn(
          "m-0 overflow-auto py-3 text-[0.8125rem] leading-6 [tab-size:2]",
          maxHeight !== undefined && "min-h-0 flex-1",
          wrapLines ? "break-words whitespace-pre-wrap" : "whitespace-pre"
        )}
      >
        <code
          className={cn(
            "block min-w-max font-mono",
            wrapLines && "min-w-0",
            "[&_.hljs-attr]:text-chart-1 [&_.hljs-attribute]:text-chart-1 [&_.hljs-built_in]:text-chart-3 [&_.hljs-comment]:text-muted-foreground [&_.hljs-function]:text-chart-2 [&_.hljs-keyword]:text-primary [&_.hljs-literal]:text-chart-3 [&_.hljs-number]:text-chart-4 [&_.hljs-operator]:text-foreground [&_.hljs-property]:text-chart-1 [&_.hljs-punctuation]:text-muted-foreground [&_.hljs-string]:text-chart-2 [&_.hljs-symbol]:text-chart-4 [&_.hljs-title]:text-chart-1 [&_.hljs-type]:text-chart-3 [&_.hljs-variable]:text-chart-5"
          )}
        >
          <span className="sr-only select-none">{code}</span>
          {lines.map((tokens, index) => {
            const lineNumber = index + 1
            const source = tokens.map((token) => token.text).join("")
            const lineDiff =
              diff === "mixed"
                ? source.startsWith("+")
                  ? "added"
                  : source.startsWith("-")
                    ? "removed"
                    : "none"
                : diff

            return (
              <span
                key={lineNumber}
                aria-hidden="true"
                data-slot="code-block-line"
                data-highlighted={emphasized.has(lineNumber) ? "" : undefined}
                data-diff={lineDiff === "none" ? undefined : lineDiff}
                className={cn(
                  "grid min-h-6 grid-cols-[auto_1fr] border-s-2 border-s-transparent px-3",
                  lineNumbers ? "gap-4" : "grid-cols-1",
                  emphasized.has(lineNumber) &&
                    "border-s-primary bg-primary/10",
                  lineDiff === "added" &&
                    "border-s-emerald-500 bg-emerald-500/10",
                  lineDiff === "removed" &&
                    "border-s-destructive bg-destructive/10"
                )}
              >
                {lineNumbers ? (
                  <span
                    aria-hidden="true"
                    className="min-w-[2ch] text-end text-muted-foreground select-none"
                  >
                    {lineNumber}
                  </span>
                ) : null}
                <span className="min-w-0">
                  {tokens.length > 0
                    ? tokens.map((token, tokenIndex) => (
                        <span key={tokenIndex} className={token.className}>
                          {token.text}
                        </span>
                      ))
                    : "\u200b"}
                </span>
              </span>
            )
          })}
        </code>
      </pre>
    </figure>
  )
}

export { CodeBlock, normalizeHighlightLanguage }
export type { CodeBlockDiff, CodeBlockLanguage, CodeBlockProps }
