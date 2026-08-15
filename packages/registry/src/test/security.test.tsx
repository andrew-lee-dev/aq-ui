import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ChartContainer } from "@aq-ui/registry/components/chart"
import { MarkdownRenderer } from "@aq-ui/registry/components/markdown-renderer"

describe("Markdown security contract", () => {
  it("disables raw HTML by default", () => {
    const { container } = render(
      <MarkdownRenderer value={'<img src="x" onerror="alert(1)">'} />
    )
    expect(container.querySelector("img")).toBeNull()
    expect(container.innerHTML).not.toContain("onerror")
  })

  it("sanitizes opted-in HTML and rejects executable protocols", () => {
    const { container } = render(
      <MarkdownRenderer
        allowHtml
        value={
          '<img src="https://example.test/a.png" onerror="alert(1)"> [unsafe](javascript:alert(1))'
        }
      />
    )
    const image = container.querySelector("img")
    expect(image).not.toHaveAttribute("onerror")
    expect(container.querySelector("a")).not.toHaveAttribute(
      "href",
      expect.stringContaining("javascript:")
    )
  })

  it("prefixes heading identifiers to prevent DOM clobbering", () => {
    const { container } = render(<MarkdownRenderer value="# __proto__" />)
    expect(container.querySelector("h1")?.id).toMatch(/^aq-md-/u)
  })

  it("rejects chart config values that can break out of generated CSS", () => {
    const markup = renderToStaticMarkup(
      <ChartContainer
        id={'sales"]{} body{background:red'}
        config={{
          safe: { color: "oklch(0.7 0.2 40)" },
          "bad;} body": { color: "blue" },
          payload: {
            color: 'red;} </style><script data-pwned="true">1</script>',
          },
          remote: { color: "url(https://attacker.invalid/track)" },
        }}
      >
        <svg aria-label="Chart" />
      </ChartContainer>
    )
    const stylesheet = markup.match(/<style>([\s\S]*?)<\/style>/u)?.[1] ?? ""

    expect(stylesheet).toContain("--color-safe: oklch(0.7 0.2 40);")
    expect(stylesheet).not.toMatch(
      /--color-(?:bad|payload|remote)|body\{|background:red|script|url/iu
    )
    expect(markup).not.toContain("data-pwned")
  })
})
