"use client"

import dynamic from "next/dynamic"

const foundationExampleNames = new Set([
  "accordion",
  "alert",
  "alert-dialog",
  "aspect-ratio",
  "avatar",
  "badge",
  "button",
  "button-group",
  "card",
])

const formExampleNames = new Set([
  "checkbox",
  "collapsible",
  "dialog",
  "empty",
  "field",
  "input",
  "input-group",
  "input-otp",
  "kbd",
  "label",
  "native-select",
])

const controlExampleNames = new Set([
  "progress",
  "radio-group",
  "select",
  "separator",
  "skeleton",
  "slider",
  "spinner",
  "switch",
])

const utilityExampleNames = new Set([
  "tabs",
  "textarea",
  "toast",
  "toggle",
  "toggle-group",
  "tooltip",
  "typography",
])

const navigationExampleNames = new Set([
  "breadcrumb",
  "menubar",
  "navigation-menu",
  "pagination",
  "sidebar",
])

const overlayExampleNames = new Set([
  "context-menu",
  "drawer",
  "dropdown-menu",
  "hover-card",
  "popover",
  "sheet",
])

const selectionExampleNames = new Set([
  "calendar",
  "carousel",
  "combobox",
  "command",
  "date-picker",
])

const layoutExampleNames = new Set([
  "direction",
  "item",
  "resizable",
  "scroll-area",
])

const dataExampleNames = new Set(["chart", "data-grid", "data-table", "table"])

const workflowExampleNames = new Set([
  "color-picker",
  "file-upload",
  "stepper",
  "timeline",
  "tree-view",
])

const conversationExampleNames = new Set([
  "attachment",
  "bubble",
  "marker",
  "message",
  "message-scroller",
  "questionnaire",
])

const editorExampleNames = new Set([
  "code-block",
  "code-editor",
  "markdown-editor",
  "markdown-renderer",
  "rich-text-editor",
])

function ExampleLoading() {
  return (
    <div
      role="status"
      className="flex min-h-48 w-full animate-pulse items-center justify-center text-sm text-muted-foreground"
    >
      Loading interactive preview…
    </div>
  )
}

const CoreFoundationRenderer = dynamic(
  () =>
    import("./core-foundation-examples").then(
      (module) => module.CoreFoundationRenderer
    ),
  { loading: ExampleLoading }
)

const CoreFormRenderer = dynamic(
  () =>
    import("./core-form-examples").then((module) => module.CoreFormRenderer),
  { loading: ExampleLoading }
)

const CoreControlRenderer = dynamic(
  () =>
    import("./core-control-examples").then(
      (module) => module.CoreControlRenderer
    ),
  { loading: ExampleLoading }
)

const CoreUtilityRenderer = dynamic(
  () =>
    import("./core-utility-examples").then(
      (module) => module.CoreUtilityRenderer
    ),
  { loading: ExampleLoading }
)

const AdvancedNavigationRenderer = dynamic(
  () =>
    import("./advanced-navigation-examples").then(
      (module) => module.AdvancedNavigationRenderer
    ),
  { loading: ExampleLoading }
)

const AdvancedOverlayRenderer = dynamic(
  () =>
    import("./advanced-overlay-examples").then(
      (module) => module.AdvancedOverlayRenderer
    ),
  { loading: ExampleLoading }
)

const AdvancedSelectionRenderer = dynamic(
  () =>
    import("./advanced-selection-examples").then(
      (module) => module.AdvancedSelectionRenderer
    ),
  { loading: ExampleLoading }
)

const AdvancedLayoutRenderer = dynamic(
  () =>
    import("./advanced-layout-examples").then(
      (module) => module.AdvancedLayoutRenderer
    ),
  { loading: ExampleLoading }
)

const AdvancedDataRenderer = dynamic(
  () =>
    import("./advanced-data-examples").then(
      (module) => module.AdvancedDataRenderer
    ),
  { loading: ExampleLoading }
)

const AdvancedWorkflowRenderer = dynamic(
  () =>
    import("./advanced-workflow-examples").then(
      (module) => module.AdvancedWorkflowRenderer
    ),
  { loading: ExampleLoading }
)

const AdvancedConversationRenderer = dynamic(
  () =>
    import("./advanced-conversation-examples").then(
      (module) => module.AdvancedConversationRenderer
    ),
  { loading: ExampleLoading }
)

const CodeBlockExample = dynamic(() => import("./editor-code-block-example"), {
  loading: ExampleLoading,
})

const CodeEditorExample = dynamic(
  () => import("./editor-code-editor-example"),
  { loading: ExampleLoading }
)

const MarkdownEditorExample = dynamic(
  () => import("./editor-markdown-editor-example"),
  { loading: ExampleLoading }
)

const MarkdownRendererExample = dynamic(
  () => import("./editor-markdown-renderer-example"),
  { loading: ExampleLoading }
)

const RichTextEditorExample = dynamic(
  () => import("./editor-rich-text-editor-example"),
  { loading: ExampleLoading }
)

interface ComponentExampleProps {
  name: string
}

function ComponentExample({ name }: ComponentExampleProps) {
  let preview = <p role="alert">The preview for {name} is unavailable.</p>

  if (foundationExampleNames.has(name)) {
    preview = <CoreFoundationRenderer key={name} name={name} />
  }

  if (formExampleNames.has(name)) {
    preview = <CoreFormRenderer key={name} name={name} />
  }

  if (controlExampleNames.has(name)) {
    preview = <CoreControlRenderer key={name} name={name} />
  }

  if (utilityExampleNames.has(name)) {
    preview = <CoreUtilityRenderer key={name} name={name} />
  }

  if (navigationExampleNames.has(name)) {
    preview = <AdvancedNavigationRenderer key={name} name={name} />
  }

  if (overlayExampleNames.has(name)) {
    preview = <AdvancedOverlayRenderer key={name} name={name} />
  }

  if (selectionExampleNames.has(name)) {
    preview = <AdvancedSelectionRenderer key={name} name={name} />
  }

  if (layoutExampleNames.has(name)) {
    preview = <AdvancedLayoutRenderer key={name} name={name} />
  }

  if (dataExampleNames.has(name)) {
    preview = <AdvancedDataRenderer key={name} name={name} />
  }

  if (workflowExampleNames.has(name)) {
    preview = <AdvancedWorkflowRenderer key={name} name={name} />
  }

  if (conversationExampleNames.has(name)) {
    preview = <AdvancedConversationRenderer key={name} name={name} />
  }

  if (editorExampleNames.has(name)) {
    switch (name) {
      case "code-block":
        preview = <CodeBlockExample key={name} />
        break
      case "code-editor":
        preview = <CodeEditorExample key={name} />
        break
      case "markdown-editor":
        preview = <MarkdownEditorExample key={name} />
        break
      case "markdown-renderer":
        preview = <MarkdownRendererExample key={name} />
        break
      case "rich-text-editor":
        preview = <RichTextEditorExample key={name} />
        break
    }
  }

  return (
    <section id="preview" className="mt-10 scroll-mt-20">
      <h2 className="text-xl font-semibold">Preview</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        This is a live example. Interact with the available controls and use the
        keyboard to inspect the component&apos;s states and behavior.
      </p>
      <div
        data-slot="component-example"
        className="mt-4 flex min-h-72 w-full items-center justify-center overflow-x-auto rounded-xl border bg-background p-4 sm:p-8"
      >
        {preview}
      </div>
    </section>
  )
}

export { ComponentExample }
