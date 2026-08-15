"use client"

import * as React from "react"
import {
  ColorArea,
  ColorField,
  ColorPicker as ColorPickerPrimitive,
  ColorSlider,
  ColorSwatch,
  ColorThumb,
  Input,
  Label,
  SliderOutput,
  SliderTrack,
  parseColor,
  type Color,
  type ColorFormat,
} from "react-aria-components"

import { cn } from "@aq-ui/registry/lib/utils"

type SupportedColorFormat = Extract<
  ColorFormat,
  "hex" | "hexa" | "rgb" | "rgba" | "hsl" | "hsla" | "hsb" | "hsba"
>

interface ColorPickerProps extends Omit<
  React.ComponentPropsWithoutRef<"div">,
  "defaultValue" | "onChange"
> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string, color: Color) => void
  format?: SupportedColorFormat
  showAlpha?: boolean
  disabled?: boolean
  label?: React.ReactNode
  className?: string
  name?: string
}

const ColorPicker = React.forwardRef<HTMLDivElement, ColorPickerProps>(
  function ColorPicker(
    {
      value,
      defaultValue = "#3b82f6",
      onValueChange,
      format = "hex",
      showAlpha = false,
      disabled,
      label = "Color",
      className,
      name,
      ...props
    },
    ref
  ) {
    const controlledColor = React.useMemo(
      () => (value ? safeParseHsbColor(value) : undefined),
      [value]
    )
    const initialColor = React.useMemo(
      () =>
        safeParseHsbColor(defaultValue) ??
        parseColor("#3b82f6").toFormat("hsb"),
      [defaultValue]
    )
    const [internalColor, setInternalColor] =
      React.useState<Color>(initialColor)
    const color = controlledColor ?? internalColor

    const change = React.useCallback(
      (next: Color) => {
        if (value === undefined) setInternalColor(next)
        onValueChange?.(
          next.toString(showAlpha ? formatWithAlpha(format) : format),
          next
        )
      },
      [format, onValueChange, showAlpha, value]
    )

    return (
      <ColorPickerPrimitive value={color} onChange={change}>
        <div
          ref={ref}
          data-slot="color-picker"
          className={cn(
            "grid w-full max-w-sm gap-4 rounded-xl border bg-background p-4",
            className
          )}
          {...props}
        >
          {name ? (
            <input
              type="hidden"
              name={name}
              value={color.toString(
                showAlpha ? formatWithAlpha(format) : format
              )}
            />
          ) : null}
          <div className="flex items-center gap-3">
            <ColorSwatch
              color={color}
              className="size-9 shrink-0 rounded-lg border shadow-sm"
            />
            <span className="font-medium">{label}</span>
            <output className="ms-auto font-mono text-sm text-muted-foreground">
              {color.toString(showAlpha ? formatWithAlpha(format) : format)}
            </output>
          </div>
          <ColorArea
            isDisabled={disabled}
            colorSpace="hsb"
            xChannel="saturation"
            yChannel="brightness"
            className="relative h-44 w-full rounded-lg shadow-inner ring-offset-background outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-ring data-[focus-visible]:ring-offset-2"
          >
            <ColorThumb
              className={({ isFocusVisible }) =>
                cn(
                  "size-5 rounded-full border-2 border-white shadow-md",
                  isFocusVisible && "ring-2 ring-ring ring-offset-2"
                )
              }
              style={({ color: thumbColor }) => ({
                background: thumbColor.toString("css"),
              })}
            />
          </ColorArea>
          <ColorChannelSlider channel="hue" label="Hue" disabled={disabled} />
          {showAlpha ? (
            <ColorChannelSlider
              channel="alpha"
              label="Alpha"
              disabled={disabled}
            />
          ) : null}
          <ColorField isDisabled={disabled} className="grid gap-1.5">
            <Label className="text-sm font-medium">{label}</Label>
            <Input className="h-9 w-full rounded-lg border border-input bg-transparent px-3 font-mono text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50" />
          </ColorField>
        </div>
      </ColorPickerPrimitive>
    )
  }
)
ColorPicker.displayName = "ColorPicker"

function ColorChannelSlider({
  channel,
  label,
  disabled,
}: {
  channel: "hue" | "alpha"
  label: string
  disabled?: boolean
}) {
  return (
    <ColorSlider
      channel={channel}
      isDisabled={disabled}
      className="grid gap-1.5"
    >
      <div className="flex items-center justify-between text-sm">
        <Label>{label}</Label>
        <SliderOutput className="text-muted-foreground" />
      </div>
      <SliderTrack className="relative h-4 w-full rounded-full shadow-inner ring-offset-background outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-ring data-[focus-visible]:ring-offset-2">
        <ColorThumb
          className={({ isFocusVisible }) =>
            cn(
              "top-1/2 size-5 rounded-full border-2 border-white shadow-md",
              isFocusVisible && "ring-2 ring-ring ring-offset-2"
            )
          }
          style={({ color }) => ({ background: color.toString("css") })}
        />
      </SliderTrack>
    </ColorSlider>
  )
}

function safeParseColor(value: string) {
  try {
    return parseColor(value)
  } catch {
    return undefined
  }
}

function safeParseHsbColor(value: string) {
  return safeParseColor(value)?.toFormat("hsb")
}

function formatWithAlpha(format: SupportedColorFormat): SupportedColorFormat {
  if (format === "hex") return "hexa"
  if (format === "rgb") return "rgba"
  if (format === "hsl") return "hsla"
  if (format === "hsb") return "hsba"
  return format
}

export { ColorPicker, type ColorPickerProps, type SupportedColorFormat }
