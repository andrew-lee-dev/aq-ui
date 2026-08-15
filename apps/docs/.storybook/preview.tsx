import type { Preview } from "@storybook/nextjs-vite"
import { withThemeByClassName } from "@storybook/addon-themes"

import "@aq-ui/registry/globals.css"

const preview: Preview = {
  decorators: [
    withThemeByClassName({
      themes: {
        Light: "light",
        Dark: "dark",
      },
      defaultTheme: "Light",
    }),
    (Story) => (
      <div className="min-h-40 bg-background p-6 text-foreground">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      options: {
        rules: {
          region: { enabled: false },
        },
      },
    },
    docs: {
      toc: true,
    },
  },
  initialGlobals: {
    a11y: { manual: false },
    theme: "Light",
  },
}

export default preview
