import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Button } from "@aq-ui/registry/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@aq-ui/registry/components/dialog"
import { Input } from "@aq-ui/registry/components/input"
import { Label } from "@aq-ui/registry/components/label"

const meta = {
  title: "Core/Dialog",
  component: Dialog,
  tags: ["autodocs"],
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

function RenameDialog({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <Dialog defaultOpen={defaultOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        Rename project
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename project</DialogTitle>
          <DialogDescription>
            Choose a clear name. You can change it again at any time.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="dialog-project-name">Project name</Label>
          <Input id="dialog-project-name" defaultValue="aq-ui" autoFocus />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <DialogClose render={<Button />}>Save</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const Interactive: Story = {
  render: () => <RenameDialog />,
}

export const InitiallyOpen: Story = {
  render: () => <RenameDialog defaultOpen />,
  parameters: {
    docs: { story: { inline: false } },
  },
}
