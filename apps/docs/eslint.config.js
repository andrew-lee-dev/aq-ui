import { nextJsConfig } from "@aq-ui/eslint-config/next-js"

/** @type {import("eslint").Linter.Config} */
export default [
  {
    ignores: [
      "out/**",
      "storybook-static/**",
      "public/r/**",
      "public/registry.json",
    ],
  },
  ...nextJsConfig,
]
