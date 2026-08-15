"use client"

import * as React from "react"
import {
  AlertCircleIcon,
  ArrowRightIcon,
  CheckIcon,
  CloudIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@aq-ui/registry/components/accordion"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@aq-ui/registry/components/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@aq-ui/registry/components/alert-dialog"
import { AspectRatio } from "@aq-ui/registry/components/aspect-ratio"
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@aq-ui/registry/components/avatar"
import { Badge } from "@aq-ui/registry/components/badge"
import { Button, buttonVariants } from "@aq-ui/registry/components/button"
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "@aq-ui/registry/components/button-group"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@aq-ui/registry/components/card"

import {
  buttonSizeOptions,
  buttonVariantOptions,
  type ButtonSizeOption,
  type ButtonVariantOption,
} from "@/lib/button-docs"

function AccordionExample() {
  return (
    <Accordion className="w-full max-w-lg" defaultValue={["shipping"]}>
      <AccordionItem value="shipping">
        <AccordionTrigger>How does shipping work?</AccordionTrigger>
        <AccordionContent>
          We calculate delivery at checkout and send tracking as soon as your
          order leaves the studio.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="returns">
        <AccordionTrigger>Can I return an item?</AccordionTrigger>
        <AccordionContent>
          Yes. Unused items can be returned within 30 days.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="support">
        <AccordionTrigger>Where can I get help?</AccordionTrigger>
        <AccordionContent>
          Our support team replies on business days within a few hours.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

function AlertExample() {
  return (
    <div className="grid w-full max-w-xl gap-3">
      <Alert>
        <CloudIcon />
        <AlertTitle>Deployment complete</AlertTitle>
        <AlertDescription>
          Production is running version 1.8.0.
        </AlertDescription>
        <AlertAction>
          <Button size="xs" variant="outline">
            View
          </Button>
        </AlertAction>
      </Alert>
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>Payment method expired</AlertTitle>
        <AlertDescription>
          Update your billing details to prevent an interruption.
        </AlertDescription>
      </Alert>
    </div>
  )
}

function AlertDialogExample() {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        Delete workspace
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete this workspace?</AlertDialogTitle>
          <AlertDialogDescription>
            This action permanently removes the workspace and all of its data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function AspectRatioExample() {
  return (
    <AspectRatio
      ratio={16 / 9}
      className="w-full max-w-lg overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-400 shadow-sm"
    >
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-6 text-white">
        <span className="text-xs font-medium tracking-widest uppercase">
          16 / 9
        </span>
        <span className="mt-1 text-2xl font-semibold">
          Build for every screen
        </span>
      </div>
    </AspectRatio>
  )
}

function AvatarExample() {
  return (
    <div className="flex items-center gap-8">
      <Avatar size="lg">
        <AvatarFallback>AK</AvatarFallback>
        <AvatarBadge aria-label="Online" />
      </Avatar>
      <AvatarGroup>
        <Avatar>
          <AvatarFallback>AN</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>ML</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>DT</AvatarFallback>
        </Avatar>
        <AvatarGroupCount>+4</AvatarGroupCount>
      </AvatarGroup>
    </div>
  )
}

function BadgeExample() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>New</Badge>
      <Badge variant="secondary">In progress</Badge>
      <Badge variant="outline">
        <CheckIcon /> Ready
      </Badge>
      <Badge variant="destructive">Action needed</Badge>
      <Badge variant="ghost">Draft</Badge>
    </div>
  )
}

function ButtonExample() {
  const variantId = React.useId()
  const sizeId = React.useId()
  const iconId = React.useId()
  const [variant, setVariant] = React.useState<ButtonVariantOption>("default")
  const [size, setSize] = React.useState<ButtonSizeOption>("default")
  const [iconPosition, setIconPosition] = React.useState<
    "none" | "start" | "end"
  >("start")
  const [loadingPosition, setLoadingPosition] = React.useState<"start" | "end">(
    "start"
  )
  const [disabled, setDisabled] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [activationCount, setActivationCount] = React.useState(0)
  const [formStatus, setFormStatus] = React.useState(
    "Choose an explicit button type inside forms."
  )
  const iconOnly = size.startsWith("icon")
  const label = loading ? "Saving changes" : "Create project"

  return (
    <div className="grid w-full max-w-4xl gap-6">
      <fieldset className="rounded-xl border p-4">
        <legend className="px-1 text-sm font-semibold">
          Button playground
        </legend>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label htmlFor={variantId} className="grid gap-1.5 text-sm">
            <span className="font-medium">Variant</span>
            <select
              id={variantId}
              value={variant}
              className="h-9 rounded-lg border bg-background px-2"
              onChange={(event) =>
                setVariant(event.currentTarget.value as ButtonVariantOption)
              }
            >
              {buttonVariantOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor={sizeId} className="grid gap-1.5 text-sm">
            <span className="font-medium">Size</span>
            <select
              id={sizeId}
              value={size}
              className="h-9 rounded-lg border bg-background px-2"
              onChange={(event) =>
                setSize(event.currentTarget.value as ButtonSizeOption)
              }
            >
              {buttonSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor={iconId} className="grid gap-1.5 text-sm">
            <span className="font-medium">Icon</span>
            <select
              id={iconId}
              value={iconPosition}
              disabled={iconOnly || loading}
              className="h-9 rounded-lg border bg-background px-2 disabled:opacity-50"
              onChange={(event) =>
                setIconPosition(
                  event.currentTarget.value as "none" | "start" | "end"
                )
              }
            >
              <option value="none">none</option>
              <option value="start">inline start</option>
              <option value="end">inline end</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Loading indicator</span>
            <select
              value={loadingPosition}
              className="h-9 rounded-lg border bg-background px-2"
              onChange={(event) =>
                setLoadingPosition(event.currentTarget.value as "start" | "end")
              }
            >
              <option value="start">inline start</option>
              <option value="end">inline end</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-5 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={disabled}
              onChange={(event) => setDisabled(event.currentTarget.checked)}
            />
            Disabled
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={loading}
              onChange={(event) => setLoading(event.currentTarget.checked)}
            />
            Loading
          </label>
        </div>
      </fieldset>

      <div className="flex min-h-28 flex-col items-center justify-center gap-3 rounded-xl bg-muted/30 p-4">
        <Button
          type="button"
          variant={variant}
          size={size}
          disabled={disabled}
          loading={loading}
          loadingPosition={loadingPosition}
          loadingText={iconOnly ? null : "Saving changes"}
          aria-label={iconOnly ? label : undefined}
          onClick={() => setActivationCount((count) => count + 1)}
        >
          {iconOnly || iconPosition === "start" ? (
            <PlusIcon
              data-icon={iconOnly ? undefined : "inline-start"}
              aria-hidden="true"
            />
          ) : null}
          {!iconOnly ? <span>Create project</span> : null}
          {!iconOnly && iconPosition === "end" ? (
            <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
          ) : null}
        </Button>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Activated {activationCount} {activationCount === 1 ? "time" : "times"}
          .
        </p>
      </div>

      <section
        aria-labelledby="button-semantics-example"
        className="grid gap-3 rounded-xl border p-4"
      >
        <div>
          <h3 id="button-semantics-example" className="font-semibold">
            Navigation and form semantics
          </h3>
          <p className="text-sm text-muted-foreground">
            The link is a real anchor. The form controls declare their button
            types explicitly.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="#button-usage"
            className={buttonVariants({ variant: "link" })}
          >
            Usage guidance
            <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
          </a>
          <form
            className="flex flex-wrap gap-2"
            aria-label="Button type example"
            onSubmit={(event) => {
              event.preventDefault()
              setFormStatus("Form submitted.")
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormStatus("Ordinary action completed.")}
            >
              Ordinary action
            </Button>
            <Button type="submit">Submit form</Button>
          </form>
        </div>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {formStatus}
        </p>
      </section>
    </div>
  )
}

function ButtonGroupExample() {
  return (
    <div className="flex flex-wrap gap-4">
      <ButtonGroup>
        <Button variant="outline">Day</Button>
        <Button variant="outline">Week</Button>
        <Button variant="outline">Month</Button>
      </ButtonGroup>
      <ButtonGroup>
        <ButtonGroupText>USD</ButtonGroupText>
        <ButtonGroupSeparator />
        <Button variant="outline">1,250.00</Button>
      </ButtonGroup>
    </div>
  )
}

function CardExample() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Team plan</CardTitle>
        <CardDescription>Everything your growing team needs.</CardDescription>
        <CardAction>
          <Badge variant="secondary">Popular</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-semibold">$24</span>
          <span className="text-muted-foreground">/ member</span>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-muted-foreground">Billed monthly</span>
        <Button size="sm">
          Upgrade <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  )
}

const CoreFoundationExamples: Record<string, React.ComponentType> = {
  accordion: AccordionExample,
  alert: AlertExample,
  "alert-dialog": AlertDialogExample,
  "aspect-ratio": AspectRatioExample,
  avatar: AvatarExample,
  badge: BadgeExample,
  button: ButtonExample,
  "button-group": ButtonGroupExample,
  card: CardExample,
}

interface CoreFoundationRendererProps {
  name: string
}

function CoreFoundationRenderer({ name }: CoreFoundationRendererProps) {
  const Example = CoreFoundationExamples[name]

  if (!Example) {
    return <p role="alert">The preview for {name} is unavailable.</p>
  }

  return <Example />
}

export { CoreFoundationRenderer }
