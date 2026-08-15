// @vitest-environment node

import * as React from "react"
import { renderToString } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@aq-ui/registry/components/message-scroller"
import { Button } from "@aq-ui/registry/components/button"
import { ColorPicker } from "@aq-ui/registry/components/color-picker"
import { SidebarMenuSkeleton } from "@aq-ui/registry/components/sidebar"
import {
  Questionnaire,
  QuestionnaireChoice,
  QuestionnaireItem,
  QuestionnaireTitle,
} from "@aq-ui/registry/components/questionnaire"

describe("native component SSR", () => {
  it("renders deterministic button state without browser globals", () => {
    const element = (
      <Button variant="destructive" size="lg" loading loadingText="Deleting">
        Delete
      </Button>
    )
    const first = renderToString(element)
    const second = renderToString(element)

    expect(first).toBe(second)
    expect(first).toContain('type="button"')
    expect(first).toContain('data-slot="button"')
    expect(first).toContain('data-variant="destructive"')
    expect(first).toContain('data-size="lg"')
    expect(first).toContain('data-loading=""')
    expect(first).toContain('data-disabled=""')
    expect(first).toContain('aria-busy="true"')
    expect(first).toContain("Deleting")
    expect(first).not.toContain(">Delete<")
  })

  it("normalizes hex and RGB values for HSB channel controls", () => {
    const defaultHex = renderToString(<ColorPicker />)
    const controlledRgb = renderToString(
      <ColorPicker value="rgb(59, 130, 246)" format="rgb" name="accent" />
    )

    expect(defaultHex).toContain("#3B82F6")
    expect(controlledRgb).toContain("rgb(59, 130, 246)")
    expect(controlledRgb).toContain('name="accent"')
  })

  it("renders message scroller and questionnaire without browser globals", () => {
    const messages = renderToString(
      <MessageScrollerProvider>
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent>
              <MessageScrollerItem messageId="one">Hello</MessageScrollerItem>
            </MessageScrollerContent>
          </MessageScrollerViewport>
        </MessageScroller>
      </MessageScrollerProvider>
    )
    const questionnaire = renderToString(
      <Questionnaire items={[{ name: "question" }]}>
        <QuestionnaireItem name="question">
          <QuestionnaireTitle>Question</QuestionnaireTitle>
          <QuestionnaireChoice value="answer">Answer</QuestionnaireChoice>
        </QuestionnaireItem>
      </Questionnaire>
    )

    expect(messages).toContain("Hello")
    expect(messages).toContain('role="log"')
    expect(questionnaire).toContain("Question")
    expect(questionnaire).toContain('data-slot="questionnaire"')
  })

  it("renders deterministic sidebar skeleton widths for hydration", () => {
    const first = renderToString(<SidebarMenuSkeleton showIcon />)
    const second = renderToString(<SidebarMenuSkeleton showIcon />)

    expect(first).toBe(second)
    expect(first).toMatch(/--skeleton-width:\d+%/u)
  })
})
