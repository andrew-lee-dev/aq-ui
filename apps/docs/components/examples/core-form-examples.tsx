"use client"

import * as React from "react"
import {
  InboxIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react"
import { Button } from "@aq-ui/registry/components/button"
import { Checkbox } from "@aq-ui/registry/components/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@aq-ui/registry/components/collapsible"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@aq-ui/registry/components/dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@aq-ui/registry/components/empty"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@aq-ui/registry/components/field"
import { Input } from "@aq-ui/registry/components/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@aq-ui/registry/components/input-group"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@aq-ui/registry/components/input-otp"
import { Kbd, KbdGroup } from "@aq-ui/registry/components/kbd"
import { Label } from "@aq-ui/registry/components/label"
import {
  NativeSelect,
  NativeSelectOption,
} from "@aq-ui/registry/components/native-select"

function CheckboxExample() {
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <Checkbox id="terms-demo" defaultChecked />
        <Label htmlFor="terms-demo">Accept terms and conditions</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="updates-demo" />
        <Label htmlFor="updates-demo">Email me product updates</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="disabled-demo" disabled />
        <Label htmlFor="disabled-demo">Unavailable option</Label>
      </div>
    </div>
  )
}

function CollapsibleExample() {
  return (
    <Collapsible className="w-full max-w-md rounded-xl border p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">3 environment variables</p>
          <p className="text-xs text-muted-foreground">
            Values are encrypted at rest.
          </p>
        </div>
        <CollapsibleTrigger
          aria-label="Toggle environment variables"
          render={<Button size="icon-sm" variant="ghost" />}
        >
          <MoreHorizontalIcon />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="mt-4 grid gap-2 font-mono text-xs">
        {["DATABASE_URL", "SESSION_SECRET", "NEXT_PUBLIC_APP_URL"].map(
          (variable) => (
            <div key={variable} className="rounded-md bg-muted px-3 py-2">
              {variable}
            </div>
          )
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

function DialogExample() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Edit profile
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Update the name shown to other workspace members.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="dialog-name-demo">Display name</Label>
          <Input id="dialog-name-demo" defaultValue="Anh Khoa" />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <DialogClose render={<Button />}>Save changes</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EmptyExample() {
  return (
    <Empty className="w-full max-w-lg border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon />
        </EmptyMedia>
        <EmptyTitle>No messages yet</EmptyTitle>
        <EmptyDescription>
          Start a conversation and keep all project decisions in one place.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm">
          <PlusIcon data-icon="inline-start" /> New message
        </Button>
      </EmptyContent>
    </Empty>
  )
}

function FieldExample() {
  const [email, setEmail] = React.useState("hello@aq-ui.dev")
  const invalid = !email.includes("@")

  return (
    <form
      className="w-full max-w-md"
      onSubmit={(event) => event.preventDefault()}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="field-name-demo">Project name</FieldLabel>
          <Input id="field-name-demo" defaultValue="aq-ui docs" />
          <FieldDescription>Use a short, recognizable name.</FieldDescription>
        </Field>
        <Field data-invalid={invalid}>
          <FieldLabel htmlFor="field-email-demo">Contact email</FieldLabel>
          <Input
            id="field-email-demo"
            value={email}
            aria-invalid={invalid}
            onChange={(event) => setEmail(event.currentTarget.value)}
          />
          {invalid ? (
            <FieldError>Enter a valid email address.</FieldError>
          ) : null}
        </Field>
        <Button type="submit" className="justify-self-start">
          Save changes
        </Button>
      </FieldGroup>
    </form>
  )
}

function InputExample() {
  return (
    <div className="grid w-full max-w-sm gap-3">
      <Input
        aria-label="Email address"
        type="email"
        placeholder="you@example.com"
      />
      <Input aria-label="Disabled input" value="Disabled" disabled readOnly />
      <Input
        aria-label="Invalid email"
        defaultValue="invalid-email"
        aria-invalid
      />
    </div>
  )
}

function InputGroupExample() {
  return (
    <div className="grid w-full max-w-md gap-3">
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          aria-label="Search documentation"
          placeholder="Search docs..."
        />
        <InputGroupAddon align="inline-end">
          <Kbd>/</Kbd>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Project URL" defaultValue="aq-ui.dev" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton>Copy</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

function InputOTPExample() {
  const [value, setValue] = React.useState("")

  return (
    <div className="grid justify-items-center gap-3">
      <InputOTP
        aria-label="Verification code"
        maxLength={6}
        value={value}
        onChange={setValue}
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <p className="text-xs text-muted-foreground">
        {value.length === 6
          ? "Code ready to verify"
          : "Enter your 6-digit code"}
      </p>
    </div>
  )
}

function KbdExample() {
  return (
    <div className="flex flex-wrap items-center gap-5 text-sm">
      <span className="flex items-center gap-2">
        Command palette{" "}
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </span>
      <span className="flex items-center gap-2">
        Save{" "}
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <Kbd>S</Kbd>
        </KbdGroup>
      </span>
      <span className="flex items-center gap-2">
        Close <Kbd>Esc</Kbd>
      </span>
    </div>
  )
}

function LabelExample() {
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor="label-email-demo">Work email</Label>
      <Input
        id="label-email-demo"
        type="email"
        placeholder="name@company.com"
      />
      <p className="text-xs text-muted-foreground">
        We only use this address for account notifications.
      </p>
    </div>
  )
}

function NativeSelectExample() {
  return (
    <div className="grid gap-2">
      <Label htmlFor="native-timezone-demo">Timezone</Label>
      <NativeSelect id="native-timezone-demo" defaultValue="asia-ho-chi-minh">
        <NativeSelectOption value="asia-ho-chi-minh">
          Asia / Ho Chi Minh
        </NativeSelectOption>
        <NativeSelectOption value="europe-london">
          Europe / London
        </NativeSelectOption>
        <NativeSelectOption value="america-new-york">
          America / New York
        </NativeSelectOption>
      </NativeSelect>
    </div>
  )
}

const CoreFormExamples: Record<string, React.ComponentType> = {
  checkbox: CheckboxExample,
  collapsible: CollapsibleExample,
  dialog: DialogExample,
  empty: EmptyExample,
  field: FieldExample,
  input: InputExample,
  "input-group": InputGroupExample,
  "input-otp": InputOTPExample,
  kbd: KbdExample,
  label: LabelExample,
  "native-select": NativeSelectExample,
}

interface CoreFormRendererProps {
  name: string
}

function CoreFormRenderer({ name }: CoreFormRendererProps) {
  const Example = CoreFormExamples[name]

  if (!Example) {
    return <p role="alert">The preview for {name} is unavailable.</p>
  }

  return <Example />
}

export { CoreFormRenderer }
