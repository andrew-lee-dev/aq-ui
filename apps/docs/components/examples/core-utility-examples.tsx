"use client"

import * as React from "react"
import {
  BoldIcon,
  Code2Icon,
  ItalicIcon,
  MailIcon,
  UnderlineIcon,
  UserRoundIcon,
} from "lucide-react"
import { Button } from "@aq-ui/registry/components/button"
import { Kbd } from "@aq-ui/registry/components/kbd"
import { Label } from "@aq-ui/registry/components/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@aq-ui/registry/components/tabs"
import { Textarea } from "@aq-ui/registry/components/textarea"
import { toast, Toaster } from "@aq-ui/registry/components/toast"
import { Toggle } from "@aq-ui/registry/components/toggle"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@aq-ui/registry/components/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@aq-ui/registry/components/tooltip"
import {
  TypographyBlockquote,
  TypographyH3,
  TypographyInlineCode,
  TypographyLead,
  TypographyList,
  TypographyMuted,
  TypographyP,
} from "@aq-ui/registry/components/typography"

function TabsExample() {
  return (
    <Tabs defaultValue="preview" className="w-full max-w-lg">
      <TabsList>
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="code">Code</TabsTrigger>
        <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
      </TabsList>
      <TabsContent value="preview" className="rounded-lg border p-4">
        Components render with your semantic theme tokens.
      </TabsContent>
      <TabsContent value="code" className="rounded-lg border p-4 font-mono">
        pnpm dlx aq-ui add tabs
      </TabsContent>
      <TabsContent value="accessibility" className="rounded-lg border p-4">
        Arrow keys move focus between tabs.
      </TabsContent>
    </Tabs>
  )
}

function TextareaExample() {
  const [value, setValue] = React.useState("")

  return (
    <div className="grid w-full max-w-md gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="feedback-textarea-demo">Feedback</Label>
        <span className="text-xs text-muted-foreground">
          {value.length}/240
        </span>
      </div>
      <Textarea
        id="feedback-textarea-demo"
        value={value}
        maxLength={240}
        rows={4}
        placeholder="Tell us what could be better…"
        onChange={(event) => setValue(event.currentTarget.value)}
      />
    </div>
  )
}

function ToastExample() {
  return (
    <Toaster>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() =>
            toast.add({
              title: "Project saved",
              description: "Your latest changes are now live.",
              type: "success",
            })
          }
        >
          Show toast
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.add({
              title: "Invite sent",
              description: "We emailed an invitation to your teammate.",
              type: "info",
            })
          }
        >
          Show info
        </Button>
      </div>
    </Toaster>
  )
}

function ToggleExample() {
  return (
    <div className="flex items-center gap-2">
      <Toggle aria-label="Toggle bold" defaultPressed>
        <BoldIcon /> Bold
      </Toggle>
      <Toggle aria-label="Toggle italic" variant="outline">
        <ItalicIcon />
      </Toggle>
      <Toggle aria-label="Toggle code" variant="outline">
        <Code2Icon />
      </Toggle>
    </div>
  )
}

function ToggleGroupExample() {
  return (
    <ToggleGroup
      aria-label="Text formatting"
      defaultValue={["bold"]}
      variant="outline"
      spacing={0}
    >
      <ToggleGroupItem value="bold" aria-label="Bold">
        <BoldIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Italic">
        <ItalicIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Underline">
        <UnderlineIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

function TooltipExample() {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger
            render={<Button size="icon" variant="outline" />}
            aria-label="Add member"
          >
            <UserRoundIcon />
          </TooltipTrigger>
          <TooltipContent>Add team member</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={<Button size="icon" variant="outline" />}
            aria-label="Send email"
          >
            <MailIcon />
          </TooltipTrigger>
          <TooltipContent>
            Send email <Kbd>⌘E</Kbd>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

function TypographyExample() {
  return (
    <article className="w-full max-w-xl">
      <TypographyH3 className="mt-0">
        Design systems should feel invisible
      </TypographyH3>
      <TypographyLead className="mt-2">
        Good primitives help teams move quickly without losing consistency.
      </TypographyLead>
      <TypographyP className="mt-4">
        aq-ui gives you accessible source code, semantic tokens, and small APIs
        that remain easy to own.
      </TypographyP>
      <TypographyBlockquote className="mt-4">
        Build the interface your product needs, not the one your package chose.
      </TypographyBlockquote>
      <TypographyList className="my-4">
        <li>Copy components into your project</li>
        <li>Customize with CSS variables</li>
      </TypographyList>
      <TypographyMuted>
        Install with{" "}
        <TypographyInlineCode>aq-ui add button</TypographyInlineCode>
      </TypographyMuted>
    </article>
  )
}

const CoreUtilityExamples: Record<string, React.ComponentType> = {
  tabs: TabsExample,
  textarea: TextareaExample,
  toast: ToastExample,
  toggle: ToggleExample,
  "toggle-group": ToggleGroupExample,
  tooltip: TooltipExample,
  typography: TypographyExample,
}

interface CoreUtilityRendererProps {
  name: string
}

function CoreUtilityRenderer({ name }: CoreUtilityRendererProps) {
  const Example = CoreUtilityExamples[name]

  if (!Example) {
    return <p role="alert">The preview for {name} is unavailable.</p>
  }

  return <Example />
}

export { CoreUtilityRenderer }
