"use client"

import * as React from "react"

export interface FormFieldError {
  message?: string
}

export interface UseFormFieldOptions {
  id?: string
  name?: string
  disabled?: boolean
  required?: boolean
  invalid?: boolean
  errors?: Array<string | FormFieldError | undefined | null>
  descriptionId?: string
  errorId?: string
}

export interface FormFieldControls {
  id: string
  descriptionId: string
  errorId: string
  invalid: boolean
  errors: string[]
  inputProps: {
    id: string
    name?: string
    disabled?: boolean
    required?: boolean
    "aria-invalid"?: true
    "aria-describedby"?: string
    "aria-errormessage"?: string
  }
  labelProps: { htmlFor: string }
  descriptionProps: { id: string }
  errorProps: { id: string; role: "alert"; "aria-live": "polite" }
}

const EMPTY_ERRORS: Array<string | FormFieldError | undefined | null> = []

export function useFormField({
  id,
  name,
  disabled,
  required,
  invalid,
  errors = EMPTY_ERRORS,
  descriptionId,
  errorId,
}: UseFormFieldOptions = {}): FormFieldControls {
  const generatedId = React.useId()
  const fieldId = id ?? "aq-field-" + generatedId
  const resolvedDescriptionId = descriptionId ?? fieldId + "-description"
  const resolvedErrorId = errorId ?? fieldId + "-error"
  const messages = React.useMemo(
    () =>
      Array.from(
        new Set(
          errors.flatMap((error) => {
            if (typeof error === "string") return error.trim() ? [error] : []
            return error?.message?.trim() ? [error.message] : []
          })
        )
      ),
    [errors]
  )
  const isInvalid = invalid ?? messages.length > 0
  const describedBy = [
    resolvedDescriptionId,
    isInvalid ? resolvedErrorId : undefined,
  ]
    .filter(Boolean)
    .join(" ")

  return {
    id: fieldId,
    descriptionId: resolvedDescriptionId,
    errorId: resolvedErrorId,
    invalid: isInvalid,
    errors: messages,
    inputProps: {
      id: fieldId,
      name,
      disabled,
      required,
      "aria-invalid": isInvalid || undefined,
      "aria-describedby": describedBy || undefined,
      "aria-errormessage": isInvalid ? resolvedErrorId : undefined,
    },
    labelProps: { htmlFor: fieldId },
    descriptionProps: { id: resolvedDescriptionId },
    errorProps: {
      id: resolvedErrorId,
      role: "alert",
      "aria-live": "polite",
    },
  }
}
