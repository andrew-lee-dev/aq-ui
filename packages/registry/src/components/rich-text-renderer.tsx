import * as React from "react"

import {
  CodeBlock,
  type CodeBlockLanguage,
} from "@aq-ui/registry/components/code-block"
import { cn } from "@aq-ui/registry/lib/utils"

interface RichTextMark {
  type: string
  attrs?: Record<string, unknown>
}

interface RichTextNode {
  type?: string
  attrs?: Record<string, unknown>
  content?: RichTextNode[]
  marks?: RichTextMark[]
  text?: string
}

type RichTextDocument = RichTextNode

interface RichTextNodeRendererContext {
  key: React.Key
  children: React.ReactNode
}

type RichTextNodeRenderer = (
  node: RichTextNode,
  context: RichTextNodeRendererContext
) => React.ReactNode

interface RichTextRendererProps extends Omit<
  React.ComponentProps<"div">,
  "children"
> {
  value: RichTextDocument
  renderers?: Record<string, RichTextNodeRenderer>
  unknownNodeFallback?: "children" | "omit"
}

function safeRichTextAssetUrl(value: string) {
  const url = value.trim()
  if (url.startsWith("/") && !url.startsWith("//")) return url

  try {
    const parsed = new URL(url)
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? url
      : null
  } catch {
    return null
  }
}

function safeRichTextLinkUrl(value: string) {
  const url = value.trim()
  if (
    url.startsWith("#") ||
    (url.startsWith("/") && !url.startsWith("//")) ||
    url.startsWith("./") ||
    url.startsWith("../")
  ) {
    return url
  }

  try {
    const parsed = new URL(url)
    return ["https:", "http:", "mailto:"].includes(parsed.protocol) ? url : null
  } catch {
    return null
  }
}

function applyRichTextMarks(
  value: React.ReactNode,
  marks: RichTextNode["marks"],
  key: React.Key
) {
  return (marks ?? []).reduce<React.ReactNode>((content, mark, index) => {
    const markKey = `${String(key)}-mark-${index}`

    switch (mark.type) {
      case "bold":
        return <strong key={markKey}>{content}</strong>
      case "italic":
        return <em key={markKey}>{content}</em>
      case "strike":
        return <s key={markKey}>{content}</s>
      case "underline":
        return <u key={markKey}>{content}</u>
      case "code":
        return (
          <code
            key={markKey}
            className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.875em]"
          >
            {content}
          </code>
        )
      case "highlight": {
        const color =
          typeof mark.attrs?.color === "string" ? mark.attrs.color : undefined
        return (
          <mark
            key={markKey}
            style={color ? { backgroundColor: color } : undefined}
          >
            {content}
          </mark>
        )
      }
      case "link": {
        const href = safeRichTextLinkUrl(String(mark.attrs?.href ?? ""))
        if (!href) return content
        const target = mark.attrs?.target === "_blank" ? "_blank" : undefined
        return (
          <a
            key={markKey}
            href={href}
            target={target}
            rel={target ? "noopener noreferrer" : undefined}
            className="font-medium text-primary underline underline-offset-4"
          >
            {content}
          </a>
        )
      }
      default:
        return content
    }
  }, value)
}

function renderRichTextNode(
  node: RichTextNode,
  key: React.Key,
  renderers: Record<string, RichTextNodeRenderer>,
  unknownNodeFallback: "children" | "omit"
): React.ReactNode {
  const children = node.content?.map((child, index) =>
    renderRichTextNode(
      child,
      `${String(key)}-${index}`,
      renderers,
      unknownNodeFallback
    )
  )

  if (node.type && renderers[node.type]) {
    return renderers[node.type]?.(node, { key, children })
  }

  switch (node.type) {
    case "doc":
      return <React.Fragment key={key}>{children}</React.Fragment>
    case "text":
      return applyRichTextMarks(node.text ?? "", node.marks, key)
    case "paragraph":
      return (
        <p key={key} className="my-4 min-h-6 leading-7">
          {children}
        </p>
      )
    case "heading": {
      const level = Math.min(6, Math.max(1, Number(node.attrs?.level ?? 2)))
      const Heading = `h${level}` as keyof React.JSX.IntrinsicElements
      return React.createElement(
        Heading,
        {
          key,
          className: cn(
            "mt-7 scroll-m-20 font-semibold tracking-tight",
            level === 1 && "text-3xl",
            level === 2 && "border-b pb-2 text-2xl",
            level === 3 && "text-xl",
            level >= 4 && "text-lg"
          ),
        },
        children
      )
    }
    case "blockquote":
      return (
        <blockquote
          key={key}
          className="my-6 border-s-4 ps-4 text-muted-foreground italic"
        >
          {children}
        </blockquote>
      )
    case "bulletList":
      return (
        <ul key={key} className="my-4 ms-6 list-disc space-y-2">
          {children}
        </ul>
      )
    case "orderedList":
      return (
        <ol key={key} className="my-4 ms-6 list-decimal space-y-2">
          {children}
        </ol>
      )
    case "listItem":
      return <li key={key}>{children}</li>
    case "taskList":
      return (
        <ul key={key} className="my-4 list-none space-y-2 ps-0">
          {children}
        </ul>
      )
    case "taskItem":
      return (
        <li
          key={key}
          className="flex items-start gap-2"
          data-checked={node.attrs?.checked ? "" : undefined}
        >
          <input
            type="checkbox"
            checked={Boolean(node.attrs?.checked)}
            readOnly
            tabIndex={-1}
            aria-hidden="true"
            className="mt-1 size-4 accent-primary"
          />
          <div className="min-w-0 flex-1 [&>p]:my-0">{children}</div>
        </li>
      )
    case "hardBreak":
      return <br key={key} />
    case "horizontalRule":
      return <hr key={key} className="my-8 border-border" />
    case "codeBlock":
      return (
        <CodeBlock
          key={key}
          code={node.content?.map((child) => child.text ?? "").join("") ?? ""}
          language={
            String(node.attrs?.language ?? "plaintext") as CodeBlockLanguage
          }
        />
      )
    case "image": {
      const src = safeRichTextAssetUrl(String(node.attrs?.src ?? ""))
      if (!src) return null
      return (
        <img
          key={key}
          src={src}
          alt={String(node.attrs?.alt ?? "")}
          title={
            typeof node.attrs?.title === "string" ? node.attrs.title : undefined
          }
          loading="lazy"
          className="my-6 h-auto max-w-full rounded-lg border"
        />
      )
    }
    case "attachment": {
      const href = safeRichTextAssetUrl(String(node.attrs?.url ?? ""))
      if (!href) return null
      return (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex max-w-full items-center rounded-md border bg-muted/50 px-2 py-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {String(node.attrs?.name ?? "Attachment")}
        </a>
      )
    }
    case "mention":
      return (
        <span
          key={key}
          data-mention-id={String(node.attrs?.id ?? "")}
          className="rounded bg-primary/10 px-1 py-0.5 font-medium text-primary"
        >
          @{String(node.attrs?.label ?? node.attrs?.id ?? "mention")}
        </span>
      )
    case "table":
      return (
        <div key={key} className="my-6 w-full overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <tbody>{children}</tbody>
          </table>
        </div>
      )
    case "tableRow":
      return <tr key={key}>{children}</tr>
    case "tableHeader":
      return (
        <th
          key={key}
          className="border bg-muted/50 px-3 py-2 text-start font-semibold"
        >
          {children}
        </th>
      )
    case "tableCell":
      return (
        <td key={key} className="border px-3 py-2 align-top">
          {children}
        </td>
      )
    default:
      return unknownNodeFallback === "children" ? (
        <React.Fragment key={key}>{children}</React.Fragment>
      ) : null
  }
}

function RichTextRenderer({
  value,
  renderers = {},
  unknownNodeFallback = "children",
  className,
  ...props
}: RichTextRendererProps) {
  return (
    <div
      data-slot="rich-text-renderer"
      className={cn(
        "min-w-0 text-sm text-foreground [&>:first-child]:mt-0 [&>:last-child]:mb-0",
        className
      )}
      {...props}
    >
      {renderRichTextNode(value, "root", renderers, unknownNodeFallback)}
    </div>
  )
}

export { RichTextRenderer, applyRichTextMarks, renderRichTextNode }
export type {
  RichTextDocument,
  RichTextMark,
  RichTextNode,
  RichTextNodeRenderer,
  RichTextNodeRendererContext,
  RichTextRendererProps,
}
