"use client"

import * as React from "react"
import { CheckIcon, CopyIcon } from "lucide-react"

import { Button } from "@aq-ui/registry/components/button"
import { cn } from "@aq-ui/registry/lib/utils"

interface CodeBlockCopyButtonProps extends Omit<
  React.ComponentProps<typeof Button>,
  "onClick"
> {
  value: string
  copiedLabel?: string
  copyLabel?: string
  onCopyError?: (error: Error) => void
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement("textarea")
  textarea.value = value
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.select()

  const copied = document.execCommand("copy")
  textarea.remove()
  if (!copied) throw new Error("The browser did not allow copying.")
}

const CodeBlockCopyButton = React.forwardRef<
  React.ComponentRef<typeof Button>,
  CodeBlockCopyButtonProps
>(function CodeBlockCopyButton(
  {
    value,
    copiedLabel = "Copied",
    copyLabel = "Copy code",
    onCopyError,
    className,
    ...props
  },
  ref
) {
  const [copied, setCopied] = React.useState(false)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleCopy = async () => {
    try {
      await copyText(value)
      setCopied(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch (reason) {
      onCopyError?.(
        reason instanceof Error ? reason : new Error("Failed to copy code.")
      )
    }
  }

  return (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      size="icon-sm"
      data-slot="code-block-copy-button"
      className={cn("shrink-0", className)}
      aria-label={copied ? copiedLabel : copyLabel}
      title={copied ? copiedLabel : copyLabel}
      onClick={handleCopy}
      {...props}
    >
      {copied ? (
        <CheckIcon aria-hidden="true" />
      ) : (
        <CopyIcon aria-hidden="true" />
      )}
    </Button>
  )
})
CodeBlockCopyButton.displayName = "CodeBlockCopyButton"

export { CodeBlockCopyButton }
export type { CodeBlockCopyButtonProps }
