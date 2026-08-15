import Link from "next/link"
import {
  ArrowRightIcon,
  BlocksIcon,
  BracesIcon,
  TerminalSquareIcon,
} from "lucide-react"

import { Badge } from "@aq-ui/registry/components/badge"
import { buttonVariants } from "@aq-ui/registry/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@aq-ui/registry/components/card"
import { cn } from "@aq-ui/registry/lib/utils"

const features = [
  {
    icon: BlocksIcon,
    title: "75 component families",
    description:
      "Accessible Base UI primitives, advanced data components, and production editors.",
  },
  {
    icon: BracesIcon,
    title: "72 open-code hooks",
    description:
      "SSR-safe state, browser, DOM, accessibility, and controller hooks.",
  },
  {
    icon: TerminalSquareIcon,
    title: "Registry-first CLI",
    description: "Install only the source and dependencies your project needs.",
  },
]

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto flex max-w-5xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32">
        <Badge variant="outline" className="mb-5">
          React 18.3/19 · Tailwind CSS 4 · Base UI
        </Badge>
        <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-balance sm:text-7xl">
          Own your UI, down to the source.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-balance text-muted-foreground sm:text-xl">
          aq-ui is an accessible component system, hook toolkit, and
          content-editor suite distributed as open code.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/components/"
            className={cn(buttonVariants({ size: "lg" }))}
          >
            Browse components <ArrowRightIcon data-icon="inline-end" />
          </Link>
          <a
            href="https://github.com/andrew-lee-dev/aq-ui"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            View source
          </a>
        </div>
        <pre className="mt-8 max-w-full overflow-x-auto rounded-xl border bg-muted/40 px-5 py-3 text-start text-sm">
          <code>pnpm dlx aq-ui add button markdown-editor</code>
        </pre>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-24 sm:grid-cols-3 sm:px-6">
        {features.map(({ icon: Icon, title, description }) => (
          <Card key={title}>
            <CardHeader>
              <Icon className="mb-3 size-6 text-primary" />
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Install individual registry items and customize every line without
              wrapper APIs.
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  )
}
