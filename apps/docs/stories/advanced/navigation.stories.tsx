import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Code2Icon, FileTextIcon, PaletteIcon } from "lucide-react"

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
  TreeView,
  type TreeViewNode,
} from "@aq-ui/registry/components/tree-view"

const tree: TreeViewNode[] = [
  {
    id: "components",
    label: "components",
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
      {
        id: "theme",
        label: "theme.css",
        icon: <PaletteIcon className="size-4" />,
      },
    ],
  },
  {
    id: "docs",
    label: "docs",
    children: [
      {
        id: "getting-started",
        label: "getting-started.mdx",
        icon: <FileTextIcon className="size-4" />,
      },
      {
        id: "components-doc",
        label: "components.mdx",
        icon: <FileTextIcon className="size-4" />,
      },
    ],
  },
  { id: "package", label: "package.json" },
]

const meta = {
  title: "Advanced/Navigation",
  tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Tree: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <TreeView
        items={tree}
        defaultExpandedIds={["components", "docs"]}
        defaultSelectedIds={["button"]}
      />
    </div>
  ),
}

const steps = [
  {
    value: "details",
    title: "Project details",
    description: "Name and framework",
  },
  { value: "theme", title: "Theme", description: "Colors and radius" },
  { value: "review", title: "Review", description: "Confirm setup" },
]

export const StepperFlow: Story = {
  render: () => (
    <div className="w-full max-w-3xl rounded-xl border bg-card p-6">
      <Stepper defaultValue="details" linear>
        <StepperList>
          {steps.map((step, index) => (
            <StepperItem key={step.value} value={step.value}>
              <StepperTrigger>
                <StepperIndicator />
                <span>
                  <StepperTitle>{step.title}</StepperTitle>
                  <StepperDescription>{step.description}</StepperDescription>
                </span>
              </StepperTrigger>
              {index < steps.length - 1 ? <StepperSeparator /> : null}
            </StepperItem>
          ))}
        </StepperList>
        {steps.map((step) => (
          <StepperContent
            key={step.value}
            value={step.value}
            className="rounded-lg bg-muted/50 p-5"
          >
            <h3 className="font-medium">{step.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {step.description}
            </p>
          </StepperContent>
        ))}
        <div className="flex justify-end gap-2">
          <StepperPrevious>Previous</StepperPrevious>
          <StepperNext>Next</StepperNext>
        </div>
      </Stepper>
    </div>
  ),
}
