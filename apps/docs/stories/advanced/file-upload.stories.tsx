import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { FileUpload } from "@aq-ui/registry/components/file-upload"

const meta = {
  title: "Advanced/File Upload",
  component: FileUpload,
  tags: ["autodocs"],
  args: {
    accept: "image/*,.pdf",
    description: "PNG, JPG, or PDF. Up to 5 MB per file.",
    maxFiles: 4,
    maxSize: 5 * 1024 * 1024,
    multiple: true,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Keyboard-accessible file selection and drag/drop. Add an uploadAdapter to enable progress, cancellation, and retry.",
      },
    },
  },
} satisfies Meta<typeof FileUpload>

export default meta
type Story = StoryObj<typeof meta>

export const Dropzone: Story = {}

export const Disabled: Story = {
  args: {
    disabled: true,
    label: "File uploads are disabled",
  },
}

export const SingleImage: Story = {
  args: {
    accept: "image/*",
    description: "Choose one profile image up to 2 MB.",
    label: "Drop a profile image here",
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024,
    multiple: false,
  },
}
