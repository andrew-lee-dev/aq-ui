import * as React from "react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Button } from "@aq-ui/registry/components/button"
import { Checkbox } from "@aq-ui/registry/components/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@aq-ui/registry/components/field"
import { Input } from "@aq-ui/registry/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@aq-ui/registry/components/select"
import { Textarea } from "@aq-ui/registry/components/textarea"

const meta = {
  title: "Core/Form",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A complete accessible form surface composed from Field, Input, Select, Checkbox, and Textarea.",
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function ProfileForm() {
  const [email, setEmail] = React.useState("hello@aq-ui.dev")

  return (
    <form
      className="w-full max-w-xl rounded-xl border bg-card p-6 text-card-foreground shadow-sm"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Project profile</h2>
        <p className="text-sm text-muted-foreground">
          These details are visible to workspace members.
        </p>
      </div>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="project-name">Project name</FieldLabel>
          <Input id="project-name" defaultValue="aq-ui documentation" />
          <FieldDescription>Use a short, recognizable name.</FieldDescription>
        </Field>
        <Field data-invalid={!email.includes("@")}>
          <FieldLabel htmlFor="contact-email">Contact email</FieldLabel>
          <Input
            id="contact-email"
            type="email"
            value={email}
            aria-invalid={!email.includes("@")}
            aria-describedby="contact-email-help"
            onChange={(event) => setEmail(event.currentTarget.value)}
          />
          <FieldDescription id="contact-email-help">
            Release notifications will be sent here.
          </FieldDescription>
          {!email.includes("@") ? (
            <FieldError>Enter a valid email.</FieldError>
          ) : null}
        </Field>
        <Field>
          <FieldLabel htmlFor="framework">Framework</FieldLabel>
          <Select defaultValue="next">
            <SelectTrigger id="framework" className="w-full">
              <SelectValue placeholder="Select a framework" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="next">Next.js</SelectItem>
              <SelectItem value="vite">Vite</SelectItem>
              <SelectItem value="router">React Router</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            defaultValue="A reusable interface built with aq-ui."
            rows={4}
          />
        </Field>
        <Field orientation="horizontal">
          <Checkbox id="release-notes" defaultChecked />
          <FieldLabel htmlFor="release-notes">Send me release notes</FieldLabel>
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit">Save changes</Button>
        </div>
      </FieldGroup>
    </form>
  )
}

export const CompleteForm: Story = {
  render: () => <ProfileForm />,
}

export const InvalidState: Story = {
  render: () => (
    <div className="w-full max-w-sm">
      <Field data-invalid>
        <FieldLabel htmlFor="invalid-email">Email</FieldLabel>
        <Input
          id="invalid-email"
          defaultValue="not-an-email"
          aria-invalid
          aria-describedby="invalid-email-error"
        />
        <FieldError id="invalid-email-error">
          Enter a valid email address.
        </FieldError>
      </Field>
    </div>
  ),
}
