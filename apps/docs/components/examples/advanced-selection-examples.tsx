"use client"

import * as React from "react"
import {
  Code2Icon,
  FileTextIcon,
  PaletteIcon,
  SettingsIcon,
} from "lucide-react"
import { Calendar } from "@aq-ui/registry/components/calendar"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@aq-ui/registry/components/carousel"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@aq-ui/registry/components/combobox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@aq-ui/registry/components/command"
import { DatePicker } from "@aq-ui/registry/components/date-picker"

function CalendarExample() {
  const [date, setDate] = React.useState<Date | undefined>(
    new Date(2026, 7, 15)
  )
  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      defaultMonth={new Date(2026, 7, 1)}
      className="rounded-xl border"
    />
  )
}

function DatePickerExample() {
  return <DatePicker defaultValue={new Date(2026, 7, 15)} />
}

function CarouselExample() {
  return (
    <Carousel className="w-full max-w-sm">
      <CarouselContent>
        {["Foundation", "Editors", "Advanced"].map((label, index) => (
          <CarouselItem key={label}>
            <div className="flex aspect-[5/3] items-center justify-center rounded-xl border bg-muted/40">
              <div className="text-center">
                <p className="text-3xl font-bold tabular-nums">0{index + 1}</p>
                <p className="mt-1 text-sm text-muted-foreground">{label}</p>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="start-2" />
      <CarouselNext className="end-2" />
    </Carousel>
  )
}

function CommandExample() {
  return (
    <Command className="h-72 w-full max-w-lg border shadow-sm">
      <CommandInput placeholder="Search commands…" />
      <CommandList>
        <CommandEmpty>No command found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          <CommandItem>
            <Code2Icon /> Components <CommandShortcut>⌘K</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <FileTextIcon /> Documentation
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Preferences">
          <CommandItem>
            <PaletteIcon /> Change theme
          </CommandItem>
          <CommandItem>
            <SettingsIcon /> Settings
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

const frameworks = ["Next.js", "Vite", "React Router", "Astro"]

function ComboboxExample() {
  return (
    <Combobox items={frameworks} defaultValue="Next.js">
      <ComboboxInput
        aria-label="Framework"
        placeholder="Select a framework…"
        showClear
      />
      <ComboboxContent>
        <ComboboxEmpty>No framework found.</ComboboxEmpty>
        <ComboboxList>
          {frameworks.map((framework) => (
            <ComboboxItem key={framework} value={framework}>
              {framework}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

const AdvancedSelectionExamples: Record<string, React.ComponentType> = {
  calendar: CalendarExample,
  "date-picker": DatePickerExample,
  carousel: CarouselExample,
  command: CommandExample,
  combobox: ComboboxExample,
}

interface AdvancedSelectionRendererProps {
  name: string
}

function AdvancedSelectionRenderer({ name }: AdvancedSelectionRendererProps) {
  const Example = AdvancedSelectionExamples[name]

  if (!Example) {
    return <p role="alert">The preview for {name} is unavailable.</p>
  }

  return <Example />
}

export { AdvancedSelectionRenderer }
