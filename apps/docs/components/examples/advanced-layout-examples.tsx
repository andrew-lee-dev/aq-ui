"use client"

import * as React from "react"
import { Code2Icon, PaletteIcon, UserIcon } from "lucide-react"
import { Badge } from "@aq-ui/registry/components/badge"
import { Button } from "@aq-ui/registry/components/button"
import { DirectionProvider } from "@aq-ui/registry/components/direction"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@aq-ui/registry/components/item"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@aq-ui/registry/components/resizable"
import { ScrollArea } from "@aq-ui/registry/components/scroll-area"

function DirectionExample() {
  const [direction, setDirection] = React.useState<"ltr" | "rtl">("ltr")
  return (
    <DirectionProvider direction={direction}>
      <div
        dir={direction}
        className="w-full max-w-lg rounded-xl border bg-card p-5"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">Text direction</p>
            <p className="text-sm text-muted-foreground">
              Logical spacing and icons follow the active direction.
            </p>
          </div>
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {(["ltr", "rtl"] as const).map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={direction === value ? "default" : "ghost"}
                onClick={() => setDirection(value)}
              >
                {value.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-lg border p-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <UserIcon className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium">Direction-aware content</p>
            <p className="text-xs text-muted-foreground">
              Start and end adapt automatically.
            </p>
          </div>
          <Badge className="ms-auto" variant="outline">
            {direction.toUpperCase()}
          </Badge>
        </div>
      </div>
    </DirectionProvider>
  )
}

function ItemExample() {
  return (
    <ItemGroup className="w-full max-w-xl">
      <Item variant="outline">
        <ItemMedia
          variant="icon"
          className="rounded-md bg-primary/10 p-2 text-primary"
        >
          <Code2Icon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Component registry</ItemTitle>
          <ItemDescription>
            Install source files with an exact, cycle-free dependency graph.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button size="sm" variant="outline">
            Open
          </Button>
        </ItemActions>
      </Item>
      <Item variant="muted">
        <ItemMedia variant="icon" className="rounded-md bg-background p-2">
          <PaletteIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>aq-neutral theme</ItemTitle>
          <ItemDescription>
            Semantic OKLCH tokens with light and dark modes.
          </ItemDescription>
        </ItemContent>
        <Badge variant="secondary">Active</Badge>
      </Item>
    </ItemGroup>
  )
}

function ResizableExample() {
  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-72 w-full max-w-2xl overflow-hidden rounded-xl border"
    >
      <ResizablePanel defaultSize="40%" minSize="25%">
        <div className="flex size-full flex-col bg-muted/30 p-4">
          <p className="font-medium">Navigation</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Drag the handle to resize.
          </p>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="60%" minSize="30%">
        <div className="flex size-full items-center justify-center p-4 text-sm text-muted-foreground">
          Preview canvas
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

const releaseEntries = Array.from({ length: 12 }, (_, index) => ({
  version: `0.1.0-alpha.${12 - index}`,
  note:
    index % 2 === 0
      ? "Improved keyboard navigation and focus management."
      : "Added component examples and registry metadata.",
}))

function ScrollAreaExample() {
  return (
    <ScrollArea className="h-72 w-full max-w-lg rounded-xl border">
      <div className="p-4">
        <h3 className="mb-3 font-medium">Release history</h3>
        <div className="grid gap-3">
          {releaseEntries.map((entry) => (
            <div key={entry.version} className="rounded-lg border p-3">
              <p className="font-mono text-sm font-medium">{entry.version}</p>
              <p className="mt-1 text-sm text-muted-foreground">{entry.note}</p>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}

const AdvancedLayoutExamples: Record<string, React.ComponentType> = {
  direction: DirectionExample,
  item: ItemExample,
  resizable: ResizableExample,
  "scroll-area": ScrollAreaExample,
}

interface AdvancedLayoutRendererProps {
  name: string
}

function AdvancedLayoutRenderer({ name }: AdvancedLayoutRendererProps) {
  const Example = AdvancedLayoutExamples[name]

  if (!Example) {
    return <p role="alert">The preview for {name} is unavailable.</p>
  }

  return <Example />
}

export { AdvancedLayoutRenderer }
