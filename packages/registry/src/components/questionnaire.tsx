"use client"

import * as React from "react"
import { useRender } from "@base-ui/react/use-render"
import { CheckIcon } from "lucide-react"

import { buttonVariants, type Button } from "@aq-ui/registry/components/button"
import { useIsomorphicLayoutEffect } from "@aq-ui/registry/hooks/use-isomorphic-layout-effect"
import { useMergedRefs } from "@aq-ui/registry/hooks/use-merged-refs"
import { cn } from "@aq-ui/registry/lib/utils"

export type QuestionnaireItemStatus = "unanswered" | "answered" | "skipped"
export type QuestionnaireShortcutMode = "letters" | "numbers"

export interface QuestionnaireChoiceDefinition {
  disabled?: boolean
  value: string
}

export interface QuestionnaireItemDefinition {
  choices?: readonly QuestionnaireChoiceDefinition[]
  disabled?: boolean
  name: string
  required?: boolean
}

export interface QuestionnaireRootState {
  current: number
  first: boolean
  last: boolean
  total: number
}

export type QuestionnaireProps = Omit<
  React.ComponentPropsWithoutRef<"form">,
  "defaultValue" | "value"
> & {
  defaultItem?: string
  item?: string
  items?: readonly QuestionnaireItemDefinition[]
  onItemChange?: (item: string) => void
  shortcuts?: QuestionnaireShortcutMode
}

interface QuestionnaireItemRecord {
  disabled: boolean
  element: HTMLFieldSetElement
  focus: () => void
  focusInvalid: () => void
  name: string
  required: boolean
  reset: () => void
  skip: () => void
  status: QuestionnaireItemStatus
  validate: () => boolean
}

interface QuestionnaireRootContextValue extends QuestionnaireRootState {
  activeItem: QuestionnaireItemRecord | null
  activeItemName: string | null
  definitionByName: ReadonlyMap<string, QuestionnaireItemDefinition>
  goNext: () => void
  goPrevious: () => void
  registerItem: (item: QuestionnaireItemRecord) => () => void
  shortcuts: QuestionnaireShortcutMode | null
  skipCurrent: () => void
}

interface AnswerState {
  defaultFilled: boolean
  filled: boolean
}

interface ChoiceRegistration {
  disabled: boolean
  element: HTMLInputElement
  id: string
  value: string
}

interface QuestionnaireItemContextValue {
  active: boolean
  answers: Readonly<Record<string, AnswerState>>
  disabled: boolean
  invalid: boolean
  multiple: boolean
  name: string
  registerAnswer: (id: string, defaultFilled: boolean) => () => void
  registerChoice: (choice: ChoiceRegistration) => () => void
  registerDescription: (id: string) => () => void
  registerError: (id: string) => () => void
  required: boolean
  setAnswerDefault: (id: string, filled: boolean) => void
  setAnswerFromInteraction: (
    id: string,
    filled: boolean,
    exclusive: boolean
  ) => void
  shortcutFor: (id: string, value: string) => string | null
  skipped: boolean
  status: QuestionnaireItemStatus
  syncAnswer: (id: string, filled: boolean) => void
}

interface QuestionnaireProgressState
  extends QuestionnaireRootState, Record<string, unknown> {}

interface QuestionnaireChoiceState extends Record<string, unknown> {
  checked: boolean
  disabled: boolean
  invalid: boolean
  shortcut: string | null
  type: "checkbox" | "radio"
}

interface QuestionnaireInputState extends Record<string, unknown> {
  disabled: boolean
  filled: boolean
  invalid: boolean
}

interface QuestionnaireNavigationState extends Record<string, unknown> {
  disabled: boolean
  shortcut: "Enter" | null
  status: QuestionnaireItemStatus | null
  visible: boolean
}

const QuestionnaireRootContext =
  React.createContext<QuestionnaireRootContextValue | null>(null)
const QuestionnaireItemContext =
  React.createContext<QuestionnaireItemContextValue | null>(null)

function useQuestionnaireRoot(component: string) {
  const context = React.useContext(QuestionnaireRootContext)
  if (!context)
    throw new Error(`${component} must be used within Questionnaire.`)
  return context
}

function useQuestionnaireItem(component: string) {
  const context = React.useContext(QuestionnaireItemContext)
  if (!context) {
    throw new Error(`${component} must be used within QuestionnaireItem.`)
  }
  return context
}

function sortByDocumentOrder<T extends { element: Element }>(items: T[]) {
  return [...items].sort((left, right) => {
    if (left.element === right.element || typeof Node === "undefined") return 0
    const position = left.element.compareDocumentPosition(right.element)
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1
    return 0
  })
}

function isTextEntryTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  if (
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return true
  }
  return (
    target instanceof HTMLInputElement &&
    !["button", "checkbox", "radio", "reset", "submit"].includes(target.type)
  )
}

function shortcutSequence(mode: QuestionnaireShortcutMode | null) {
  if (mode === "letters") return "abcdefghijklmnopqrstuvwxyz".split("")
  if (mode === "numbers") return "1234567890".split("")
  return []
}

const Questionnaire = React.forwardRef<HTMLFormElement, QuestionnaireProps>(
  (
    {
      children,
      className,
      defaultItem,
      item,
      items,
      noValidate = true,
      onItemChange,
      onKeyDown,
      onReset,
      onSubmit,
      shortcuts,
      ...props
    },
    forwardedRef
  ) => {
    const definitions = React.useMemo(
      () => new Map(items?.map((definition) => [definition.name, definition])),
      [items]
    )
    const initialItem =
      defaultItem ??
      items?.find((definition) => !definition.disabled)?.name ??
      null
    const [uncontrolledItem, setUncontrolledItem] = React.useState<
      string | null
    >(initialItem)
    const [records, setRecords] = React.useState<QuestionnaireItemRecord[]>([])
    const formRef = React.useRef<HTMLFormElement | null>(null)
    const ref = useMergedRefs(forwardedRef, formRef)
    const controlled = item !== undefined
    const activeItemName = controlled ? item : uncontrolledItem

    const registerItem = React.useCallback(
      (record: QuestionnaireItemRecord) => {
        setRecords((current) => [
          ...current.filter(
            (candidate) =>
              candidate.element !== record.element &&
              candidate.name !== record.name
          ),
          record,
        ])
        return () => {
          setRecords((current) =>
            current.filter((candidate) => candidate !== record)
          )
        }
      },
      []
    )

    const orderedItems = React.useMemo(() => {
      const enabledRecords = sortByDocumentOrder(
        records.filter((record) => !record.disabled)
      )
      if (!items) return enabledRecords
      const recordByName = new Map(
        enabledRecords.map((record) => [record.name, record])
      )
      return items.flatMap((definition) => {
        if (definition.disabled) return []
        const record = recordByName.get(definition.name)
        return record ? [record] : []
      })
    }, [items, records])

    const activeIndex = orderedItems.findIndex(
      (record) => record.name === activeItemName
    )
    const activeItem =
      activeIndex >= 0 ? (orderedItems[activeIndex] ?? null) : null
    const total = orderedItems.length
    const current = activeIndex < 0 ? 0 : activeIndex + 1
    const first = total > 0 && activeIndex === 0
    const last = total > 0 && activeIndex === total - 1

    const setActiveItem = React.useCallback(
      (name: string) => {
        if (name === activeItemName) return
        if (!controlled) setUncontrolledItem(name)
        onItemChange?.(name)
      },
      [activeItemName, controlled, onItemChange]
    )

    useIsomorphicLayoutEffect(() => {
      if (orderedItems.length === 0 || activeIndex >= 0) return
      setActiveItem(orderedItems[0]!.name)
    }, [activeIndex, orderedItems, setActiveItem])

    const goPrevious = React.useCallback(() => {
      if (activeIndex <= 0) return
      setActiveItem(orderedItems[activeIndex - 1]!.name)
    }, [activeIndex, orderedItems, setActiveItem])

    const goNext = React.useCallback(() => {
      if (!activeItem || activeIndex >= total - 1) return
      if (!activeItem.validate()) {
        activeItem.focusInvalid()
        return
      }
      setActiveItem(orderedItems[activeIndex + 1]!.name)
    }, [activeIndex, activeItem, orderedItems, setActiveItem, total])

    const skipCurrent = React.useCallback(() => {
      if (!activeItem || activeItem.required) return
      activeItem.skip()
      if (!last) {
        setActiveItem(orderedItems[activeIndex + 1]!.name)
        return
      }
      queueMicrotask(() => formRef.current?.requestSubmit())
    }, [activeIndex, activeItem, last, orderedItems, setActiveItem])

    const context = React.useMemo<QuestionnaireRootContextValue>(
      () => ({
        activeItem,
        activeItemName,
        current,
        definitionByName: definitions,
        first,
        goNext,
        goPrevious,
        last,
        registerItem,
        shortcuts: shortcuts ?? null,
        skipCurrent,
        total,
      }),
      [
        activeItem,
        activeItemName,
        current,
        definitions,
        first,
        goNext,
        goPrevious,
        last,
        registerItem,
        shortcuts,
        skipCurrent,
        total,
      ]
    )

    return (
      <QuestionnaireRootContext.Provider value={context}>
        <form
          ref={ref}
          data-slot="questionnaire"
          data-shortcuts={shortcuts}
          className={cn("flex w-full min-w-0 flex-col gap-4", className)}
          noValidate={noValidate}
          onKeyDown={(event) => {
            onKeyDown?.(event)
            if (event.defaultPrevented || event.nativeEvent.isComposing) return

            if (
              event.key === "Enter" &&
              (event.metaKey || event.ctrlKey) &&
              !event.altKey &&
              !event.shiftKey
            ) {
              event.preventDefault()
              if (!event.repeat) {
                if (last) formRef.current?.requestSubmit()
                else goNext()
              }
              return
            }

            if (
              !event.metaKey &&
              !event.ctrlKey &&
              !event.altKey &&
              !isTextEntryTarget(event.target)
            ) {
              if (event.key === "ArrowLeft") {
                event.preventDefault()
                if (!event.repeat) goPrevious()
                return
              }
              if (
                event.key === "ArrowRight" &&
                activeItem?.status !== "unanswered"
              ) {
                event.preventDefault()
                if (!event.repeat) goNext()
                return
              }
            }

            if (
              shortcuts &&
              !event.metaKey &&
              !event.ctrlKey &&
              !event.altKey &&
              !isTextEntryTarget(event.target)
            ) {
              const key = event.key.toLowerCase()
              const choice =
                activeItem?.element.querySelector<HTMLInputElement>(
                  `[data-questionnaire-shortcut="${key}"] input:not(:disabled)`
                )
              if (choice) {
                event.preventDefault()
                if (!event.repeat) {
                  choice.focus()
                  choice.click()
                }
              }
            }
          }}
          onReset={(event) => {
            onReset?.(event)
            if (event.defaultPrevented) return
            records.forEach((record) => record.reset())
            const next =
              orderedItems.find((record) => record.name === defaultItem) ??
              orderedItems[0]
            if (next) setActiveItem(next.name)
          }}
          onSubmit={(event) => {
            const invalidItem = orderedItems.find(
              (record) => !record.validate()
            )
            if (invalidItem) {
              event.preventDefault()
              setActiveItem(invalidItem.name)
              queueMicrotask(() => invalidItem.focusInvalid())
              return
            }
            onSubmit?.(event)
          }}
          {...props}
        >
          {children}
        </form>
      </QuestionnaireRootContext.Provider>
    )
  }
)
Questionnaire.displayName = "Questionnaire"

export type QuestionnaireProgressProps = useRender.ComponentProps<
  "div",
  QuestionnaireProgressState
>

const QuestionnaireProgress = React.forwardRef<
  HTMLDivElement,
  QuestionnaireProgressProps
>(({ children, className, render, ...props }, forwardedRef) => {
  const { current, first, last, total } = useQuestionnaireRoot(
    "QuestionnaireProgress"
  )
  const text = total ? `Question ${current} of ${total}` : undefined
  return useRender<QuestionnaireProgressState, HTMLDivElement>({
    defaultTagName: "div",
    ref: forwardedRef,
    render,
    state: { current, first, last, total },
    props: {
      ...props,
      "aria-label": "Questionnaire progress",
      "aria-live": "polite",
      "aria-valuemax": total || undefined,
      "aria-valuemin": total ? 1 : undefined,
      "aria-valuenow": total ? current : undefined,
      "aria-valuetext": text,
      "data-slot": "questionnaire-progress",
      className: cn(
        "min-h-[1lh] w-fit min-w-[14ch] text-xs font-medium text-muted-foreground tabular-nums",
        className
      ),
      children: children ?? text,
      role: "progressbar",
    },
  })
})
QuestionnaireProgress.displayName = "QuestionnaireProgress"

export type QuestionnaireItemProps = Omit<
  React.ComponentPropsWithoutRef<"fieldset">,
  "name" | "value"
> & {
  invalid?: boolean
  name: string
  multiple?: boolean
  onStatusChange?: (status: QuestionnaireItemStatus) => void
  required?: boolean
}

const QuestionnaireItem = React.forwardRef<
  HTMLFieldSetElement,
  QuestionnaireItemProps
>(
  (
    {
      "aria-describedby": ariaDescribedBy,
      children,
      className,
      disabled = false,
      invalid: invalidProp = false,
      multiple = false,
      name,
      onStatusChange,
      required = false,
      tabIndex = -1,
      ...props
    },
    forwardedRef
  ) => {
    const root = useQuestionnaireRoot("QuestionnaireItem")
    const registerRootItem = root.registerItem
    const [element, setElement] = React.useState<HTMLFieldSetElement | null>(
      null
    )
    const ref = useMergedRefs(forwardedRef, setElement)
    const [answers, setAnswers] = React.useState<Record<string, AnswerState>>(
      {}
    )
    const [choices, setChoices] = React.useState<ChoiceRegistration[]>([])
    const [descriptions, setDescriptions] = React.useState<string[]>([])
    const [errors, setErrors] = React.useState<string[]>([])
    const [attempted, setAttempted] = React.useState(false)
    const [skipped, setSkipped] = React.useState(false)
    const active = root.activeItemName === name
    const answered = Object.values(answers).some((answer) => answer.filled)
    const status: QuestionnaireItemStatus = skipped
      ? "skipped"
      : answered
        ? "answered"
        : "unanswered"
    const valid = disabled || status === "answered" || (!required && skipped)
    const invalid = invalidProp || (attempted && !valid)
    const previousStatusRef = React.useRef(status)

    React.useEffect(() => {
      if (previousStatusRef.current === status) return
      previousStatusRef.current = status
      onStatusChange?.(status)
    }, [onStatusChange, status])

    const registerAnswer = React.useCallback(
      (id: string, defaultFilled: boolean) => {
        setAnswers((current) =>
          current[id]
            ? current
            : {
                ...current,
                [id]: { defaultFilled, filled: defaultFilled },
              }
        )
        return () => {
          setAnswers((current) => {
            if (!current[id]) return current
            const next = { ...current }
            delete next[id]
            return next
          })
        }
      },
      []
    )

    const setAnswerDefault = React.useCallback(
      (id: string, defaultFilled: boolean) => {
        setAnswers((current) => {
          const answer = current[id]
          if (!answer || answer.defaultFilled === defaultFilled) return current
          return {
            ...current,
            [id]: { ...answer, defaultFilled },
          }
        })
      },
      []
    )

    const syncAnswer = React.useCallback((id: string, filled: boolean) => {
      setAnswers((current) => {
        const answer = current[id]
        if (!answer || answer.filled === filled) return current
        return { ...current, [id]: { ...answer, filled } }
      })
    }, [])

    const setAnswerFromInteraction = React.useCallback(
      (id: string, filled: boolean, exclusive: boolean) => {
        setSkipped(false)
        setAnswers((current) => {
          const next = { ...current }
          if (exclusive && filled) {
            for (const [answerId, answer] of Object.entries(next)) {
              next[answerId] = { ...answer, filled: answerId === id }
            }
          } else if (next[id]) {
            next[id] = { ...next[id], filled }
          }
          return next
        })
      },
      []
    )

    const registerChoice = React.useCallback((choice: ChoiceRegistration) => {
      setChoices((current) => [
        ...current.filter(
          (candidate) =>
            candidate.id !== choice.id && candidate.element !== choice.element
        ),
        choice,
      ])
      return () =>
        setChoices((current) =>
          current.filter((candidate) => candidate !== choice)
        )
    }, [])

    const registerDescription = React.useCallback((id: string) => {
      setDescriptions((current) =>
        current.includes(id) ? current : [...current, id]
      )
      return () =>
        setDescriptions((current) => current.filter((value) => value !== id))
    }, [])

    const registerError = React.useCallback((id: string) => {
      setErrors((current) =>
        current.includes(id) ? current : [...current, id]
      )
      return () =>
        setErrors((current) => current.filter((value) => value !== id))
    }, [])

    const reset = React.useCallback(() => {
      setAttempted(false)
      setSkipped(false)
      setAnswers((current) =>
        Object.fromEntries(
          Object.entries(current).map(([id, answer]) => [
            id,
            { ...answer, filled: answer.defaultFilled },
          ])
        )
      )
    }, [])

    const skip = React.useCallback(() => {
      if (required) return
      setAttempted(false)
      setSkipped(true)
      setAnswers((current) =>
        Object.fromEntries(
          Object.entries(current).map(([id, answer]) => [
            id,
            { ...answer, filled: false },
          ])
        )
      )
    }, [required])

    const validate = React.useCallback(() => {
      setAttempted(true)
      if (invalidProp || !valid) return false
      if (!element || noValidateFor(element)) return true
      const invalidControl = Array.from(element.elements).find(
        (control): control is HTMLInputElement =>
          control instanceof HTMLInputElement &&
          control.willValidate &&
          !control.validity.valid
      )
      if (!invalidControl) return true
      invalidControl.reportValidity()
      return false
    }, [element, invalidProp, valid])

    const focus = React.useCallback(() => {
      const preferred = element?.querySelector<HTMLElement>(
        "input[data-filled]:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled)"
      )
      ;(preferred ?? element)?.focus()
    }, [element])

    const focusInvalid = React.useCallback(() => {
      const target = element?.querySelector<HTMLElement>(
        "input:not(:disabled), textarea:not(:disabled), select:not(:disabled)"
      )
      ;(target ?? element)?.focus()
    }, [element])

    useIsomorphicLayoutEffect(() => {
      if (!element) return
      return registerRootItem({
        disabled,
        element,
        focus,
        focusInvalid,
        name,
        required,
        reset,
        skip,
        status,
        validate,
      })
    }, [
      disabled,
      element,
      focus,
      focusInvalid,
      name,
      required,
      reset,
      registerRootItem,
      skip,
      status,
      validate,
    ])

    useIsomorphicLayoutEffect(() => {
      element?.toggleAttribute("inert", !active)
    }, [active, element])

    const sortedChoices = React.useMemo(
      () => sortByDocumentOrder(choices.filter((choice) => !choice.disabled)),
      [choices]
    )
    const definition = root.definitionByName.get(name)
    const shortcutFor = React.useCallback(
      (id: string, value: string) => {
        const sequence = shortcutSequence(root.shortcuts)
        if (sequence.length === 0) return null
        if (definition?.choices) {
          const index = definition.choices
            .filter((choice) => !choice.disabled)
            .findIndex((choice) => choice.value === value)
          return index < 0 ? null : (sequence[index] ?? null)
        }
        const index = sortedChoices.findIndex((choice) => choice.id === id)
        return index < 0 ? null : (sequence[index] ?? null)
      },
      [definition, root.shortcuts, sortedChoices]
    )

    const context = React.useMemo<QuestionnaireItemContextValue>(
      () => ({
        active,
        answers,
        disabled,
        invalid,
        multiple,
        name,
        registerAnswer,
        registerChoice,
        registerDescription,
        registerError,
        required,
        setAnswerDefault,
        setAnswerFromInteraction,
        shortcutFor,
        skipped,
        status,
        syncAnswer,
      }),
      [
        active,
        answers,
        disabled,
        invalid,
        multiple,
        name,
        registerAnswer,
        registerChoice,
        registerDescription,
        registerError,
        required,
        setAnswerDefault,
        setAnswerFromInteraction,
        shortcutFor,
        skipped,
        status,
        syncAnswer,
      ]
    )
    const describedBy = [
      ...descriptions,
      ...(invalid ? errors : []),
      ariaDescribedBy,
    ]
      .filter(Boolean)
      .join(" ")

    return (
      <QuestionnaireItemContext.Provider value={context}>
        <fieldset
          ref={ref}
          data-slot="questionnaire-item"
          data-active={active ? "" : undefined}
          data-disabled={disabled ? "" : undefined}
          data-invalid={invalid ? "" : undefined}
          data-multiple={multiple ? "" : undefined}
          data-required={required ? "" : undefined}
          data-status={status}
          aria-describedby={describedBy || undefined}
          aria-invalid={invalid || undefined}
          className={cn(
            "flex min-w-0 flex-col gap-4 border-0 p-0 outline-none",
            className
          )}
          disabled={disabled}
          hidden={!active}
          tabIndex={tabIndex}
          {...props}
        >
          {children}
        </fieldset>
      </QuestionnaireItemContext.Provider>
    )
  }
)
QuestionnaireItem.displayName = "QuestionnaireItem"

function noValidateFor(element: HTMLFieldSetElement) {
  return element.form?.noValidate !== false
}

export type QuestionnaireTitleProps = useRender.ComponentProps<"legend">

const QuestionnaireTitle = React.forwardRef<
  HTMLLegendElement,
  QuestionnaireTitleProps
>(({ className, render, ...props }, forwardedRef) => {
  useQuestionnaireItem("QuestionnaireTitle")
  return useRender<Record<string, never>, HTMLLegendElement>({
    defaultTagName: "legend",
    ref: forwardedRef,
    render,
    props: {
      ...props,
      "data-slot": "questionnaire-title",
      className: cn(
        "font-heading text-base leading-snug font-medium text-pretty [&:not(:has(~[data-slot=questionnaire-description]))]:mb-4",
        className
      ),
    },
  })
})
QuestionnaireTitle.displayName = "QuestionnaireTitle"

export type QuestionnaireDescriptionProps = useRender.ComponentProps<"p">

const QuestionnaireDescription = React.forwardRef<
  HTMLParagraphElement,
  QuestionnaireDescriptionProps
>(({ className, id: idProp, render, ...props }, forwardedRef) => {
  const { registerDescription } = useQuestionnaireItem(
    "QuestionnaireDescription"
  )
  const generatedId = React.useId()
  const id = idProp ?? generatedId
  useIsomorphicLayoutEffect(
    () => registerDescription(id),
    [id, registerDescription]
  )
  return useRender<Record<string, never>, HTMLParagraphElement>({
    defaultTagName: "p",
    ref: forwardedRef,
    render,
    props: {
      ...props,
      "data-slot": "questionnaire-description",
      className: cn("text-sm text-pretty text-muted-foreground", className),
      id,
    },
  })
})
QuestionnaireDescription.displayName = "QuestionnaireDescription"

interface QuestionnaireChoicesState extends Record<string, unknown> {
  shortcuts: QuestionnaireShortcutMode | null
}

export type QuestionnaireChoicesProps = useRender.ComponentProps<
  "div",
  QuestionnaireChoicesState
>

const QuestionnaireChoices = React.forwardRef<
  HTMLDivElement,
  QuestionnaireChoicesProps
>(({ className, render, ...props }, forwardedRef) => {
  useQuestionnaireItem("QuestionnaireChoices")
  const { shortcuts } = useQuestionnaireRoot("QuestionnaireChoices")
  return useRender<QuestionnaireChoicesState, HTMLDivElement>({
    defaultTagName: "div",
    ref: forwardedRef,
    render,
    state: { shortcuts },
    props: {
      ...props,
      "data-slot": "questionnaire-choices",
      className: cn(
        "group/questionnaire-choices grid min-w-0 gap-2",
        className
      ),
    },
  })
})
QuestionnaireChoices.displayName = "QuestionnaireChoices"

export type QuestionnaireChoiceProps = Omit<
  useRender.ComponentProps<"label", QuestionnaireChoiceState>,
  "onChange"
> & {
  checked?: boolean
  defaultChecked?: boolean
  disabled?: boolean
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  value: string
}

const QuestionnaireChoice = React.forwardRef<
  HTMLLabelElement,
  QuestionnaireChoiceProps
>(
  (
    {
      checked,
      children,
      className,
      defaultChecked = false,
      disabled = false,
      onChange,
      render,
      value,
      ...props
    },
    forwardedRef
  ) => {
    const item = useQuestionnaireItem("QuestionnaireChoice")
    const registerAnswer = item.registerAnswer
    const registerChoice = item.registerChoice
    const setAnswerDefault = item.setAnswerDefault
    const syncAnswer = item.syncAnswer
    const id = React.useId()
    const [input, setInput] = React.useState<HTMLInputElement | null>(null)
    const controlled = checked !== undefined
    const selected = item.answers[id]?.filled ?? defaultChecked
    const effectiveChecked = item.skipped
      ? false
      : controlled
        ? checked
        : selected
    const effectiveDisabled = item.disabled || disabled
    const type = item.multiple ? "checkbox" : "radio"
    const shortcut = item.shortcutFor(id, value)

    useIsomorphicLayoutEffect(
      () => registerAnswer(id, defaultChecked),
      [defaultChecked, id, registerAnswer]
    )
    React.useEffect(() => {
      setAnswerDefault(id, defaultChecked)
    }, [defaultChecked, id, setAnswerDefault])
    React.useEffect(() => {
      if (controlled) syncAnswer(id, Boolean(checked))
    }, [checked, controlled, id, syncAnswer])
    useIsomorphicLayoutEffect(() => {
      if (!input) return
      return registerChoice({
        disabled,
        element: input,
        id,
        value,
      })
    }, [disabled, id, input, registerChoice, value])

    const state = React.useMemo<QuestionnaireChoiceState>(
      () => ({
        checked: effectiveChecked,
        disabled: effectiveDisabled,
        invalid: item.invalid,
        shortcut,
        type,
      }),
      [effectiveChecked, effectiveDisabled, item.invalid, shortcut, type]
    )

    return useRender<QuestionnaireChoiceState, HTMLLabelElement>({
      defaultTagName: "label",
      ref: forwardedRef,
      render,
      state,
      props: {
        ...props,
        "data-checked": effectiveChecked ? "" : undefined,
        "data-slot": "questionnaire-choice",
        "data-unchecked": effectiveChecked ? undefined : "",
        "data-questionnaire-shortcut": shortcut ?? undefined,
        className: cn(
          "group/questionnaire-choice relative flex min-h-11 cursor-pointer items-start gap-2.5 rounded-lg border border-input bg-transparent px-3 py-2.5 text-start text-sm transition-colors outline-none select-none hover:bg-muted/50 has-[>input:focus-visible]:border-ring has-[>input:focus-visible]:ring-3 has-[>input:focus-visible]:ring-ring/50 data-invalid:border-destructive dark:bg-input/20 data-checked:border-primary/40 data-checked:bg-muted dark:data-checked:bg-muted",
          "data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50",
          className
        ),
        children: (
          <>
            <input
              ref={setInput}
              data-slot="questionnaire-choice-input"
              aria-invalid={item.invalid || undefined}
              aria-keyshortcuts={
                [shortcut, effectiveChecked ? "Enter" : null]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
              checked={effectiveChecked}
              className="absolute inset-0 z-10 size-full cursor-pointer opacity-0"
              disabled={effectiveDisabled}
              id={id}
              name={item.skipped ? undefined : item.name}
              required={item.required && !item.multiple}
              type={type}
              value={value}
              onChange={(event) => {
                onChange?.(event)
                if (event.defaultPrevented) return
                if (
                  !controlled ||
                  (item.skipped &&
                    Boolean(checked) === event.currentTarget.checked)
                ) {
                  item.setAnswerFromInteraction(
                    id,
                    controlled ? Boolean(checked) : event.currentTarget.checked,
                    !item.multiple
                  )
                }
              }}
            />
            <span
              aria-hidden="true"
              data-slot="questionnaire-choice-indicator"
              className="pointer-events-none relative flex size-4 shrink-0 translate-y-[--spacing(0.45)] items-center justify-center rounded-[4px] border border-input group-has-data-[slot=questionnaire-choice-description]/questionnaire-choice:translate-y-0.5 group-data-[type=radio]/questionnaire-choice:rounded-full group-data-checked/questionnaire-choice:border-primary group-data-checked/questionnaire-choice:bg-primary group-data-checked/questionnaire-choice:text-primary-foreground dark:bg-input/30 dark:group-data-checked/questionnaire-choice:bg-primary"
            >
              <span
                data-slot="questionnaire-choice-indicator-dot"
                className="hidden size-2 rounded-full bg-primary-foreground group-data-[type=checkbox]/questionnaire-choice:hidden group-data-checked/questionnaire-choice:block"
              />
              <CheckIcon
                data-slot="questionnaire-choice-indicator-check"
                className="hidden size-3.5 group-data-[type=radio]/questionnaire-choice:hidden group-data-checked/questionnaire-choice:block"
              />
            </span>
            <span
              data-slot="questionnaire-choice-label"
              className="flex min-w-0 flex-1 flex-col gap-0.5 leading-snug"
            >
              {children}
            </span>
            <span
              aria-hidden="true"
              data-slot="questionnaire-choice-shortcut"
              className="pointer-events-none ms-auto hidden size-5 shrink-0 translate-y-[--spacing(0.45)] items-center justify-center rounded-md border border-input bg-background font-mono text-[0.625rem] leading-none font-medium text-muted-foreground group-has-data-[slot=questionnaire-choice-description]/questionnaire-choice:translate-y-0.5 group-data-[shortcut]/questionnaire-choice:inline-flex"
              hidden={shortcut === null}
            >
              {shortcut}
            </span>
          </>
        ),
      },
    })
  }
)
QuestionnaireChoice.displayName = "QuestionnaireChoice"

const QuestionnaireChoiceDescription = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, forwardedRef) => (
  <span
    ref={forwardedRef}
    data-slot="questionnaire-choice-description"
    className={cn("text-muted-foreground", className)}
    {...props}
  />
))
QuestionnaireChoiceDescription.displayName = "QuestionnaireChoiceDescription"

export type QuestionnaireInputType =
  | "date"
  | "datetime-local"
  | "email"
  | "month"
  | "number"
  | "password"
  | "search"
  | "tel"
  | "text"
  | "time"
  | "url"
  | "week"

export type QuestionnaireInputProps = Omit<
  useRender.ComponentProps<"input", QuestionnaireInputState>,
  "form" | "name" | "type"
> & {
  type?: QuestionnaireInputType
}

const QuestionnaireInput = React.forwardRef<
  HTMLInputElement,
  QuestionnaireInputProps
>(
  (
    {
      className,
      defaultValue = "",
      disabled = false,
      onChange,
      render,
      type = "text",
      value,
      ...props
    },
    forwardedRef
  ) => {
    const item = useQuestionnaireItem("QuestionnaireInput")
    const registerAnswer = item.registerAnswer
    const setAnswerDefault = item.setAnswerDefault
    const syncAnswer = item.syncAnswer
    const id = React.useId()
    const controlled = value !== undefined
    const defaultText = String(defaultValue ?? "")
    const defaultFilled = defaultText.trim().length > 0
    const filled = controlled
      ? String(value ?? "").trim().length > 0
      : (item.answers[id]?.filled ?? defaultFilled)
    const effectiveDisabled = item.disabled || disabled

    useIsomorphicLayoutEffect(
      () => registerAnswer(id, defaultFilled),
      [defaultFilled, id, registerAnswer]
    )
    React.useEffect(() => {
      setAnswerDefault(id, defaultFilled)
    }, [defaultFilled, id, setAnswerDefault])
    React.useEffect(() => {
      if (controlled) syncAnswer(id, filled)
    }, [controlled, filled, id, syncAnswer])

    return (
      <div
        data-slot="questionnaire-input-wrapper"
        className="group/questionnaire-input relative w-full min-w-0"
      >
        {useRender<QuestionnaireInputState, HTMLInputElement>({
          defaultTagName: "input",
          ref: forwardedRef,
          render,
          state: {
            disabled: effectiveDisabled,
            filled,
            invalid: item.invalid,
          },
          props: {
            ...props,
            "aria-invalid": item.invalid || undefined,
            "data-empty": filled ? undefined : "",
            "data-filled": filled ? "" : undefined,
            "data-slot": "questionnaire-input",
            className: cn(
              "h-8 min-h-11 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-[color,box-shadow,background-color] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 sm:min-h-0 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
              "selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground",
              className
            ),
            disabled: effectiveDisabled,
            defaultValue: controlled ? undefined : defaultValue,
            id,
            name: filled && !item.skipped ? item.name : undefined,
            required: item.required,
            type,
            value: controlled ? value : undefined,
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
              onChange?.(event)
              if (event.defaultPrevented) return
              item.setAnswerFromInteraction(
                id,
                event.currentTarget.value.trim().length > 0,
                !item.multiple
              )
            },
          },
        })}
      </div>
    )
  }
)
QuestionnaireInput.displayName = "QuestionnaireInput"

interface QuestionnaireErrorState extends Record<string, unknown> {
  invalid: boolean
}

export type QuestionnaireErrorProps = useRender.ComponentProps<
  "p",
  QuestionnaireErrorState
>

const QuestionnaireError = React.forwardRef<
  HTMLParagraphElement,
  QuestionnaireErrorProps
>(({ children, className, id: idProp, render, ...props }, forwardedRef) => {
  const item = useQuestionnaireItem("QuestionnaireError")
  const registerError = item.registerError
  const generatedId = React.useId()
  const id = idProp ?? generatedId
  useIsomorphicLayoutEffect(() => registerError(id), [id, registerError])
  return useRender<QuestionnaireErrorState, HTMLParagraphElement>({
    defaultTagName: "p",
    ref: forwardedRef,
    render,
    state: { invalid: item.invalid },
    props: {
      ...props,
      "data-slot": "questionnaire-error",
      className: cn("mt-2 text-sm text-destructive", className),
      children:
        children ??
        (item.required
          ? "Choose an answer to continue."
          : "Choose an answer or skip this question."),
      hidden: !item.invalid,
      id,
      role: item.invalid ? "alert" : undefined,
    },
  })
})
QuestionnaireError.displayName = "QuestionnaireError"

const QuestionnaireActions = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, forwardedRef) => (
  <div
    ref={forwardedRef}
    data-slot="questionnaire-actions"
    className={cn(
      "grid min-h-11 w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 sm:min-h-8",
      className
    )}
    {...props}
  />
))
QuestionnaireActions.displayName = "QuestionnaireActions"

type NavigationKind = "previous" | "skip" | "next" | "submit"

type QuestionnaireNavigationProps = useRender.ComponentProps<
  "button",
  QuestionnaireNavigationState
> &
  Pick<React.ComponentProps<typeof Button>, "size" | "variant"> & {
    navigation: NavigationKind
  }

const QuestionnaireNavigation = React.forwardRef<
  HTMLButtonElement,
  QuestionnaireNavigationProps
>(
  (
    {
      children,
      className,
      disabled = false,
      navigation,
      onClick,
      render,
      size = "default",
      tabIndex,
      type,
      variant,
      ...props
    },
    forwardedRef
  ) => {
    const root = useQuestionnaireRoot(`Questionnaire${navigation}`)
    const visible =
      navigation === "previous"
        ? root.total > 1 && !root.first
        : navigation === "skip"
          ? root.activeItem?.required === false
          : navigation === "next"
            ? root.total > 1 && !root.last
            : root.total > 0 && root.last
    const shortcut =
      visible && !disabled && (navigation === "next" || navigation === "submit")
        ? "Enter"
        : null
    const finalVariant =
      variant ??
      (navigation === "previous" || navigation === "skip"
        ? "outline"
        : "default")
    const labels: Record<NavigationKind, string> = {
      next: "Next",
      previous: "Previous",
      skip: "Skip",
      submit: "Submit",
    }
    const positions: Record<NavigationKind, string> = {
      next: "col-start-3 row-start-1 min-h-11 justify-self-end sm:min-h-0",
      previous:
        "col-start-1 row-start-1 min-h-11 justify-self-start sm:min-h-0",
      skip: "col-start-2 row-start-1 min-h-11 justify-self-end sm:min-h-0",
      submit: "col-start-3 row-start-1 min-h-11 justify-self-end sm:min-h-0",
    }
    const state: QuestionnaireNavigationState = {
      disabled,
      shortcut,
      status: root.activeItem?.status ?? null,
      visible,
    }

    return useRender<QuestionnaireNavigationState, HTMLButtonElement>({
      defaultTagName: "button",
      ref: forwardedRef,
      render,
      state,
      props: {
        ...props,
        "aria-hidden": visible ? undefined : true,
        "aria-keyshortcuts": shortcut ?? undefined,
        "data-hidden": visible ? undefined : "",
        "data-slot": `questionnaire-${navigation}`,
        "data-size": size,
        "data-variant": finalVariant,
        "data-visible": visible ? "" : undefined,
        className: cn(
          buttonVariants({ size, variant: finalVariant }),
          positions[navigation],
          className
        ),
        children: children ?? labels[navigation],
        disabled,
        hidden: !visible,
        inert: visible ? undefined : true,
        tabIndex: visible ? tabIndex : -1,
        type: type ?? (navigation === "submit" ? "submit" : "button"),
        onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
          onClick?.(event)
          if (event.defaultPrevented || disabled) return
          if (navigation === "previous") root.goPrevious()
          else if (navigation === "skip") root.skipCurrent()
          else if (navigation === "next") root.goNext()
        },
      },
    })
  }
)
QuestionnaireNavigation.displayName = "QuestionnaireNavigation"

export type QuestionnaireNavigationButtonProps = Omit<
  QuestionnaireNavigationProps,
  "navigation"
>

const QuestionnairePrevious = React.forwardRef<
  HTMLButtonElement,
  QuestionnaireNavigationButtonProps
>((props, ref) => (
  <QuestionnaireNavigation ref={ref} navigation="previous" {...props} />
))
QuestionnairePrevious.displayName = "QuestionnairePrevious"

const QuestionnaireSkip = React.forwardRef<
  HTMLButtonElement,
  QuestionnaireNavigationButtonProps
>((props, ref) => (
  <QuestionnaireNavigation ref={ref} navigation="skip" {...props} />
))
QuestionnaireSkip.displayName = "QuestionnaireSkip"

const QuestionnaireNext = React.forwardRef<
  HTMLButtonElement,
  QuestionnaireNavigationButtonProps
>((props, ref) => (
  <QuestionnaireNavigation ref={ref} navigation="next" {...props} />
))
QuestionnaireNext.displayName = "QuestionnaireNext"

const QuestionnaireSubmit = React.forwardRef<
  HTMLButtonElement,
  QuestionnaireNavigationButtonProps
>((props, ref) => (
  <QuestionnaireNavigation ref={ref} navigation="submit" {...props} />
))
QuestionnaireSubmit.displayName = "QuestionnaireSubmit"

export {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
}
