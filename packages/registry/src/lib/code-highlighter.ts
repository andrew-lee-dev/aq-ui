import bash from "highlight.js/lib/languages/bash"
import css from "highlight.js/lib/languages/css"
import javascript from "highlight.js/lib/languages/javascript"
import json from "highlight.js/lib/languages/json"
import markdown from "highlight.js/lib/languages/markdown"
import plaintext from "highlight.js/lib/languages/plaintext"
import sql from "highlight.js/lib/languages/sql"
import typescript from "highlight.js/lib/languages/typescript"
import xml from "highlight.js/lib/languages/xml"
import yaml from "highlight.js/lib/languages/yaml"
import { createLowlight } from "lowlight"

type CodeBlockLanguage =
  | "plaintext"
  | "javascript"
  | "typescript"
  | "jsx"
  | "tsx"
  | "json"
  | "html"
  | "css"
  | "markdown"
  | "yaml"
  | "sql"
  | (string & {})

interface HighlightNode {
  type: string
  value?: string
  properties?: { className?: string[] | string }
  children?: HighlightNode[]
}

interface HighlightToken {
  text: string
  className?: string
}

const codeHighlightClassName = "aq-code-highlight"

const codeLowlight = createLowlight()

codeLowlight.register({
  bash,
  css,
  javascript,
  json,
  markdown,
  plaintext,
  sql,
  typescript,
  xml,
  yaml,
})

codeLowlight.registerAlias({
  bash: ["sh", "shell", "zsh"],
  javascript: ["js", "jsx", "mjs", "cjs"],
  plaintext: ["text", "txt"],
  typescript: ["ts", "tsx", "mts", "cts"],
  xml: ["html", "htm"],
  yaml: ["yml"],
})

function normalizeHighlightLanguage(language: CodeBlockLanguage | undefined) {
  const value = (language ?? "plaintext").toLowerCase()
  const aliases: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    ts: "typescript",
    tsx: "typescript",
    mts: "typescript",
    cts: "typescript",
    html: "xml",
    htm: "xml",
    md: "markdown",
    yml: "yaml",
    text: "plaintext",
    txt: "plaintext",
  }
  return aliases[value] ?? value
}

function highlightCodeLines(code: string, language?: CodeBlockLanguage) {
  const normalized = normalizeHighlightLanguage(language)
  let root: HighlightNode

  try {
    root = codeLowlight.highlight(normalized, code) as HighlightNode
  } catch {
    root = { type: "root", children: [{ type: "text", value: code }] }
  }

  const lines: HighlightToken[][] = [[]]

  function appendText(value: string, className?: string) {
    const parts = value.split("\n")
    parts.forEach((part, index) => {
      if (part) lines[lines.length - 1]?.push({ text: part, className })
      if (index < parts.length - 1) lines.push([])
    })
  }

  function walk(node: HighlightNode, inheritedClassName?: string) {
    if (node.type === "text") {
      appendText(node.value ?? "", inheritedClassName)
      return
    }

    const ownClasses = Array.isArray(node.properties?.className)
      ? node.properties.className.join(" ")
      : node.properties?.className
    const className = [inheritedClassName, ownClasses].filter(Boolean).join(" ")
    node.children?.forEach((child) => walk(child, className || undefined))
  }

  walk(root)
  return lines
}

export {
  codeHighlightClassName,
  codeLowlight,
  highlightCodeLines,
  normalizeHighlightLanguage,
}
export type { CodeBlockLanguage, HighlightToken }
