import * as React from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScrollerVisibility,
} from "@aq-ui/registry/components/message-scroller"
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@aq-ui/registry/components/questionnaire"

function rect(top: number, bottom: number): DOMRect {
  return {
    bottom,
    height: bottom - top,
    left: 0,
    right: 100,
    top,
    width: 100,
    x: 0,
    y: top,
    toJSON: () => ({}),
  }
}

function VisibilityProbe() {
  const visibility = useMessageScrollerVisibility()
  return (
    <output data-testid="visibility">
      {visibility.currentAnchorId ?? "none"}:
      {visibility.visibleMessageIds.join(",")}
    </output>
  )
}

describe("React 18-compatible native components", () => {
  it("measures message edges, exposes visibility, and scrolls without a React 19 primitive", async () => {
    const user = userEvent.setup()
    render(
      <MessageScrollerProvider scrollPreviousItemPeek={0}>
        <MessageScroller>
          <MessageScrollerViewport data-testid="viewport">
            <MessageScrollerContent>
              <MessageScrollerItem messageId="first" scrollAnchor>
                First
              </MessageScrollerItem>
              <MessageScrollerItem messageId="second">
                Second
              </MessageScrollerItem>
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
          <VisibilityProbe />
        </MessageScroller>
      </MessageScrollerProvider>
    )

    const viewport = screen.getByTestId("viewport")
    const first = screen.getByText("First")
    const second = screen.getByText("Second")
    Object.defineProperties(viewport, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 300 },
      scrollTo: {
        configurable: true,
        value: ({ top }: ScrollToOptions) => {
          viewport.scrollTop = top ?? 0
        },
      },
    })
    vi.spyOn(viewport, "getBoundingClientRect").mockReturnValue(rect(0, 100))
    vi.spyOn(first, "getBoundingClientRect").mockReturnValue(rect(0, 40))
    vi.spyOn(second, "getBoundingClientRect").mockReturnValue(rect(120, 160))

    fireEvent.scroll(viewport)

    const scrollButton = await screen.findByRole("button", {
      name: "Scroll to end",
    })
    await waitFor(() =>
      expect(scrollButton).toHaveAttribute("data-active", "true")
    )
    await waitFor(() =>
      expect(screen.getByTestId("visibility")).toHaveTextContent("first:first")
    )

    await user.click(scrollButton)
    expect(viewport.scrollTop).toBe(200)
  })

  it("validates, advances, skips, submits, and reports progress accessibly", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) =>
      event.preventDefault()
    )

    render(
      <Questionnaire
        items={[
          {
            name: "framework",
            required: true,
            choices: [{ value: "react" }, { value: "other" }],
          },
          { name: "details" },
        ]}
        shortcuts="letters"
        onSubmit={onSubmit}
      >
        <QuestionnaireProgress />
        <QuestionnaireItem name="framework" required>
          <QuestionnaireTitle>Choose a framework</QuestionnaireTitle>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="react">React</QuestionnaireChoice>
            <QuestionnaireChoice value="other">Other</QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
          <QuestionnaireActions>
            <QuestionnaireNext />
          </QuestionnaireActions>
        </QuestionnaireItem>
        <QuestionnaireItem name="details">
          <QuestionnaireTitle>Anything else?</QuestionnaireTitle>
          <QuestionnaireInput aria-label="Details" />
          <QuestionnaireError />
          <QuestionnaireActions>
            <QuestionnaireSkip />
            <QuestionnaireSubmit />
          </QuestionnaireActions>
        </QuestionnaireItem>
      </Questionnaire>
    )

    await screen.findByText("Choose a framework")
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuetext",
      "Question 1 of 2"
    )

    await user.click(screen.getByRole("button", { name: "Next" }))
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Choose an answer to continue."
    )
    expect(screen.getByText("Choose a framework")).toBeVisible()

    const reactChoice = screen.getByRole("radio", { name: "React" })
    reactChoice.focus()
    await user.keyboard("a")
    expect(reactChoice).toBeChecked()
    await user.click(screen.getByRole("button", { name: "Next" }))

    await screen.findByText("Anything else?")
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuetext",
      "Question 2 of 2"
    )
    await user.click(screen.getByRole("button", { name: "Skip" }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce())
  })

  it("keeps controlled questionnaire navigation controlled", async () => {
    const user = userEvent.setup()
    const onItemChange = vi.fn()
    render(
      <Questionnaire
        item="one"
        items={[{ name: "one" }, { name: "two" }]}
        onItemChange={onItemChange}
      >
        <QuestionnaireItem name="one">
          <QuestionnaireTitle>One</QuestionnaireTitle>
          <QuestionnaireChoice value="done">Done</QuestionnaireChoice>
          <QuestionnaireNext />
        </QuestionnaireItem>
        <QuestionnaireItem name="two">
          <QuestionnaireTitle>Two</QuestionnaireTitle>
        </QuestionnaireItem>
      </Questionnaire>
    )

    await user.click(screen.getByRole("radio", { name: "Done" }))
    await user.click(screen.getByRole("button", { name: "Next" }))
    expect(onItemChange).toHaveBeenCalledWith("two")
    expect(screen.getByText("One")).toBeVisible()
    expect(screen.getByText("Two")).not.toBeVisible()
  })

  it("cleans scheduled scroller work during Strict Mode remounts", () => {
    const { unmount } = render(
      <React.StrictMode>
        <MessageScrollerProvider>
          <MessageScroller>
            <MessageScrollerViewport>
              <MessageScrollerContent>
                <MessageScrollerItem messageId="one">One</MessageScrollerItem>
              </MessageScrollerContent>
            </MessageScrollerViewport>
          </MessageScroller>
        </MessageScrollerProvider>
      </React.StrictMode>
    )
    act(() => unmount())
  })
})
