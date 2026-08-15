import * as React from "react"
import type { Schema } from "hast-util-sanitize"
import rehypeRaw from "rehype-raw"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import ReactMarkdown, {
  defaultUrlTransform,
  type Components,
  type ExtraProps,
  type UrlTransform,
} from "react-markdown"
import remarkGfm from "remark-gfm"
import type { PluggableList } from "unified"

import {
  CodeBlock,
  type CodeBlockLanguage,
} from "@aq-ui/registry/components/code-block"
import { cn } from "@aq-ui/registry/lib/utils"

interface MarkdownRendererProps extends Omit<
  React.ComponentProps<"div">,
  "children"
> {
  value: string
  components?: Components
  allowHtml?: boolean
  sanitizeSchema?: Schema
  remarkPlugins?: PluggableList
  rehypePlugins?: PluggableList
}

function textContent(value: React.ReactNode): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value)
  }
  if (Array.isArray(value)) return value.map(textContent).join("")
  if (React.isValidElement<{ children?: React.ReactNode }>(value)) {
    return textContent(value.props.children)
  }
  return ""
}

function slugifyHeading(value: string) {
  const normalized = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
  return normalized || "section"
}

function headingId(
  children: React.ReactNode,
  node?: { position?: { start: { line: number } } | undefined }
) {
  const line = node?.position?.start.line
  return `aq-md-${slugifyHeading(textContent(children))}${line ? `-${line}` : ""}`
}

const safeMarkdownUrl: UrlTransform = (url, key) => {
  const transformed = defaultUrlTransform(url)
  if (!transformed) return ""

  // A second explicit check protects custom sanitizer schemas from enabling
  // executable URL schemes.
  if (/^[a-z][a-z\d+.-]*:/iu.test(transformed)) {
    const protocol = transformed
      .slice(0, transformed.indexOf(":"))
      .toLowerCase()
    const allowed =
      key === "src"
        ? ["http", "https"]
        : ["http", "https", "mailto", "irc", "ircs", "xmpp"]
    if (!allowed.includes(protocol)) return ""
  }

  return transformed
}

type MarkdownElementProps<Tag extends keyof React.JSX.IntrinsicElements> =
  React.ComponentPropsWithoutRef<Tag> & ExtraProps

const markdownComponents: Components = {
  h1: ({ children, node, className, ...props }: MarkdownElementProps<"h1">) => (
    <h1
      id={headingId(children, node)}
      className={cn(
        "mt-8 scroll-m-20 text-3xl font-bold tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, node, className, ...props }: MarkdownElementProps<"h2">) => (
    <h2
      id={headingId(children, node)}
      className={cn(
        "mt-8 scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, node, className, ...props }: MarkdownElementProps<"h3">) => (
    <h3
      id={headingId(children, node)}
      className={cn(
        "mt-6 scroll-m-20 text-xl font-semibold tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, node, className, ...props }: MarkdownElementProps<"h4">) => (
    <h4
      id={headingId(children, node)}
      className={cn("mt-6 scroll-m-20 text-lg font-semibold", className)}
      {...props}
    >
      {children}
    </h4>
  ),
  h5: ({ children, node, className, ...props }: MarkdownElementProps<"h5">) => (
    <h5
      id={headingId(children, node)}
      className={cn("mt-5 scroll-m-20 font-semibold", className)}
      {...props}
    >
      {children}
    </h5>
  ),
  h6: ({ children, node, className, ...props }: MarkdownElementProps<"h6">) => (
    <h6
      id={headingId(children, node)}
      className={cn("mt-5 scroll-m-20 text-sm font-semibold", className)}
      {...props}
    >
      {children}
    </h6>
  ),
  p: ({ className, node, ...props }: MarkdownElementProps<"p">) => (
    <p
      data-source-line={node?.position?.start.line}
      className={cn("my-4 leading-7", className)}
      {...props}
    />
  ),
  a: ({ href = "", className, node, ...props }: MarkdownElementProps<"a">) => {
    const external = /^(?:https?:)?\/\//iu.test(href)
    return (
      <a
        href={href}
        data-source-line={node?.position?.start.line}
        className={cn(
          "font-medium text-primary underline underline-offset-4",
          className
        )}
        rel={external ? "noopener noreferrer" : undefined}
        target={external ? "_blank" : undefined}
        {...props}
      />
    )
  },
  blockquote: ({
    className,
    node,
    ...props
  }: MarkdownElementProps<"blockquote">) => (
    <blockquote
      data-source-line={node?.position?.start.line}
      className={cn(
        "my-6 border-s-4 ps-4 text-muted-foreground italic",
        className
      )}
      {...props}
    />
  ),
  ul: ({ className, node, ...props }: MarkdownElementProps<"ul">) => (
    <ul
      data-source-line={node?.position?.start.line}
      className={cn("my-4 ms-6 list-disc space-y-2", className)}
      {...props}
    />
  ),
  ol: ({ className, node, ...props }: MarkdownElementProps<"ol">) => (
    <ol
      data-source-line={node?.position?.start.line}
      className={cn("my-4 ms-6 list-decimal space-y-2", className)}
      {...props}
    />
  ),
  li: ({ className, node, ...props }: MarkdownElementProps<"li">) => (
    <li
      data-source-line={node?.position?.start.line}
      className={cn("ps-1", className)}
      {...props}
    />
  ),
  table: ({ className, node, ...props }: MarkdownElementProps<"table">) => (
    <div className="my-6 w-full overflow-x-auto">
      <table
        data-source-line={node?.position?.start.line}
        className={cn("w-full border-collapse text-sm", className)}
        {...props}
      />
    </div>
  ),
  th: ({ className, node, ...props }: MarkdownElementProps<"th">) => (
    <th
      data-source-line={node?.position?.start.line}
      className={cn(
        "border bg-muted/50 px-3 py-2 text-start font-semibold",
        className
      )}
      {...props}
    />
  ),
  td: ({ className, node, ...props }: MarkdownElementProps<"td">) => (
    <td
      data-source-line={node?.position?.start.line}
      className={cn("border px-3 py-2 align-top", className)}
      {...props}
    />
  ),
  hr: ({ className, node, ...props }: MarkdownElementProps<"hr">) => (
    <hr
      data-source-line={node?.position?.start.line}
      className={cn("my-8 border-border", className)}
      {...props}
    />
  ),
  img: ({
    className,
    alt = "",
    node,
    ...props
  }: MarkdownElementProps<"img">) => (
    <img
      alt={alt}
      data-source-line={node?.position?.start.line}
      loading="lazy"
      className={cn("my-6 h-auto max-w-full rounded-lg border", className)}
      {...props}
    />
  ),
  code: ({ className, node, ...props }: MarkdownElementProps<"code">) => (
    <code
      data-source-line={node?.position?.start.line}
      className={cn(
        "rounded bg-muted px-1.5 py-0.5 font-mono text-[0.875em]",
        className
      )}
      {...props}
    />
  ),
  pre: ({ children }: MarkdownElementProps<"pre">) => {
    if (
      !React.isValidElement<{ children?: React.ReactNode; className?: string }>(
        children
      )
    ) {
      return <pre>{children}</pre>
    }
    const raw = textContent(children.props.children).replace(/\n$/u, "")
    const match = /language-([\w-]+)/u.exec(children.props.className ?? "")
    return (
      <CodeBlock
        code={raw}
        language={(match?.[1] ?? "plaintext") as CodeBlockLanguage}
        copyButton
      />
    )
  },
  input: ({ className, node, ...props }: MarkdownElementProps<"input">) => (
    <input
      {...props}
      data-source-line={node?.position?.start.line}
      aria-label={
        props["aria-label"] ??
        (props.type === "checkbox"
          ? props.checked
            ? "Completed task"
            : "Incomplete task"
          : undefined)
      }
      className={cn("me-2 size-4 accent-primary", className)}
      disabled={props.type === "checkbox" ? true : props.disabled}
    />
  ),
}

function MarkdownRendererComponent({
  value,
  components,
  allowHtml = false,
  sanitizeSchema = defaultSchema,
  remarkPlugins = [],
  rehypePlugins = [],
  className,
  ...props
}: MarkdownRendererProps) {
  const safeRehypePlugins: PluggableList = [
    ...(allowHtml ? [rehypeRaw] : []),
    ...rehypePlugins,
    [rehypeSanitize, sanitizeSchema],
  ]

  return (
    <div
      data-slot="markdown-renderer"
      className={cn(
        "min-w-0 text-sm text-foreground [&>:first-child]:mt-0 [&>:last-child]:mb-0",
        className
      )}
      {...props}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, ...remarkPlugins]}
        rehypePlugins={safeRehypePlugins}
        skipHtml={!allowHtml}
        urlTransform={safeMarkdownUrl}
        remarkRehypeOptions={{ clobberPrefix: "aq-md-" }}
        components={{ ...markdownComponents, ...components }}
      >
        {value}
      </ReactMarkdown>
    </div>
  )
}

const MarkdownRenderer = React.memo(MarkdownRendererComponent)
MarkdownRenderer.displayName = "MarkdownRenderer"

export { MarkdownRenderer, markdownComponents, safeMarkdownUrl }
export type { MarkdownRendererProps }
