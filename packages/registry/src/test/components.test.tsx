import * as React from "react"
import axe from "axe-core"
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { ColumnDef } from "@tanstack/react-table"

import { Button } from "@aq-ui/registry/components/button"
import { Calendar } from "@aq-ui/registry/components/calendar"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@aq-ui/registry/components/card"
import { CodeBlock } from "@aq-ui/registry/components/code-block"
import { Combobox, ComboboxInput } from "@aq-ui/registry/components/combobox"
import { DataGrid } from "@aq-ui/registry/components/data-grid"
import { FileUpload } from "@aq-ui/registry/components/file-upload"
import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperList,
  StepperTrigger,
} from "@aq-ui/registry/components/stepper"

describe("component contracts", () => {
  it("lets card headings shrink and wrap long unbroken content", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Editor</CardTitle>
          <CardDescription>
            JavaScript/TypeScript/JSX/TSX/JSON/HTML/CSS/Markdown/YAML/SQL
          </CardDescription>
        </CardHeader>
      </Card>
    )

    expect(screen.getByText("Editor")).toHaveClass("min-w-0", "wrap-anywhere")
    expect(screen.getByText(/JavaScript\/TypeScript/)).toHaveClass(
      "min-w-0",
      "wrap-anywhere"
    )
  })

  it("adapts both calendar navigation layouts to RTL without double rotation", () => {
    const { container, rerender, unmount } = render(
      <Calendar dir="rtl" month={new Date(2026, 7, 1)} />
    )

    const calendar = container.querySelector('[data-slot="calendar"]')
    const defaultPreviousIcon = container.querySelector(
      ".rdp-nav .rdp-button_previous .lucide-chevron-left"
    )
    const defaultNextIcon = container.querySelector(
      ".rdp-nav .rdp-button_next .lucide-chevron-right"
    )

    expect(calendar).toHaveClass("rtl:[&_.rdp-nav_svg]:rotate-180")
    expect(defaultPreviousIcon).not.toBeNull()
    expect(defaultNextIcon).not.toBeNull()
    expect(defaultPreviousIcon).not.toHaveClass("rtl:rotate-180")
    expect(defaultNextIcon).not.toHaveClass("rtl:rotate-180")

    rerender(
      <Calendar dir="rtl" month={new Date(2026, 7, 1)} navLayout="around" />
    )

    const aroundPreviousIcon = container.querySelector(
      ".rdp-button_previous .lucide-chevron-right"
    )
    const aroundNextIcon = container.querySelector(
      ".rdp-button_next .lucide-chevron-left"
    )

    expect(aroundPreviousIcon).not.toBeNull()
    expect(aroundNextIcon).not.toBeNull()
    expect(aroundPreviousIcon).not.toHaveClass("rtl:rotate-180")
    expect(aroundNextIcon).not.toHaveClass("rtl:rotate-180")

    unmount()
  })

  it("forwards native button behavior and exposes stable slots", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const { container } = render(<Button onClick={onClick}>Save</Button>)

    const button = screen.getByRole("button", { name: "Save" })
    expect(button).toHaveAttribute("data-slot", "button")
    await user.click(button)
    expect(onClick).toHaveBeenCalledOnce()
    expect((await axe.run(container)).violations).toEqual([])
  })

  it("renders highlighted code as text without an execution path", () => {
    const code = `<script>globalThis.compromised = true</script>`
    const { container } = render(
      <CodeBlock code={code} language="html" lineNumbers copyButton={false} />
    )

    expect(container.querySelector("script")).toBeNull()
    expect(screen.getByText(/globalThis\.compromised/)).toBeInTheDocument()
    expect(
      container.querySelector('[data-slot="code-block-line"]')
    ).not.toBeNull()
  })

  it("copies static code and exposes a visible accessibility status", async () => {
    const user = userEvent.setup()
    const code = 'const greeting = "Hello aq-ui"'
    render(<CodeBlock code={code} language="javascript" />)

    const copyButton = screen.getByRole("button", { name: "Copy code" })
    await user.click(copyButton)

    expect(copyButton).toHaveAccessibleName("Copied")
    expect(await navigator.clipboard.readText()).toBe(code)
  })

  it("gives icon-only combobox controls accessible names", () => {
    const { unmount } = render(
      <Combobox items={["Next.js"]} defaultValue="Next.js">
        <ComboboxInput aria-label="Framework" showClear />
      </Combobox>
    )

    expect(
      screen.getByRole("button", { name: "Clear selection" })
    ).toBeInTheDocument()

    unmount()
    render(
      <Combobox items={["Next.js"]}>
        <ComboboxInput aria-label="Framework" />
      </Combobox>
    )

    expect(
      screen.getByRole("button", { name: "Open options" })
    ).toBeInTheDocument()
  })

  it("keeps constrained code source scrollable without changing the unconstrained layout", async () => {
    const code = Array.from(
      { length: 24 },
      (_, index) =>
        `const line${index + 1} = "a deliberately long source line that needs horizontal scrolling"`
    ).join("\n")
    const { container, rerender } = render(
      <CodeBlock
        code={code}
        filename="scroll-example.ts"
        maxHeight={192}
        copyButton={false}
      />
    )

    const block = container.querySelector<HTMLElement>(
      '[data-slot="code-block"]'
    )
    const source = container.querySelector<HTMLElement>(
      '[data-slot="code-block-pre"]'
    )
    const codeElement = source?.querySelector("code")

    expect(block).not.toBeNull()
    expect(source).not.toBeNull()
    expect(block).toHaveStyle({ maxHeight: "192px" })
    expect(block).toHaveClass("flex", "flex-col", "overflow-hidden")
    expect(source).toHaveClass("overflow-auto", "min-h-0", "flex-1")
    expect(source).toHaveClass("whitespace-pre")
    expect(codeElement).toHaveClass("min-w-max")
    expect(codeElement?.querySelector(".sr-only")?.textContent).toBe(code)
    expect((await axe.run(block!)).violations).toEqual([])

    rerender(
      <CodeBlock code={code} filename="scroll-example.ts" copyButton={false} />
    )

    expect(block).not.toHaveStyle({ maxHeight: "192px" })
    expect(source).toHaveClass("overflow-auto", "whitespace-pre")
    expect(source).not.toHaveClass("min-h-0", "flex-1")
    expect(codeElement).toHaveClass("min-w-max")
  })

  it("supports controlled step navigation", async () => {
    const user = userEvent.setup()
    function Fixture() {
      const [step, setStep] = React.useState("account")
      return (
        <Stepper value={step} onValueChange={setStep}>
          <StepperList>
            <StepperItem value="account">
              <StepperTrigger>
                <StepperIndicator /> Account
              </StepperTrigger>
            </StepperItem>
            <StepperItem value="profile">
              <StepperTrigger>
                <StepperIndicator /> Profile
              </StepperTrigger>
            </StepperItem>
          </StepperList>
          <StepperContent value="account">Account panel</StepperContent>
          <StepperContent value="profile">Profile panel</StepperContent>
        </Stepper>
      )
    }

    render(<Fixture />)
    expect(screen.getByText("Account panel")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /Profile/ }))
    expect(screen.getByText("Profile panel")).toBeInTheDocument()
  })

  it("exposes correct virtual-grid indices and keyboard interactions", async () => {
    const user = userEvent.setup()
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(240)
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(640)
    const columns: ColumnDef<{ name: string; status: string }>[] = [
      {
        accessorKey: "name",
        header: "Name",
        size: 120,
        minSize: 80,
        maxSize: 200,
      },
      { accessorKey: "status", header: "Status", size: 100 },
    ]

    render(
      <DataGrid
        columns={columns}
        data={[
          { name: "Ada", status: "Active" },
          { name: "Grace", status: "Away" },
        ]}
        height={240}
      />
    )

    const grid = screen.getByRole("grid")
    const headers = screen.getAllByRole("columnheader")
    expect(grid).toHaveAttribute("aria-rowcount", "3")
    expect(grid).toHaveAttribute("aria-colcount", "2")
    expect(headers[0]?.closest('[role="row"]')).toHaveAttribute(
      "aria-rowindex",
      "1"
    )

    headers[0]?.focus()
    await user.keyboard("{ArrowDown}")
    await waitFor(() =>
      expect(document.activeElement).toHaveAttribute("role", "gridcell")
    )
    expect(document.activeElement?.closest('[role="row"]')).toHaveAttribute(
      "aria-rowindex",
      "2"
    )
    expect(document.activeElement).toHaveAttribute("aria-colindex", "1")

    await user.keyboard("{ArrowRight}")
    expect(document.activeElement).toHaveAttribute("aria-colindex", "2")

    const resizeHandle = screen.getByRole("separator", {
      name: "Resize Name column",
    })
    resizeHandle.focus()
    expect(resizeHandle).toHaveAttribute("aria-valuenow", "120")
    await user.keyboard("{ArrowRight}")
    expect(resizeHandle).toHaveAttribute("aria-valuenow", "128")
    await user.keyboard("{End}")
    expect(resizeHandle).toHaveAttribute("aria-valuenow", "200")
  })

  it("shares file validation and state with the public upload controller", () => {
    const onValueChange = vi.fn()
    const onReject = vi.fn()
    const text = new File(["notes"], "notes.txt", { type: "text/plain" })
    const image = new File(["image"], "photo.png", { type: "image/png" })

    const { container } = render(
      <FileUpload
        accept="image/*"
        multiple={false}
        autoUpload={false}
        onValueChange={onValueChange}
        onReject={onReject}
      />
    )

    const nativeInput = container.querySelector(
      '[data-slot="file-upload-input"]'
    )
    expect(nativeInput).toHaveAttribute("hidden")
    expect(nativeInput).toHaveAttribute("tabindex", "-1")
    expect(within(container).getAllByRole("button")).toHaveLength(1)

    fireEvent.drop(screen.getByRole("button", { name: /Drop files/i }), {
      dataTransfer: { files: [text, image], types: ["Files"] },
    })

    expect(onValueChange).toHaveBeenCalledOnce()
    expect(onValueChange).toHaveBeenCalledWith([image])
    expect(onReject).toHaveBeenCalledWith([
      expect.objectContaining({ file: text, reason: "type" }),
    ])
    expect(screen.getByText("photo.png")).toBeInTheDocument()
    expect(screen.queryByText("notes.txt")).not.toBeInTheDocument()
  })
})
