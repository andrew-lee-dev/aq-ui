import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ArrowRightIcon, Loader2Icon, MailIcon, PlusIcon } from "lucide-react"

import { Button, buttonVariants } from "@aq-ui/registry/components/button"

import { buttonSizeOptions, buttonVariantOptions } from "@/lib/button-docs"

const meta = {
  title: "Core/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    children: "Create project",
    loading: false,
    size: "default",
    variant: "default",
  },
  argTypes: {
    size: {
      control: "select",
      options: buttonSizeOptions,
      table: { defaultValue: { summary: "default" } },
    },
    variant: {
      control: "select",
      options: buttonVariantOptions,
      table: { defaultValue: { summary: "default" } },
    },
    disabled: {
      control: "boolean",
      table: { defaultValue: { summary: "false" } },
    },
    loading: {
      control: "boolean",
      table: { defaultValue: { summary: "false" } },
    },
    loadingText: {
      control: "text",
      table: { defaultValue: { summary: "children" } },
    },
    loadingPosition: {
      control: "inline-radio",
      options: ["start", "end"],
      table: { defaultValue: { summary: "start" } },
    },
    loadingIndicator: {
      control: false,
      table: { defaultValue: { summary: "spinner" } },
    },
    focusableWhenDisabled: {
      control: "boolean",
      table: { defaultValue: { summary: "false" } },
    },
    nativeButton: {
      control: "boolean",
      table: { defaultValue: { summary: "true" } },
    },
    type: {
      control: "select",
      options: ["button", "submit", "reset"],
      table: { defaultValue: { summary: "button" } },
    },
    render: {
      control: false,
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="link">Undo</Button>
    </div>
  ),
}

export const SizesAndIcons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="xs">
        <PlusIcon data-icon="inline-start" />
        Extra small
      </Button>
      <Button size="sm">
        <MailIcon data-icon="inline-start" />
        Small
      </Button>
      <Button>
        Continue
        <ArrowRightIcon data-icon="inline-end" />
      </Button>
      <Button size="lg">Large button</Button>
      <Button size="icon-xs" aria-label="Add item, extra small">
        <PlusIcon />
      </Button>
      <Button size="icon-sm" aria-label="Add item, small">
        <PlusIcon />
      </Button>
      <Button size="icon" aria-label="Add item">
        <PlusIcon />
      </Button>
      <Button size="icon-lg" aria-label="Add item, large">
        <PlusIcon />
      </Button>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button disabled>Disabled</Button>
      <Button disabled focusableWhenDisabled>
        Focusable when disabled
      </Button>
      <Button loading loadingText="Saving…">
        Save changes
      </Button>
      <Button
        loading
        loadingText="Uploading…"
        loadingPosition="end"
        loadingIndicator={
          <Loader2Icon className="animate-spin" aria-hidden="true" />
        }
      >
        Upload file
      </Button>
    </div>
  ),
}

export const NavigationAndFormSemantics: Story = {
  render: () => (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <a
          href="#button-story-destination"
          className={buttonVariants({ variant: "link" })}
        >
          Go to destination
          <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
        </a>
        <span id="button-story-destination" className="text-sm">
          Link destination
        </span>
      </div>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => event.preventDefault()}
      >
        <Button type="button" variant="outline">
          Ordinary action
        </Button>
        <Button type="submit">Submit form</Button>
      </form>
    </div>
  ),
}
