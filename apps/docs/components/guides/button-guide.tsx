import { buttonSizeOptions, buttonVariantOptions } from "@/lib/button-docs"

const buttonDescription =
  "An action control with native semantics, loading, six variants, eight sizes, and navigation and form patterns."

const buttonProps = [
  {
    name: "variant",
    type: buttonVariantOptions.map((value) => '"' + value + '"').join(" | "),
    defaultValue: '"default"',
    description: "Visual style only.",
  },
  {
    name: "size",
    type: buttonSizeOptions.map((value) => '"' + value + '"').join(" | "),
    defaultValue: '"default"',
    description: "Text or icon dimensions.",
  },
  {
    name: "loading",
    type: "boolean",
    defaultValue: "false",
    description: "Sets aria-busy and disables activation.",
  },
  {
    name: "loadingText",
    type: "ReactNode",
    defaultValue: "children",
    description: "Busy copy; null intentionally hides it.",
  },
  {
    name: "loadingPosition",
    type: '"start" | "end"',
    defaultValue: '"start"',
    description: "Indicator edge.",
  },
  {
    name: "loadingIndicator",
    type: "ReactNode",
    defaultValue: "spinner",
    description: "Custom node; null hides the spinner.",
  },
  {
    name: "render",
    type: "ReactElement | render function",
    defaultValue: "<button>",
    description: "Custom action element.",
  },
  {
    name: "nativeButton",
    type: "boolean",
    defaultValue: "true",
    description: "False for non-native actions only.",
  },
  {
    name: "focusableWhenDisabled",
    type: "boolean",
    defaultValue: "false",
    description: "Keeps disabled actions tabbable.",
  },
  {
    name: "disabled",
    type: "boolean",
    defaultValue: "false",
    description: "Prevents activation.",
  },
  {
    name: "type",
    type: '"button" | "submit" | "reset"',
    defaultValue: '"button"',
    description: "Native form behavior.",
  },
  {
    name: "className",
    type: "string | state callback",
    defaultValue: "undefined",
    description: "Additional or state-based styles.",
  },
] as const

const buttonPropsReference = buttonProps
  .map(
    (prop) =>
      `${prop.name}: ${prop.type} = ${prop.defaultValue}\n  ${prop.description}`
  )
  .join("\n")

function ButtonGuide() {
  return (
    <div className="mt-10 space-y-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:font-semibold [&_p]:mt-2 [&_p]:max-w-3xl [&_p]:text-muted-foreground [&_pre]:mt-3 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:bg-muted/40 [&_pre]:p-4 [&_pre]:text-sm [&_pre]:leading-6 [&>section]:scroll-mt-20">
      <section id="button-usage">
        <h2>Usage</h2>
        <p>
          Use the quick start below for actions. Navigation stays a real anchor
          styled with <code>buttonVariants</code>; a visual variant never
          changes semantics.
        </p>
        <p className="text-sm">
          Drive <code>loading</code> from app state. It disables activation,
          sets <code>aria-busy</code>, and shows a spinner;{" "}
          <code>loadingText</code> clarifies the pending action.
        </p>
      </section>

      <section id="button-props">
        <h2>Props and defaults</h2>
        <pre
          tabIndex={0}
          aria-label="Button props reference"
          className="text-xs leading-5 whitespace-pre-wrap"
        >
          <code>{buttonPropsReference}</code>
        </pre>
      </section>

      <section id="button-accessibility">
        <h2>Accessibility</h2>
        <ul className="mt-3 max-w-3xl list-disc space-y-2 ps-5 text-muted-foreground">
          <li>
            Use buttons for actions and anchors for navigation. A visual variant
            does not create link semantics; neither does <code>render</code>.
          </li>
          <li>
            Name icon-only buttons with <code>aria-label</code> or visible text.
          </li>
          <li>
            For async work, use <code>loading</code> and clear{" "}
            <code>loadingText</code>; disabled and <code>aria-busy</code> are
            automatic.
          </li>
          <li>
            In forms, choose <code>type</code> explicitly. Native buttons supply
            Enter and Space behavior; use <code>focusableWhenDisabled</code>{" "}
            only when disabled actions must stay discoverable.
          </li>
        </ul>
      </section>
    </div>
  )
}

export { ButtonGuide, buttonDescription }
