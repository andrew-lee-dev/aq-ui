"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"

import { Button } from "@aq-ui/registry/components/button"
import { cn } from "@aq-ui/registry/lib/utils"

type StepperOrientation = "horizontal" | "vertical"

interface StepperContextValue {
  value?: string
  setValue: (value: string) => void
  orientation: StepperOrientation
  linear: boolean
  register: (value: string) => () => void
  values: string[]
}

const StepperContext = React.createContext<StepperContextValue | null>(null)
const StepperItemContext = React.createContext<{
  value: string
  disabled?: boolean
  completed?: boolean
} | null>(null)

interface StepperProps extends React.ComponentProps<"div"> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  orientation?: StepperOrientation
  linear?: boolean
}

const Stepper = React.forwardRef<React.ComponentRef<"div">, StepperProps>(
  function Stepper(
    {
      value,
      defaultValue,
      onValueChange,
      orientation = "horizontal",
      linear = false,
      className,
      children,
      ...props
    },
    ref
  ) {
    const [internalValue, setInternalValue] = React.useState(defaultValue)
    const [values, setValues] = React.useState<string[]>([])
    const current = value ?? internalValue
    const setValue = React.useCallback(
      (next: string) => {
        if (value === undefined) setInternalValue(next)
        onValueChange?.(next)
      },
      [onValueChange, value]
    )
    const register = React.useCallback((item: string) => {
      setValues((currentValues) =>
        currentValues.includes(item) ? currentValues : [...currentValues, item]
      )
      return () =>
        setValues((currentValues) =>
          currentValues.filter((value) => value !== item)
        )
    }, [])

    return (
      <StepperContext.Provider
        value={{
          value: current,
          setValue,
          orientation,
          linear,
          register,
          values,
        }}
      >
        <div
          ref={ref}
          data-slot="stepper"
          data-orientation={orientation}
          className={cn("flex flex-col gap-4", className)}
          {...props}
        >
          {children}
        </div>
      </StepperContext.Provider>
    )
  }
)
Stepper.displayName = "Stepper"

const StepperList = React.forwardRef<
  React.ComponentRef<"ol">,
  React.ComponentProps<"ol">
>(function StepperList({ className, ...props }, ref) {
  const context = useStepperContext()
  return (
    <ol
      ref={ref}
      data-slot="stepper-list"
      data-orientation={context.orientation}
      className={cn(
        "flex gap-2 data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    />
  )
})
StepperList.displayName = "StepperList"

interface StepperItemProps extends React.ComponentProps<"li"> {
  value: string
  disabled?: boolean
  completed?: boolean
}

const StepperItem = React.forwardRef<
  React.ComponentRef<"li">,
  StepperItemProps
>(function StepperItem(
  { value, disabled, completed, className, children, ...props },
  ref
) {
  const context = useStepperContext()
  const { register } = context
  React.useEffect(() => register(value), [register, value])
  const active = context.value === value
  const index = context.values.indexOf(value)
  const currentIndex = context.value
    ? context.values.indexOf(context.value)
    : -1
  const done = completed ?? (index >= 0 && currentIndex > index)
  return (
    <StepperItemContext.Provider value={{ value, disabled, completed: done }}>
      <li
        ref={ref}
        data-slot="stepper-item"
        data-state={active ? "active" : done ? "complete" : "inactive"}
        className={cn(
          "group/step relative flex flex-1 items-start gap-3 data-[orientation=vertical]:flex-none",
          className
        )}
        {...props}
      >
        {children}
      </li>
    </StepperItemContext.Provider>
  )
})
StepperItem.displayName = "StepperItem"

const StepperTrigger = React.forwardRef<
  React.ComponentRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(function StepperTrigger({ className, children, ...props }, ref) {
  const context = useStepperContext()
  const item = useStepperItemContext()
  const active = context.value === item.value
  const currentIndex = context.value
    ? context.values.indexOf(context.value)
    : -1
  const targetIndex = context.values.indexOf(item.value)
  const blocked =
    item.disabled || (context.linear && targetIndex > currentIndex + 1)
  return (
    <Button
      ref={ref}
      data-slot="stepper-trigger"
      data-state={active ? "active" : item.completed ? "complete" : "inactive"}
      variant="ghost"
      className={cn(
        "h-auto justify-start gap-3 p-0 text-start hover:bg-transparent",
        className
      )}
      {...props}
      disabled={blocked}
      aria-current={active ? "step" : undefined}
      onClick={(event) => {
        props.onClick?.(event)
        if (!event.defaultPrevented) context.setValue(item.value)
      }}
    >
      {children}
    </Button>
  )
})
StepperTrigger.displayName = "StepperTrigger"

const StepperIndicator = React.forwardRef<
  React.ComponentRef<"span">,
  React.ComponentProps<"span">
>(function StepperIndicator({ className, children, ...props }, ref) {
  const context = useStepperContext()
  const item = useStepperItemContext()
  const index = context.values.indexOf(item.value)
  return (
    <span
      ref={ref}
      data-slot="stepper-indicator"
      data-state={
        context.value === item.value
          ? "active"
          : item.completed
            ? "complete"
            : "inactive"
      }
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full border bg-background text-sm font-medium group-data-[state=active]/step:border-primary group-data-[state=active]/step:bg-primary group-data-[state=active]/step:text-primary-foreground group-data-[state=complete]/step:border-primary group-data-[state=complete]/step:text-primary",
        className
      )}
      {...props}
    >
      {children ??
        (item.completed ? <CheckIcon className="size-4" /> : index + 1)}
    </span>
  )
})
StepperIndicator.displayName = "StepperIndicator"

const StepperTitle = React.forwardRef<
  React.ComponentRef<"span">,
  React.ComponentProps<"span">
>(function StepperTitle({ className, ...props }, ref) {
  return (
    <span
      ref={ref}
      data-slot="stepper-title"
      className={cn("block font-medium", className)}
      {...props}
    />
  )
})
StepperTitle.displayName = "StepperTitle"

const StepperDescription = React.forwardRef<
  React.ComponentRef<"span">,
  React.ComponentProps<"span">
>(function StepperDescription({ className, ...props }, ref) {
  return (
    <span
      ref={ref}
      data-slot="stepper-description"
      className={cn("block text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
StepperDescription.displayName = "StepperDescription"

const StepperSeparator = React.forwardRef<
  React.ComponentRef<"span">,
  React.ComponentProps<"span">
>(function StepperSeparator({ className, ...props }, ref) {
  const context = useStepperContext()
  return (
    <span
      ref={ref}
      aria-hidden
      data-slot="stepper-separator"
      data-orientation={context.orientation}
      className={cn(
        "mt-4 h-px flex-1 bg-border data-[orientation=vertical]:ms-4 data-[orientation=vertical]:mt-0 data-[orientation=vertical]:h-8 data-[orientation=vertical]:w-px data-[orientation=vertical]:flex-none",
        className
      )}
      {...props}
    />
  )
})
StepperSeparator.displayName = "StepperSeparator"

const StepperContent = React.forwardRef<
  React.ComponentRef<"div">,
  React.ComponentProps<"div"> & { value: string }
>(function StepperContent({ value, className, ...props }, ref) {
  const context = useStepperContext()
  if (context.value !== value) return null
  return (
    <div
      ref={ref}
      data-slot="stepper-content"
      data-state="active"
      className={cn("outline-none", className)}
      {...props}
    />
  )
})
StepperContent.displayName = "StepperContent"

const StepperPrevious = React.forwardRef<
  React.ComponentRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(function StepperPrevious({ className, ...props }, ref) {
  const context = useStepperContext()
  const index = context.value ? context.values.indexOf(context.value) : -1
  return (
    <Button
      ref={ref}
      type="button"
      variant="outline"
      className={className}
      {...props}
      disabled={index <= 0 || props.disabled}
      onClick={(event) => {
        props.onClick?.(event)
        const previous = context.values[index - 1]
        if (!event.defaultPrevented && previous) context.setValue(previous)
      }}
    />
  )
})
StepperPrevious.displayName = "StepperPrevious"

const StepperNext = React.forwardRef<
  React.ComponentRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(function StepperNext({ className, ...props }, ref) {
  const context = useStepperContext()
  const index = context.value ? context.values.indexOf(context.value) : -1
  return (
    <Button
      ref={ref}
      type="button"
      className={className}
      {...props}
      disabled={
        index < 0 || index >= context.values.length - 1 || props.disabled
      }
      onClick={(event) => {
        props.onClick?.(event)
        const next = context.values[index + 1]
        if (!event.defaultPrevented && next) context.setValue(next)
      }}
    />
  )
})
StepperNext.displayName = "StepperNext"

function useStepperContext() {
  const context = React.useContext(StepperContext)
  if (!context)
    throw new Error("Stepper components must be used within <Stepper>.")
  return context
}

function useStepperItemContext() {
  const context = React.useContext(StepperItemContext)
  if (!context)
    throw new Error("Stepper item parts must be used within <StepperItem>.")
  return context
}

export {
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
  type StepperProps,
}
