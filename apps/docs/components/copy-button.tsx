"use client"

import * as React from "react"

interface CopyButtonProps {
  value: string
  label?: string
  copiedLabel?: string
  errorLabel?: string
  className?: string
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

function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  errorLabel = "Copy failed",
  className = "rounded-md border px-2 py-1 font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
}: CopyButtonProps) {
  const [status, setStatus] = React.useState<"idle" | "copied" | "error">(
    "idle"
  )
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    },
    []
  )

  const handleCopy = async () => {
    try {
      await copyText(value)
      setStatus("copied")
    } catch {
      setStatus("error")
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setStatus("idle"), 2000)
  }

  const statusLabel =
    status === "copied" ? copiedLabel : status === "error" ? errorLabel : ""

  return (
    <>
      <button
        type="button"
        className={className}
        aria-label={label}
        onClick={() => void handleCopy()}
      >
        <span aria-hidden="true">{statusLabel || label}</span>
      </button>
      <span className="sr-only" aria-live="polite">
        {statusLabel}
      </span>
    </>
  )
}

export { CopyButton }
