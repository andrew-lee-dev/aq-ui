import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Badge } from "@aq-ui/registry/components/badge"
import {
  DataGrid,
  type DataGridProps,
} from "@aq-ui/registry/components/data-grid"
import { Input } from "@aq-ui/registry/components/input"

interface Member {
  id: string
  name: string
  email: string
  role: "Admin" | "Editor" | "Viewer"
  status: "Active" | "Invited"
}

const roles: Member["role"][] = ["Admin", "Editor", "Viewer"]
const members: Member[] = Array.from({ length: 240 }, (_, index) => ({
  id: `member-${index + 1}`,
  name: `Member ${String(index + 1).padStart(3, "0")}`,
  email: `member${index + 1}@example.com`,
  role: roles[index % roles.length] ?? "Viewer",
  status: index % 7 === 0 ? "Invited" : "Active",
}))

const columns: DataGridProps<Member, unknown>["columns"] = [
  {
    accessorKey: "name",
    header: "Name",
    size: 190,
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "email",
    header: "Email",
    size: 260,
  },
  {
    accessorKey: "role",
    header: "Role",
    size: 140,
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 120,
    cell: ({ row }) => (
      <Badge
        variant={row.original.status === "Active" ? "secondary" : "outline"}
      >
        {row.original.status}
      </Badge>
    ),
  },
]

const meta = {
  title: "Advanced/Data Grid",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A sortable, filterable, resizable, and virtualized data grid. This scenario renders 240 rows.",
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Virtualized: Story = {
  render: () => (
    <div className="w-full max-w-5xl">
      <DataGrid
        columns={columns}
        data={members}
        height={430}
        getRowId={(row) => row.id}
        toolbar={(table) => (
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Workspace members</h2>
              <p className="text-sm text-muted-foreground">
                240 records, rendered on demand.
              </p>
            </div>
            <Input
              aria-label="Filter members by name"
              className="max-w-64"
              placeholder="Filter names…"
              value={String(table.getColumn("name")?.getFilterValue() ?? "")}
              onChange={(event) =>
                table
                  .getColumn("name")
                  ?.setFilterValue(event.currentTarget.value)
              }
            />
          </div>
        )}
      />
    </div>
  ),
}

export const Empty: Story = {
  render: () => (
    <div className="w-full max-w-5xl">
      <DataGrid
        columns={columns}
        data={[]}
        height={240}
        emptyMessage="No members found."
      />
    </div>
  ),
}
