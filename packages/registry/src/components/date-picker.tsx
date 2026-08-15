"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@aq-ui/registry/components/button"
import { Calendar } from "@aq-ui/registry/components/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@aq-ui/registry/components/popover"
import { cn } from "@aq-ui/registry/lib/utils"

interface DatePickerProps extends Omit<
  React.ComponentPropsWithoutRef<"div">,
  "children" | "defaultValue" | "onChange"
> {
  value?: Date
  defaultValue?: Date
  onValueChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  fromDate?: Date
  toDate?: Date
  locale?: React.ComponentProps<typeof Calendar>["locale"]
  formatDate?: (date: Date) => string
  className?: string
  calendarClassName?: string
  name?: string
}

const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  function DatePicker(
    {
      value,
      defaultValue,
      onValueChange,
      placeholder = "Pick a date",
      disabled,
      fromDate,
      toDate,
      locale,
      formatDate = (date) => format(date, "PPP"),
      className,
      calendarClassName,
      name,
      ...props
    },
    ref
  ) {
    const [internalValue, setInternalValue] = React.useState<Date | undefined>(
      defaultValue
    )
    const selected = value !== undefined ? value : internalValue

    const select = React.useCallback(
      (date: Date | undefined) => {
        if (value === undefined) setInternalValue(date)
        onValueChange?.(date)
      },
      [onValueChange, value]
    )

    return (
      <div
        ref={ref}
        data-slot="date-picker"
        className={cn("inline-flex", className)}
        {...props}
      >
        {name ? (
          <input
            type="hidden"
            name={name}
            value={selected?.toISOString() ?? ""}
          />
        ) : null}
        <Popover>
          <PopoverTrigger
            disabled={disabled}
            render={
              <Button
                variant="outline"
                className={cn(
                  "w-64 justify-start text-start font-normal",
                  !selected && "text-muted-foreground"
                )}
              />
            }
          >
            <CalendarIcon data-icon="inline-start" />
            {selected ? formatDate(selected) : placeholder}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={select}
              startMonth={fromDate}
              endMonth={toDate}
              disabled={(date) =>
                (fromDate ? date < fromDate : false) ||
                (toDate ? date > toDate : false)
              }
              locale={locale}
              className={calendarClassName}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    )
  }
)
DatePicker.displayName = "DatePicker"

export { DatePicker, type DatePickerProps }
