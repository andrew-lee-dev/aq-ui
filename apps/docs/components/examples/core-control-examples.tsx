"use client"

import * as React from "react"
import { Button } from "@aq-ui/registry/components/button"
import { Label } from "@aq-ui/registry/components/label"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@aq-ui/registry/components/progress"
import {
  RadioGroup,
  RadioGroupItem,
} from "@aq-ui/registry/components/radio-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@aq-ui/registry/components/select"
import { Separator } from "@aq-ui/registry/components/separator"
import { Skeleton } from "@aq-ui/registry/components/skeleton"
import { Slider } from "@aq-ui/registry/components/slider"
import { Spinner } from "@aq-ui/registry/components/spinner"
import { Switch } from "@aq-ui/registry/components/switch"

function ProgressExample() {
  const [value, setValue] = React.useState(68)

  return (
    <div className="grid w-full max-w-md gap-4">
      <Progress value={value}>
        <ProgressLabel>Profile setup</ProgressLabel>
        <ProgressValue />
      </Progress>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setValue((current) => Math.max(0, current - 10))}
        >
          Previous
        </Button>
        <Button
          size="sm"
          onClick={() => setValue((current) => Math.min(100, current + 10))}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}

function RadioGroupExample() {
  return (
    <RadioGroup
      defaultValue="team"
      aria-label="Choose a plan"
      className="max-w-sm"
    >
      {[
        ["starter", "Starter", "For personal projects"],
        ["team", "Team", "For growing product teams"],
        ["enterprise", "Enterprise", "For custom security needs"],
      ].map(([value, title, description]) => (
        <Label
          key={value}
          htmlFor={`plan-${value}`}
          className="rounded-lg border p-3"
        >
          <RadioGroupItem id={`plan-${value}`} value={value} />
          <span className="grid gap-0.5">
            <span>{title}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {description}
            </span>
          </span>
        </Label>
      ))}
    </RadioGroup>
  )
}

function SelectExample() {
  return (
    <div className="grid gap-2">
      <Label htmlFor="framework-select-demo">Framework</Label>
      <Select defaultValue="next">
        <SelectTrigger id="framework-select-demo" className="w-64">
          <SelectValue placeholder="Choose a framework" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>React frameworks</SelectLabel>
            <SelectItem value="next">Next.js</SelectItem>
            <SelectItem value="router">React Router</SelectItem>
            <SelectItem value="vite">Vite</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

function SeparatorExample() {
  return (
    <div className="w-full max-w-md rounded-xl border p-5">
      <div>
        <p className="font-medium">aq-ui</p>
        <p className="text-sm text-muted-foreground">
          Accessible React components
        </p>
      </div>
      <Separator className="my-4" />
      <div className="flex h-5 items-center gap-4 text-sm">
        <span>Docs</span>
        <Separator orientation="vertical" />
        <span>Components</span>
        <Separator orientation="vertical" />
        <span>Hooks</span>
      </div>
    </div>
  )
}

function SkeletonExample() {
  return (
    <div className="flex w-full max-w-md items-center gap-4 rounded-xl border p-4">
      <Skeleton className="size-12 shrink-0 rounded-full" />
      <div className="grid flex-1 gap-2">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  )
}

function SliderExample() {
  const [value, setValue] = React.useState<readonly number[]>([64])

  return (
    <div className="grid w-full max-w-md gap-3">
      <div className="flex items-center justify-between text-sm">
        <Label id="volume-slider-label">Volume</Label>
        <span className="font-mono text-muted-foreground">{value[0]}%</span>
      </div>
      <Slider
        aria-labelledby="volume-slider-label"
        value={value}
        onValueChange={(nextValue) =>
          setValue(typeof nextValue === "number" ? [nextValue] : nextValue)
        }
        max={100}
        step={1}
      />
    </div>
  )
}

function SpinnerExample() {
  return (
    <div className="flex flex-wrap items-center gap-5">
      <Spinner />
      <Button disabled>
        <Spinner /> Saving
      </Button>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="size-5" /> Syncing changes…
      </div>
    </div>
  )
}

function SwitchExample() {
  const [enabled, setEnabled] = React.useState(true)

  return (
    <div className="flex w-full max-w-md items-center justify-between rounded-xl border p-4">
      <div>
        <Label htmlFor="notifications-switch-demo">Push notifications</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          {enabled ? "Enabled for this device" : "Disabled for this device"}
        </p>
      </div>
      <Switch
        id="notifications-switch-demo"
        checked={enabled}
        onCheckedChange={setEnabled}
      />
    </div>
  )
}

const CoreControlExamples: Record<string, React.ComponentType> = {
  progress: ProgressExample,
  "radio-group": RadioGroupExample,
  select: SelectExample,
  separator: SeparatorExample,
  skeleton: SkeletonExample,
  slider: SliderExample,
  spinner: SpinnerExample,
  switch: SwitchExample,
}

interface CoreControlRendererProps {
  name: string
}

function CoreControlRenderer({ name }: CoreControlRendererProps) {
  const Example = CoreControlExamples[name]

  if (!Example) {
    return <p role="alert">The preview for {name} is unavailable.</p>
  }

  return <Example />
}

export { CoreControlRenderer }
