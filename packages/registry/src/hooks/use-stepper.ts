"use client"

import * as React from "react"

import { useControllableState } from "@aq-ui/registry/hooks/use-controllable-state"
import { useStableCallback } from "@aq-ui/registry/hooks/use-stable-callback"

export interface StepperStep {
  id: string
  disabled?: boolean
  optional?: boolean
}

export type StepperStepState =
  "current" | "complete" | "upcoming" | "error" | "disabled"

export interface StepperValidationContext<T extends StepperStep> {
  step: T
  target: T
  signal: AbortSignal
}

export type StepperValidationResult = boolean | string | void

export interface UseStepperOptions<T extends StepperStep> {
  steps: T[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  completedIds?: string[]
  defaultCompletedIds?: string[]
  onCompletedIdsChange?: (ids: string[]) => void
  linear?: boolean
  validate?: (
    context: StepperValidationContext<T>
  ) => StepperValidationResult | Promise<StepperValidationResult>
  onComplete?: () => void
}

export interface StepperController<T extends StepperStep> {
  steps: T[]
  value: string | undefined
  currentStep: T | undefined
  currentIndex: number
  completedIds: string[]
  isFirst: boolean
  isLast: boolean
  canPrevious: boolean
  canNext: boolean
  isValidating: boolean
  validationError: string | undefined
  goTo: (id: string) => Promise<boolean>
  next: () => Promise<boolean>
  previous: () => Promise<boolean>
  completeStep: (id?: string) => void
  uncompleteStep: (id: string) => void
  complete: () => Promise<boolean>
  reset: () => void
  getStepState: (id: string) => StepperStepState
}

const EMPTY_COMPLETED: string[] = []

export function useStepper<T extends StepperStep>({
  steps,
  value: valueProp,
  defaultValue,
  onValueChange,
  completedIds: completedIdsProp,
  defaultCompletedIds = EMPTY_COMPLETED,
  onCompletedIdsChange,
  linear = false,
  validate,
  onComplete,
}: UseStepperOptions<T>): StepperController<T> {
  const firstEnabled = steps.find((step) => !step.disabled)?.id
  const initialValue = defaultValue ?? firstEnabled
  const [requestedValue, setValue] = useControllableState<string>({
    value: valueProp,
    defaultValue: initialValue ?? "",
    onChange: (nextValue) => {
      if (nextValue) onValueChange?.(nextValue)
    },
  })
  const [completedIds, setCompletedIds] = useControllableState({
    value: completedIdsProp,
    defaultValue: defaultCompletedIds,
    onChange: onCompletedIdsChange,
  })
  const [isValidating, setIsValidating] = React.useState(false)
  const [validationError, setValidationError] = React.useState<string>()
  const validationControllerRef = React.useRef<AbortController | null>(null)
  const validateStable = useStableCallback(validate)
  const onCompleteStable = useStableCallback(onComplete)
  const value = steps.some((step) => step.id === requestedValue)
    ? requestedValue
    : firstEnabled
  const currentIndex = steps.findIndex((step) => step.id === value)
  const currentStep = currentIndex >= 0 ? steps[currentIndex] : undefined

  const completeStep = React.useCallback(
    (id = value) => {
      if (!id || completedIds.includes(id)) return
      setCompletedIds([...completedIds, id])
    },
    [completedIds, setCompletedIds, value]
  )

  const uncompleteStep = React.useCallback(
    (id: string) => {
      setCompletedIds(completedIds.filter((completedId) => completedId !== id))
    },
    [completedIds, setCompletedIds]
  )

  const goTo = React.useCallback(
    async (id: string) => {
      const targetIndex = steps.findIndex((step) => step.id === id)
      const target = steps[targetIndex]
      if (!target || target.disabled || targetIndex === currentIndex) {
        return Boolean(target && !target.disabled)
      }

      if (linear && targetIndex > currentIndex + 1) {
        const prerequisites = steps.slice(
          Math.max(0, currentIndex + 1),
          targetIndex
        )
        if (
          prerequisites.some(
            (step) =>
              !step.optional &&
              !step.disabled &&
              !completedIds.includes(step.id)
          )
        ) {
          return false
        }
      }

      if (targetIndex > currentIndex && currentStep && validate) {
        validationControllerRef.current?.abort()
        const controller = new AbortController()
        validationControllerRef.current = controller
        setIsValidating(true)
        setValidationError(undefined)

        try {
          const result = await validateStable({
            step: currentStep,
            target,
            signal: controller.signal,
          })
          if (controller.signal.aborted) return false
          if (result === false || typeof result === "string") {
            setValidationError(
              typeof result === "string" ? result : "Step validation failed"
            )
            return false
          }
        } catch (error) {
          if (controller.signal.aborted) return false
          setValidationError(
            error instanceof Error ? error.message : "Step validation failed"
          )
          return false
        } finally {
          if (validationControllerRef.current === controller) {
            validationControllerRef.current = null
            setIsValidating(false)
          }
        }
      }

      if (targetIndex > currentIndex && currentStep) {
        completeStep(currentStep.id)
      }
      setValidationError(undefined)
      setValue(id)
      return true
    },
    [
      completeStep,
      completedIds,
      currentIndex,
      currentStep,
      linear,
      setValue,
      steps,
      validate,
      validateStable,
    ]
  )

  const next = React.useCallback(() => {
    const nextStep = steps
      .slice(currentIndex + 1)
      .find((step) => !step.disabled)
    return nextStep ? goTo(nextStep.id) : Promise.resolve(false)
  }, [currentIndex, goTo, steps])

  const previous = React.useCallback(() => {
    const previousStep = steps
      .slice(0, Math.max(0, currentIndex))
      .reverse()
      .find((step) => !step.disabled)
    return previousStep ? goTo(previousStep.id) : Promise.resolve(false)
  }, [currentIndex, goTo, steps])

  const complete = React.useCallback(async () => {
    if (!currentStep) return false
    if (validate) {
      validationControllerRef.current?.abort()
      const controller = new AbortController()
      validationControllerRef.current = controller
      setIsValidating(true)
      setValidationError(undefined)
      try {
        const result = await validateStable({
          step: currentStep,
          target: currentStep,
          signal: controller.signal,
        })
        if (controller.signal.aborted) return false
        if (result === false || typeof result === "string") {
          setValidationError(
            typeof result === "string" ? result : "Step validation failed"
          )
          return false
        }
      } catch (error) {
        if (controller.signal.aborted) return false
        setValidationError(
          error instanceof Error ? error.message : "Step validation failed"
        )
        return false
      } finally {
        if (validationControllerRef.current === controller) {
          validationControllerRef.current = null
          setIsValidating(false)
        }
      }
    }
    completeStep(currentStep.id)
    onCompleteStable()
    return true
  }, [completeStep, currentStep, onCompleteStable, validate, validateStable])

  const reset = React.useCallback(() => {
    validationControllerRef.current?.abort()
    validationControllerRef.current = null
    setIsValidating(false)
    setValidationError(undefined)
    setCompletedIds(defaultCompletedIds)
    setValue(initialValue ?? "")
  }, [defaultCompletedIds, initialValue, setCompletedIds, setValue])

  React.useEffect(() => () => validationControllerRef.current?.abort(), [])

  const getStepState = React.useCallback(
    (id: string): StepperStepState => {
      const step = steps.find((candidate) => candidate.id === id)
      if (!step || step.disabled) return "disabled"
      if (id === value) return validationError ? "error" : "current"
      if (completedIds.includes(id)) return "complete"
      return "upcoming"
    },
    [completedIds, steps, validationError, value]
  )

  const previousStep = steps
    .slice(0, Math.max(0, currentIndex))
    .reverse()
    .find((step) => !step.disabled)
  const nextStep = steps.slice(currentIndex + 1).find((step) => !step.disabled)

  return {
    steps,
    value,
    currentStep,
    currentIndex,
    completedIds,
    isFirst: !previousStep,
    isLast: !nextStep,
    canPrevious: Boolean(previousStep) && !isValidating,
    canNext: Boolean(nextStep) && !isValidating,
    isValidating,
    validationError,
    goTo,
    next,
    previous,
    completeStep,
    uncompleteStep,
    complete,
    reset,
    getStepState,
  }
}
