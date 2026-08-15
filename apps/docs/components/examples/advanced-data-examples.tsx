"use client"

import * as React from "react"
import { Badge } from "@aq-ui/registry/components/badge"
import {
  ChartContainer,
  type ChartConfig,
} from "@aq-ui/registry/components/chart"
import {
  DataGrid,
  type DataGridProps,
} from "@aq-ui/registry/components/data-grid"
import {
  DataTable,
  type DataTableProps,
} from "@aq-ui/registry/components/data-table"
import { Input } from "@aq-ui/registry/components/input"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@aq-ui/registry/components/table"

function TableExample() {
  return (
    <div className="w-full max-w-2xl rounded-xl border">
      <Table>
        <TableCaption>Recent package builds</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Package</TableHead>
            <TableHead>Target</TableHead>
            <TableHead className="text-end">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[
            ["registry", "React 19", "Passed"],
            ["cli", "Node 24", "Passed"],
            ["docs", "Next.js", "Passed"],
          ].map(([name, target, status]) => (
            <TableRow key={name}>
              <TableCell className="font-medium">{name}</TableCell>
              <TableCell>{target}</TableCell>
              <TableCell className="text-end">
                <Badge variant="secondary">{status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

interface ProjectRow {
  id: string
  name: string
  framework: string
  status: "Ready" | "Building"
}

const projectRows: ProjectRow[] = [
  { id: "1", name: "Documentation", framework: "Next.js", status: "Ready" },
  { id: "2", name: "Dashboard", framework: "Vite", status: "Ready" },
  { id: "3", name: "Portal", framework: "React Router", status: "Building" },
  { id: "4", name: "Storefront", framework: "Next.js", status: "Ready" },
  { id: "5", name: "Backoffice", framework: "Vite", status: "Building" },
  { id: "6", name: "Playground", framework: "Next.js", status: "Ready" },
]

const projectColumns: DataTableProps<ProjectRow, unknown>["columns"] = [
  { accessorKey: "name", header: "Project" },
  { accessorKey: "framework", header: "Framework" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant={row.original.status === "Ready" ? "secondary" : "outline"}
      >
        {row.original.status}
      </Badge>
    ),
  },
]

function DataTableExample() {
  return (
    <DataTable
      columns={projectColumns}
      data={projectRows}
      pageSize={3}
      getRowId={(row) => row.id}
      toolbar={(table) => (
        <Input
          aria-label="Filter projects"
          className="max-w-xs"
          placeholder="Filter projects…"
          value={String(table.getColumn("name")?.getFilterValue() ?? "")}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.currentTarget.value)
          }
        />
      )}
    />
  )
}

const gridRows: ProjectRow[] = Array.from({ length: 48 }, (_, index) => ({
  id: String(index + 1),
  name: `Project ${String(index + 1).padStart(2, "0")}`,
  framework: index % 2 ? "Vite" : "Next.js",
  status: index % 5 ? "Ready" : "Building",
}))

const gridColumns: DataGridProps<ProjectRow, unknown>["columns"] = [
  { accessorKey: "name", header: "Project", size: 190 },
  { accessorKey: "framework", header: "Framework", size: 170 },
  {
    accessorKey: "status",
    header: "Status",
    size: 140,
    cell: ({ row }) => (
      <Badge
        variant={row.original.status === "Ready" ? "secondary" : "outline"}
      >
        {row.original.status}
      </Badge>
    ),
  },
]

export function DataGridExample() {
  return (
    <DataGrid
      columns={gridColumns}
      data={gridRows}
      height={320}
      getRowId={(row) => row.id}
      toolbar={(table) => (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium">Projects</p>
            <p className="text-sm text-muted-foreground">
              48 virtualized records
            </p>
          </div>
          <Input
            aria-label="Filter grid projects"
            className="max-w-56"
            placeholder="Filter projects…"
            value={String(table.getColumn("name")?.getFilterValue() ?? "")}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.currentTarget.value)
            }
          />
        </div>
      )}
    />
  )
}

const chartConfig = {
  installs: { label: "Installs", color: "var(--color-primary)" },
} satisfies ChartConfig

function MiniLineChart({
  width = 560,
  height = 240,
}: {
  width?: number
  height?: number
}) {
  return (
    <svg
      role="img"
      aria-label="Weekly registry installs rising from 320 to 790"
      width={width}
      height={height}
      viewBox="0 0 560 240"
      preserveAspectRatio="none"
    >
      {[40, 90, 140, 190].map((y) => (
        <line
          key={y}
          x1="32"
          x2="540"
          y1={y}
          y2={y}
          stroke="currentColor"
          className="text-border"
          strokeDasharray="4 6"
        />
      ))}
      <path
        d="M32 192 C92 176 120 180 170 142 S260 126 305 112 S382 82 430 88 S500 48 540 42"
        fill="none"
        stroke="var(--color-installs)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M32 192 C92 176 120 180 170 142 S260 126 305 112 S382 82 430 88 S500 48 540 42 L540 214 L32 214 Z"
        fill="var(--color-installs)"
        opacity="0.12"
      />
    </svg>
  )
}

function ChartExample() {
  return (
    <div className="w-full max-w-2xl rounded-xl border p-4">
      <div className="mb-3">
        <p className="font-medium">Registry installs</p>
        <p className="text-sm text-muted-foreground">Last seven days</p>
      </div>
      <ChartContainer config={chartConfig} className="aspect-[7/3]">
        <MiniLineChart />
      </ChartContainer>
    </div>
  )
}

const AdvancedDataExamples: Record<string, React.ComponentType> = {
  table: TableExample,
  "data-table": DataTableExample,
  "data-grid": DataGridExample,
  chart: ChartExample,
}

interface AdvancedDataRendererProps {
  name: string
}

function AdvancedDataRenderer({ name }: AdvancedDataRendererProps) {
  const Example = AdvancedDataExamples[name]

  if (!Example) {
    return <p role="alert">The preview for {name} is unavailable.</p>
  }

  return <Example />
}

export { AdvancedDataRenderer }
