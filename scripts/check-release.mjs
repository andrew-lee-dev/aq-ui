import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import process from "node:process"

const root = process.cwd()
const cliPackage = JSON.parse(
  await readFile(resolve(root, "packages/cli/package.json"), "utf8")
)
const preState = JSON.parse(
  await readFile(resolve(root, ".changeset/pre.json"), "utf8")
)
const generatedVersion = await readFile(
  resolve(root, "packages/cli/src/generated/version.ts"),
  "utf8"
)
const registry = JSON.parse(
  await readFile(resolve(root, "registry.json"), "utf8")
)

const version = cliPackage.version
const prereleaseTag = /-([0-9A-Za-z-]+)(?:\.|$)/u.exec(version)?.[1]
if (
  !prereleaseTag ||
  preState.mode !== "pre" ||
  preState.tag !== prereleaseTag
) {
  throw new Error(
    `Release policy mismatch: ${version} must use Changesets prerelease tag ${prereleaseTag ?? "<missing>"}.`
  )
}
if (!generatedVersion.includes(`VERSION = ${JSON.stringify(version)}`)) {
  throw new Error("Generated CLI version is stale.")
}
for (const item of registry.items ?? []) {
  if (item.version !== version) {
    throw new Error(
      `Registry item ${item.name} has stale version ${item.version}.`
    )
  }
}

console.log(
  `Release policy verified for ${version} (${preState.tag} dist-tag).`
)
