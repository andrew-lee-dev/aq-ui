"use client"

import * as React from "react"
import {
  BotIcon,
  CheckIcon,
  Clock3Icon,
  FileTextIcon,
  PaperclipIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react"
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@aq-ui/registry/components/attachment"
import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
} from "@aq-ui/registry/components/bubble"
import {
  Marker,
  MarkerContent,
  MarkerIcon,
} from "@aq-ui/registry/components/marker"
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "@aq-ui/registry/components/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@aq-ui/registry/components/message-scroller"
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@aq-ui/registry/components/questionnaire"

function AttachmentExample() {
  return (
    <AttachmentGroup className="max-w-xl">
      <Attachment>
        <AttachmentMedia>
          <FileTextIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>release-notes.pdf</AttachmentTitle>
          <AttachmentDescription>1.8 MB · Ready</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="Remove release notes">
            <Trash2Icon />
          </AttachmentAction>
        </AttachmentActions>
      </Attachment>
      <Attachment state="uploading">
        <AttachmentMedia>
          <PaperclipIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>components.zip</AttachmentTitle>
          <AttachmentDescription>Uploading · 72%</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
    </AttachmentGroup>
  )
}

function BubbleExample() {
  return (
    <BubbleGroup className="w-full max-w-lg">
      <Bubble variant="muted">
        <BubbleContent>Can I install only the components I need?</BubbleContent>
      </Bubble>
      <Bubble variant="default" align="end">
        <BubbleContent>
          Yes. The registry resolves the smallest dependency graph for each
          item.
        </BubbleContent>
        <BubbleReactions>👍 4</BubbleReactions>
      </Bubble>
    </BubbleGroup>
  )
}

function MarkerExample() {
  return (
    <div className="grid w-full max-w-xl gap-4">
      <Marker variant="separator">
        <MarkerIcon>
          <Clock3Icon />
        </MarkerIcon>
        <MarkerContent>Today</MarkerContent>
      </Marker>
      <Marker variant="border">
        <MarkerIcon>
          <CheckIcon className="text-emerald-500" />
        </MarkerIcon>
        <MarkerContent>All quality gates passed</MarkerContent>
      </Marker>
    </div>
  )
}

function ConversationMessages() {
  return (
    <MessageGroup className="w-full max-w-2xl">
      <Message>
        <MessageAvatar>
          <UserIcon className="size-4" />
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>Andrew · 09:41</MessageHeader>
          <Bubble variant="muted">
            <BubbleContent>Show me a complete Data Grid example.</BubbleContent>
          </Bubble>
          <MessageFooter>Delivered</MessageFooter>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageAvatar>
          <BotIcon className="size-4" />
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>aq assistant · 09:41</MessageHeader>
          <Bubble align="end">
            <BubbleContent>
              The live example includes sorting, filtering, column resize, and
              keyboard navigation.
            </BubbleContent>
          </Bubble>
          <MessageFooter>Generated in 1.2s</MessageFooter>
        </MessageContent>
      </Message>
    </MessageGroup>
  )
}

function MessageExample() {
  return <ConversationMessages />
}

function MessageScrollerExample() {
  const messages = Array.from({ length: 8 }, (_, index) => ({
    id: `message-${index + 1}`,
    content:
      index % 2
        ? "Each preview is rendered with the real aq-ui component."
        : "Can you show another interactive example?",
  }))
  return (
    <MessageScrollerProvider defaultScrollPosition="end">
      <MessageScroller className="h-72 w-full max-w-2xl rounded-xl border bg-muted/20">
        <MessageScrollerViewport>
          <MessageScrollerContent className="p-4">
            {messages.map((message, index) => (
              <MessageScrollerItem
                key={message.id}
                messageId={message.id}
                scrollAnchor
              >
                <Bubble
                  align={index % 2 ? "end" : "start"}
                  variant={index % 2 ? "default" : "muted"}
                >
                  <BubbleContent>{message.content}</BubbleContent>
                </Bubble>
              </MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  )
}

const questionnaireItems = [
  {
    name: "framework",
    required: true,
    choices: [{ value: "next" }, { value: "vite" }, { value: "router" }],
  },
  { name: "project", required: true },
] as const

function QuestionnaireExample() {
  const [submitted, setSubmitted] = React.useState(false)
  return (
    <div className="w-full max-w-xl rounded-xl border p-5">
      {submitted ? (
        <div className="flex items-center gap-3 text-sm">
          <span className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckIcon className="size-4" />
          </span>
          <div>
            <p className="font-medium">Answers saved</p>
            <button
              type="button"
              className="text-primary underline underline-offset-4"
              onClick={() => setSubmitted(false)}
            >
              Start again
            </button>
          </div>
        </div>
      ) : (
        <Questionnaire
          items={questionnaireItems}
          shortcuts="letters"
          onSubmit={(event) => {
            event.preventDefault()
            setSubmitted(true)
          }}
        >
          <QuestionnaireProgress />
          <QuestionnaireItem name="framework" required>
            <QuestionnaireTitle>Which framework do you use?</QuestionnaireTitle>
            <QuestionnaireDescription>
              Press A, B, or C to choose quickly.
            </QuestionnaireDescription>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="next">
                Next.js
                <QuestionnaireChoiceDescription>
                  App Router and static export
                </QuestionnaireChoiceDescription>
              </QuestionnaireChoice>
              <QuestionnaireChoice value="vite">Vite</QuestionnaireChoice>
              <QuestionnaireChoice value="router">
                React Router
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>
          <QuestionnaireItem name="project" required>
            <QuestionnaireTitle>
              What is your project called?
            </QuestionnaireTitle>
            <QuestionnaireDescription>
              Use a short, recognizable name.
            </QuestionnaireDescription>
            <QuestionnaireInput placeholder="My project" />
            <QuestionnaireError>
              Enter a project name to continue.
            </QuestionnaireError>
          </QuestionnaireItem>
          <QuestionnaireActions>
            <QuestionnairePrevious />
            <QuestionnaireNext />
            <QuestionnaireSubmit />
          </QuestionnaireActions>
        </Questionnaire>
      )}
    </div>
  )
}

const AdvancedConversationExamples: Record<string, React.ComponentType> = {
  attachment: AttachmentExample,
  bubble: BubbleExample,
  marker: MarkerExample,
  message: MessageExample,
  "message-scroller": MessageScrollerExample,
  questionnaire: QuestionnaireExample,
}

interface AdvancedConversationRendererProps {
  name: string
}

function AdvancedConversationRenderer({
  name,
}: AdvancedConversationRendererProps) {
  const Example = AdvancedConversationExamples[name]

  if (!Example) {
    return <p role="alert">The preview for {name} is unavailable.</p>
  }

  return <Example />
}

export { AdvancedConversationRenderer }
