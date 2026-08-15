"use client"

import * as React from "react"
import {
  Code2Icon,
  FileIcon,
  FileTextIcon,
  FolderIcon,
  FolderOpenIcon,
} from "lucide-react"
import { ColorPicker } from "@aq-ui/registry/components/color-picker"
import { FileUpload } from "@aq-ui/registry/components/file-upload"
import {
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperList,
  StepperNext,
  StepperPrevious,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@aq-ui/registry/components/stepper"
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineItem,
  TimelineMarker,
  TimelineTime,
  TimelineTitle,
} from "@aq-ui/registry/components/timeline"
import {
  TreeView,
  type TreeViewNode,
} from "@aq-ui/registry/components/tree-view"

const treeItems: TreeViewNode[] = [
  {
    id: "components",
    label: "components",
    icon: <FolderOpenIcon className="size-4" />,
    children: [
      {
        id: "button",
        label: "button.tsx",
        icon: <Code2Icon className="size-4" />,
      },
      {
        id: "dialog",
        label: "dialog.tsx",
        icon: <Code2Icon className="size-4" />,
      },
    ],
  },
  {
    id: "docs",
    label: "docs",
    icon: <FolderIcon className="size-4" />,
    children: [
      {
        id: "intro",
        label: "introduction.mdx",
        icon: <FileTextIcon className="size-4" />,
      },
    ],
  },
  {
    id: "package",
    label: "package.json",
    icon: <FileIcon className="size-4" />,
  },
]

function TreeViewExample() {
  return (
    <div className="w-full max-w-md rounded-xl border p-3">
      <TreeView
        items={treeItems}
        defaultExpandedIds={["components", "docs"]}
        defaultSelectedIds={["button"]}
      />
    </div>
  )
}

const stepperSteps = [
  { value: "details", title: "Details", description: "Project metadata" },
  { value: "theme", title: "Theme", description: "Tokens and radius" },
  { value: "review", title: "Review", description: "Confirm setup" },
]

function StepperExample() {
  return (
    <Stepper defaultValue="details" linear className="w-full max-w-3xl">
      <StepperList>
        {stepperSteps.map((step, index) => (
          <StepperItem key={step.value} value={step.value}>
            <StepperTrigger>
              <StepperIndicator />
              <span className="hidden sm:block">
                <StepperTitle>{step.title}</StepperTitle>
                <StepperDescription>{step.description}</StepperDescription>
              </span>
            </StepperTrigger>
            {index < stepperSteps.length - 1 ? <StepperSeparator /> : null}
          </StepperItem>
        ))}
      </StepperList>
      {stepperSteps.map((step) => (
        <StepperContent
          key={step.value}
          value={step.value}
          className="rounded-lg border bg-muted/30 p-4"
        >
          <p className="font-medium">{step.title}</p>
          <p className="text-sm text-muted-foreground">{step.description}</p>
        </StepperContent>
      ))}
      <div className="flex justify-end gap-2">
        <StepperPrevious>Previous</StepperPrevious>
        <StepperNext>Next</StepperNext>
      </div>
    </Stepper>
  )
}

function TimelineExample() {
  return (
    <Timeline className="w-full max-w-lg">
      <TimelineItem>
        <TimelineMarker />
        <TimelineConnector />
        <TimelineContent>
          <TimelineTitle>Registry generated</TimelineTitle>
          <TimelineDescription>
            151 public items passed schema validation.
          </TimelineDescription>
          <TimelineTime dateTime="2026-08-15T09:00:00+07:00">
            09:00
          </TimelineTime>
        </TimelineContent>
      </TimelineItem>
      <TimelineItem>
        <TimelineMarker className="bg-emerald-500" />
        <TimelineConnector />
        <TimelineContent>
          <TimelineTitle>Quality gates passed</TimelineTitle>
          <TimelineDescription>
            Typecheck, lint, tests, and static export succeeded.
          </TimelineDescription>
          <TimelineTime dateTime="2026-08-15T09:12:00+07:00">
            09:12
          </TimelineTime>
        </TimelineContent>
      </TimelineItem>
      <TimelineItem>
        <TimelineMarker className="bg-muted-foreground" />
        <TimelineContent>
          <TimelineTitle>Ready to publish</TimelineTitle>
          <TimelineDescription>
            The alpha package is waiting for approval.
          </TimelineDescription>
        </TimelineContent>
      </TimelineItem>
    </Timeline>
  )
}

function ColorPickerExample() {
  return <ColorPicker defaultValue="#6366f1" showAlpha />
}

function FileUploadExample() {
  return (
    <FileUpload
      className="w-full max-w-xl"
      accept="image/*,.pdf"
      maxFiles={4}
      maxSize={5 * 1024 * 1024}
      label="Drop assets here or choose files"
      description="PNG, JPG, or PDF · up to 5 MB each"
    />
  )
}

const AdvancedWorkflowExamples: Record<string, React.ComponentType> = {
  "tree-view": TreeViewExample,
  stepper: StepperExample,
  timeline: TimelineExample,
  "color-picker": ColorPickerExample,
  "file-upload": FileUploadExample,
}

interface AdvancedWorkflowRendererProps {
  name: string
}

function AdvancedWorkflowRenderer({ name }: AdvancedWorkflowRendererProps) {
  const Example = AdvancedWorkflowExamples[name]

  if (!Example) {
    return <p role="alert">The preview for {name} is unavailable.</p>
  }

  return <Example />
}

export { AdvancedWorkflowRenderer }
