const buttonVariantOptions = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "link",
] as const

const buttonSizeOptions = [
  "xs",
  "sm",
  "default",
  "lg",
  "icon-xs",
  "icon-sm",
  "icon",
  "icon-lg",
] as const

type ButtonVariantOption = (typeof buttonVariantOptions)[number]
type ButtonSizeOption = (typeof buttonSizeOptions)[number]

export { buttonSizeOptions, buttonVariantOptions }
export type { ButtonSizeOption, ButtonVariantOption }
