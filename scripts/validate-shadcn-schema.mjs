import { readFile, readdir } from "node:fs/promises"
import { createRequire } from "node:module"
import { resolve } from "node:path"
import process from "node:process"
import Ajv from "ajv"

const require = createRequire(import.meta.url)
const draft7MetaSchema = require("ajv/dist/refs/json-schema-draft-07.json")

const registrySchemaURL = "https://ui.shadcn.com/schema/registry.json"
const itemSchemaURL = "https://ui.shadcn.com/schema/registry-item.json"

async function fetchSchema(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) })
  if (!response.ok) {
    throw new Error(`Unable to fetch ${url}: HTTP ${response.status}.`)
  }
  return response.json()
}

const root = process.cwd()
const [registrySchema, itemSchema, catalog] = await Promise.all([
  fetchSchema(registrySchemaURL),
  fetchSchema(itemSchemaURL),
  readFile(resolve(root, "registry.json"), "utf8").then(JSON.parse),
])
const ajv = new Ajv({ allErrors: true, strict: false, validateFormats: false })
ajv.addMetaSchema({
  ...draft7MetaSchema,
  $id: "https://json-schema.org/draft-07/schema#",
})
ajv.addSchema(itemSchema, itemSchemaURL)
const validateCatalog = ajv.compile(registrySchema)
const validateItem = ajv.getSchema(itemSchemaURL)

if (!validateCatalog(catalog)) {
  throw new Error(
    `registry.json does not conform to the shadcn schema:\n${ajv.errorsText(validateCatalog.errors, { separator: "\n" })}`
  )
}
if (!validateItem)
  throw new Error("Unable to compile the registry item schema.")

const recordsRoot = resolve(root, "apps/docs/public/r")
const files = (await readdir(recordsRoot)).filter((file) =>
  file.endsWith(".json")
)
for (const file of files) {
  const record = JSON.parse(await readFile(resolve(recordsRoot, file), "utf8"))
  if (!validateItem(record)) {
    throw new Error(
      `${file} does not conform to the shadcn item schema:\n${ajv.errorsText(validateItem.errors, { separator: "\n" })}`
    )
  }
}

console.log(
  `Official shadcn schema validation passed for ${catalog.items.length} catalog items and ${files.length} records.`
)
