import * as React from "react"
import axe from "axe-core"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { hydrateRoot } from "react-dom/client"
import { renderToString } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  Button,
  buttonVariants,
  type ButtonProps,
} from "@aq-ui/registry/components/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@aq-ui/registry/components/pagination"

const variants = [
  ["default", "bg-primary"],
  ["outline", "border-border"],
  ["secondary", "bg-secondary"],
  ["ghost", "hover:bg-muted"],
  ["destructive", "bg-destructive"],
  ["link", "underline-offset-4"],
] as const

const sizes = [
  ["default", "h-8"],
  ["xs", "h-6"],
  ["sm", "h-7"],
  ["lg", "h-9"],
  ["icon", "size-8"],
  ["icon-xs", "size-6"],
  ["icon-sm", "size-7"],
  ["icon-lg", "size-9"],
] as const

afterEach(cleanup)

describe("Button", () => {
  it.each(variants)("renders the %s variant contract", (variant, className) => {
    render(<Button variant={variant}>{variant}</Button>)

    const button = screen.getByRole("button", { name: variant })
    expect(button).toHaveAttribute("data-slot", "button")
    expect(button).toHaveAttribute("data-variant", variant)
    expect(button).toHaveAttribute("data-size", "default")
    expect(button).toHaveClass(className)
  })

  it.each(sizes)("renders the %s size contract", (size, className) => {
    render(<Button size={size}>{size}</Button>)

    const button = screen.getByRole("button", { name: size })
    expect(button).toHaveAttribute("data-variant", "default")
    expect(button).toHaveAttribute("data-size", size)
    expect(button).toHaveClass(className)
  })

  it("normalizes nullable variants and keeps stable data hooks", () => {
    render(
      <Button
        variant={null}
        size={null}
        data-slot="consumer-slot"
        data-variant="consumer-variant"
        data-size="consumer-size"
      >
        Normalized
      </Button>
    )

    const button = screen.getByRole("button", { name: "Normalized" })
    expect(button).toHaveAttribute("data-slot", "button")
    expect(button).toHaveAttribute("data-variant", "default")
    expect(button).toHaveAttribute("data-size", "default")
    expect(button).toHaveClass("bg-primary", "h-8")
  })

  it("forwards refs and native form props with a safe default type", async () => {
    const user = userEvent.setup()
    const ref = React.createRef<HTMLElement>()
    const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) =>
      event.preventDefault()
    )

    render(
      <form id="project-form" onSubmit={onSubmit}>
        <Button ref={ref} name="intent" value="preview">
          Preview
        </Button>
        <Button type="submit" name="intent" value="save">
          Save
        </Button>
      </form>
    )

    const preview = screen.getByRole("button", { name: "Preview" })
    expect(ref.current).toBe(preview)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    expect(preview).toHaveAttribute("type", "button")
    expect(preview).toHaveAttribute("name", "intent")
    expect(preview).toHaveAttribute("value", "preview")

    await user.click(preview)
    expect(onSubmit).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: "Save" }))
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it("composes state callback classes after aq-ui variants", () => {
    const className = vi.fn(({ disabled }: { disabled: boolean }) =>
      disabled ? "consumer-disabled" : "consumer-ready"
    )
    const { rerender } = render(<Button className={className}>Stateful</Button>)

    const button = screen.getByRole("button", { name: "Stateful" })
    expect(button).toHaveClass("bg-primary", "consumer-ready")

    rerender(
      <Button className={className} disabled>
        Stateful
      </Button>
    )
    expect(button).toHaveClass("bg-primary", "consumer-disabled")
    expect(className).toHaveBeenLastCalledWith({ disabled: true })
  })

  it("styles and suppresses native and focusable disabled states", async () => {
    const user = userEvent.setup()
    const onNativeClick = vi.fn()
    const onFocusableClick = vi.fn()

    render(
      <>
        <Button disabled onClick={onNativeClick}>
          Native disabled
        </Button>
        <Button disabled focusableWhenDisabled onClick={onFocusableClick}>
          Focusable disabled
        </Button>
      </>
    )

    const native = screen.getByRole("button", { name: "Native disabled" })
    const focusable = screen.getByRole("button", {
      name: "Focusable disabled",
    })
    expect(native).toBeDisabled()
    expect(native).toHaveAttribute("data-disabled")
    expect(focusable).not.toBeDisabled()
    expect(focusable).toHaveAttribute("aria-disabled", "true")
    expect(focusable).toHaveAttribute("data-disabled")
    expect(focusable).toHaveClass(
      "data-disabled:pointer-events-none",
      "aria-disabled:pointer-events-none"
    )

    await user.click(native)
    focusable.focus()
    await user.keyboard("{Enter}")
    expect(onNativeClick).not.toHaveBeenCalled()
    expect(onFocusableClick).not.toHaveBeenCalled()
  })

  it("preserves Base UI keyboard behavior and refs for non-native buttons", async () => {
    const user = userEvent.setup()
    const ref = React.createRef<HTMLElement>()
    const onClick = vi.fn()

    render(
      <Button
        ref={ref}
        nativeButton={false}
        render={<span data-testid="non-native" />}
        onClick={onClick}
      >
        Custom action
      </Button>
    )

    const button = screen.getByRole("button", { name: "Custom action" })
    expect(button).toBe(screen.getByTestId("non-native"))
    expect(ref.current).toBe(button)
    expect(ref.current).toBeInstanceOf(HTMLSpanElement)
    expect(button).toHaveAttribute("tabindex", "0")
    expect(button).not.toHaveAttribute("type")

    button.focus()
    await user.keyboard("{Enter}")
    await user.keyboard(" ")
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it("suppresses and styles disabled non-native buttons", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(
      <Button disabled nativeButton={false} render={<span />} onClick={onClick}>
        Disabled custom action
      </Button>
    )

    const button = screen.getByRole("button", {
      name: "Disabled custom action",
    })
    expect(button).toHaveAttribute("aria-disabled", "true")
    expect(button).toHaveAttribute("data-disabled")
    expect(button).toHaveAttribute("tabindex", "-1")
    expect(button).toHaveClass(
      "data-disabled:opacity-50",
      "aria-disabled:opacity-50"
    )

    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it("exposes an inert loading state without replacing the accessible name", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const { container } = render(
      <Button loading onClick={onClick}>
        Save changes
      </Button>
    )

    const button = screen.getByRole("button", { name: "Save changes" })
    const indicator = container.querySelector(
      '[data-slot="button-loading-indicator"]'
    )
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute("aria-busy", "true")
    expect(button).toHaveAttribute("data-loading")
    expect(button).toHaveAttribute("data-disabled")
    expect(indicator).toHaveAttribute("aria-hidden", "true")
    expect(indicator).toHaveAttribute("data-icon", "inline-start")
    expect(screen.queryByRole("status")).not.toBeInTheDocument()

    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it("supports loading text, a custom indicator, and logical end placement", () => {
    render(
      <Button
        loading
        loadingText="Saving"
        loadingPosition="end"
        loadingIndicator={<svg data-testid="custom-indicator" />}
      >
        Save changes
      </Button>
    )

    const button = screen.getByRole("button", { name: "Saving" })
    const indicator = screen
      .getByTestId("custom-indicator")
      .closest('[data-slot="button-loading-indicator"]')
    expect(button).not.toHaveTextContent("Save changes")
    expect(indicator).toHaveAttribute("data-icon", "inline-end")
    expect(indicator).toHaveAttribute("aria-hidden", "true")
  })

  it("allows the visual loading indicator to be omitted", () => {
    const props = {
      loading: true,
      loadingIndicator: null,
      children: "Working",
    } satisfies ButtonProps

    const { container } = render(<Button {...props} />)
    expect(
      container.querySelector('[data-slot="button-loading-indicator"]')
    ).toBeNull()
    expect(screen.getByRole("button", { name: "Working" })).toHaveAttribute(
      "aria-busy",
      "true"
    )
  })

  it("allows loading content to be hidden for icon-only controls", () => {
    render(
      <Button loading loadingText={null} aria-label="Saving changes">
        <svg data-testid="idle-icon" />
      </Button>
    )

    expect(
      screen.getByRole("button", { name: "Saving changes" })
    ).toHaveAttribute("aria-busy", "true")
    expect(screen.queryByTestId("idle-icon")).not.toBeInTheDocument()
  })

  it("hydrates deterministic variant and loading markup", async () => {
    const element = (
      <Button variant="destructive" size="lg" loading loadingText="Deleting">
        Delete
      </Button>
    )
    const markup = renderToString(element)
    const container = document.createElement("div")
    container.innerHTML = markup
    document.body.appendChild(container)
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    let root: ReturnType<typeof hydrateRoot> | undefined

    await act(async () => {
      root = hydrateRoot(container, element)
      await Promise.resolve()
    })

    expect(consoleError).not.toHaveBeenCalled()
    expect(container.querySelector("button")).toHaveAttribute(
      "data-variant",
      "destructive"
    )
    expect(container.querySelector("button")).toHaveAttribute("data-size", "lg")

    await act(async () => root?.unmount())
    consoleError.mockRestore()
    container.remove()
  })

  it("keeps the destructive variant on the AA contrast token contract", () => {
    const className = buttonVariants({ variant: "destructive" })
    expect(className).toContain("bg-destructive")
    expect(className).toContain("text-destructive-foreground")
    expect(className).toContain("black_8%")
    expect(className).toContain("white_8%")
    expect(className).toContain("ring-destructive/70")
    expect(className).not.toContain("bg-destructive/10")
    expect(className).not.toContain("bg-destructive/20")
  })
})

describe("PaginationLink", () => {
  it("renders semantic anchors styled with button variants", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn((event: React.MouseEvent<HTMLAnchorElement>) =>
      event.preventDefault()
    )
    const onKeyDown = vi.fn()
    const ref = React.createRef<HTMLAnchorElement>()

    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink
              ref={ref}
              href="/page/2"
              isActive
              size="sm"
              onClick={onClick}
              onKeyDown={onKeyDown}
            >
              Page 2
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )

    const link = screen.getByRole("link", { name: "Page 2" })
    expect(ref.current).toBe(link)
    expect(link).toBeInstanceOf(HTMLAnchorElement)
    expect(link).not.toHaveAttribute("role", "button")
    expect(link).toHaveAttribute("aria-current", "page")
    expect(link).toHaveAttribute("data-slot", "pagination-link")
    expect(link).toHaveAttribute("data-active", "true")
    expect(link).toHaveAttribute("data-variant", "outline")
    expect(link).toHaveAttribute("data-size", "sm")
    expect(link).toHaveClass("border-border", "h-7")

    await user.click(link)
    expect(onClick).toHaveBeenCalledOnce()
    link.focus()
    await user.keyboard("{Enter}")
    expect(onKeyDown).toHaveBeenCalledOnce()
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it("preserves native anchor props and inactive pagination styling", () => {
    render(
      <PaginationLink
        href="/page/3"
        target="_blank"
        aria-current="step"
        className="consumer-link"
      >
        Page 3
      </PaginationLink>
    )

    const link = screen.getByRole("link", { name: "Page 3" })
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("aria-current", "step")
    expect(link).not.toHaveAttribute("data-active")
    expect(link).toHaveAttribute("data-variant", "ghost")
    expect(link).toHaveAttribute("data-size", "icon")
    expect(link).toHaveClass("consumer-link", "size-8")
  })

  it("makes disabled pagination links inert for pointer and keyboard activation", () => {
    const onClick = vi.fn()
    const onKeyDown = vi.fn()

    render(
      <PaginationLink
        href="/page/2"
        disabled
        onClick={onClick}
        onKeyDown={onKeyDown}
      >
        Page 2
      </PaginationLink>
    )

    const link = screen.getByRole("link", { name: "Page 2" })
    expect(link).toHaveAttribute("aria-disabled", "true")
    expect(link).toHaveAttribute("data-disabled", "true")
    expect(link).toHaveAttribute("tabindex", "-1")
    expect(link).toHaveClass(
      "aria-disabled:pointer-events-none",
      "data-disabled:pointer-events-none"
    )

    expect(fireEvent.click(link)).toBe(false)
    fireEvent.keyDown(link, { key: "Enter" })
    fireEvent.keyDown(link, { key: " " })
    expect(onClick).not.toHaveBeenCalled()
    expect(onKeyDown).not.toHaveBeenCalled()
  })

  it.each([true, "true"] as const)(
    "normalizes aria-disabled=%s into an inert link",
    (ariaDisabled) => {
      const onClick = vi.fn()

      render(
        <PaginationLink
          href="/page/2"
          aria-disabled={ariaDisabled}
          onClick={onClick}
        >
          Page 2
        </PaginationLink>
      )

      const link = screen.getByRole("link", { name: "Page 2" })
      expect(link).toHaveAttribute("aria-disabled", "true")
      expect(link).toHaveAttribute("data-disabled", "true")
      expect(link).toHaveAttribute("tabindex", "-1")
      expect(fireEvent.click(link)).toBe(false)
      expect(onClick).not.toHaveBeenCalled()
    }
  )

  it("keeps pagination family data slots stable", () => {
    const { container } = render(
      <Pagination data-slot="consumer-pagination">
        <PaginationContent data-slot="consumer-content">
          <PaginationItem data-slot="consumer-item">
            <PaginationLink href="/page/2" data-slot="consumer-link">
              Page 2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis data-slot="consumer-ellipsis" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )

    expect(container.querySelector("nav")).toHaveAttribute(
      "data-slot",
      "pagination"
    )
    expect(container.querySelector("ul")).toHaveAttribute(
      "data-slot",
      "pagination-content"
    )
    expect(container.querySelector("li")).toHaveAttribute(
      "data-slot",
      "pagination-item"
    )
    expect(screen.getByRole("link", { name: "Page 2" })).toHaveAttribute(
      "data-slot",
      "pagination-link"
    )
    expect(
      container.querySelector('[data-slot="pagination-ellipsis"]')
    ).toBeInTheDocument()
  })

  it("hydrates deterministic pagination state", async () => {
    const element = (
      <Pagination aria-label="Project pages">
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="/page/2" isActive disabled>
              Page 2
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
    const markup = renderToString(element)
    const container = document.createElement("div")
    container.innerHTML = markup
    document.body.appendChild(container)
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    let root: ReturnType<typeof hydrateRoot> | undefined

    await act(async () => {
      root = hydrateRoot(container, element)
      await Promise.resolve()
    })

    expect(consoleError).not.toHaveBeenCalled()
    expect(container.querySelector("nav")).toHaveAttribute(
      "aria-label",
      "Project pages"
    )
    expect(container.querySelector("a")).toHaveAttribute("aria-current", "page")
    expect(container.querySelector("a")).toHaveAttribute(
      "aria-disabled",
      "true"
    )

    await act(async () => root?.unmount())
    consoleError.mockRestore()
    container.remove()
  })

  it("keeps previous and next controls as links", () => {
    render(
      <Pagination>
        <PaginationPrevious href="/page/1" />
        <PaginationNext href="/page/3" />
      </Pagination>
    )

    expect(
      screen.getByRole("link", { name: "Go to previous page" })
    ).not.toHaveAttribute("role", "button")
    expect(
      screen.getByRole("link", { name: "Go to next page" })
    ).not.toHaveAttribute("role", "button")
  })

  it("has no automated accessibility violations in representative states", async () => {
    const { container } = render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="/page/1" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="/page/2" isActive>
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="/page/3" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )

    expect((await axe.run(container)).violations).toEqual([])
  })
})
