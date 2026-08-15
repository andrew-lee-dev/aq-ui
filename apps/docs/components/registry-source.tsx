"use client"

import * as React from "react"

import { CopyButton } from "@/components/copy-button"

interface RegistrySourceFile {
  path: string
  content?: string
}

interface RegistrySourceRecord {
  files?: RegistrySourceFile[]
}

interface RegistrySourceProps {
  name: string
}

type SourceState =
  | { status: "idle" | "loading" }
  | { status: "ready"; files: Array<Required<RegistrySourceFile>> }
  | { status: "error"; message: string }

function SourceCodeBlock({
  code,
  filename,
}: {
  code: string
  filename: string
}) {
  return (
    <figure
      data-slot="code-block"
      aria-label={`${filename} source code`}
      className="group/code-block relative my-4 flex max-h-[38rem] flex-col overflow-hidden rounded-lg border bg-muted/35 text-sm text-foreground shadow-xs"
    >
      <figcaption className="flex min-h-9 shrink-0 items-center border-b bg-muted/85 px-3 text-xs text-muted-foreground backdrop-blur">
        <span className="min-w-0 flex-1 truncate font-medium">{filename}</span>
        <CopyButton
          value={code}
          label="Copy code"
          className="shrink-0 rounded-md px-2 py-1 font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </figcaption>
      <pre
        data-slot="code-block-pre"
        tabIndex={0}
        aria-label={`${filename} source code. Use arrow keys to scroll.`}
        className="m-0 min-h-0 flex-1 overflow-auto p-3 text-[0.8125rem] leading-6 whitespace-pre [tab-size:2]"
      >
        <code className="block min-w-max font-mono">{code}</code>
      </pre>
    </figure>
  )
}

function RegistrySource({ name }: RegistrySourceProps) {
  const sectionRef = React.useRef<HTMLElement | null>(null)
  const controllerRef = React.useRef<AbortController | null>(null)
  const [state, setState] = React.useState<SourceState>({ status: "idle" })

  const loadSource = React.useCallback(async () => {
    if (controllerRef.current || state.status === "ready") return

    const controller = new AbortController()
    controllerRef.current = controller
    setState({ status: "loading" })

    try {
      const response = await fetch(`../../r/${encodeURIComponent(name)}.json`, {
        signal: controller.signal,
      })
      if (!response.ok) {
        throw new Error(`Source request failed with status ${response.status}.`)
      }

      const record = (await response.json()) as RegistrySourceRecord
      const files = (record.files ?? []).filter(
        (file): file is Required<RegistrySourceFile> =>
          typeof file.path === "string" && typeof file.content === "string"
      )
      if (!files.length) throw new Error("No source files were found.")

      setState({ status: "ready", files })
    } catch (reason) {
      if (controller.signal.aborted) return
      setState({
        status: "error",
        message:
          reason instanceof Error ? reason.message : "Unable to load source.",
      })
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null
    }
  }, [name, state.status])

  React.useEffect(() => {
    if (state.status !== "idle") return
    const section = sectionRef.current
    if (!section || typeof IntersectionObserver === "undefined") {
      void loadSource()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        void loadSource()
      },
      { rootMargin: "0px" }
    )
    observer.observe(section)
    return () => observer.disconnect()
  }, [loadSource, state.status])

  React.useEffect(
    () => () => {
      controllerRef.current?.abort()
    },
    []
  )

  const retry = () => {
    setState({ status: "idle" })
  }

  return (
    <section
      id="source"
      ref={sectionRef}
      className="mt-8 scroll-mt-20"
      data-slot="registry-source"
    >
      <h2 className="text-xl font-semibold">Source</h2>
      {state.status === "ready" ? (
        state.files.map((file) => (
          <SourceCodeBlock
            key={file.path}
            code={file.content}
            filename={file.path}
          />
        ))
      ) : state.status === "error" ? (
        <div className="mt-3 rounded-lg border border-destructive/40 p-4 text-sm">
          <p role="alert">{state.message}</p>
          <button
            type="button"
            className="mt-3 rounded-md border px-3 py-1.5 font-medium hover:bg-muted"
            onClick={retry}
          >
            Retry source
          </button>
        </div>
      ) : (
        <div
          className="mt-3 flex min-h-24 items-center justify-center rounded-lg border bg-muted/20 p-4"
          aria-live="polite"
        >
          {state.status === "loading" ? (
            <p className="text-sm text-muted-foreground">Loading source…</p>
          ) : (
            <button
              type="button"
              className="rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
              onClick={() => void loadSource()}
            >
              Load source
            </button>
          )}
        </div>
      )}
    </section>
  )
}

export { RegistrySource }
