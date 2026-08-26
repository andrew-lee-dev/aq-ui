import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import process from "node:process"

const root = process.cwd()
const workspacePackage = JSON.parse(
  await readFile(resolve(root, "package.json"), "utf8")
)
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
const releaseWorkflow = await readFile(
  resolve(root, ".github/workflows/release.yml"),
  "utf8"
)

const version = cliPackage.version
const prereleaseTag = /-([0-9A-Za-z-]+)(?:\.|$)/u.exec(version)?.[1]
const releaseScript = workspacePackage.scripts?.release
const releaseNodeVersion = /\bnode-version:\s*["']?(\d+)(?:\.(\d+))?/u.exec(
  releaseWorkflow
)
if (
  !prereleaseTag ||
  preState.mode !== "pre" ||
  preState.tag !== prereleaseTag
) {
  throw new Error(
    `Release policy mismatch: ${version} must use Changesets prerelease tag ${prereleaseTag ?? "<missing>"}.`
  )
}
if (
  typeof releaseScript !== "string" ||
  !releaseScript.includes("changeset publish")
) {
  throw new Error("The release script must publish through Changesets.")
}
if (/\bchangeset publish\b[^\n]*\s--tag(?:=|\s)/u.test(releaseScript)) {
  throw new Error(
    "Do not pass --tag to changeset publish while Changesets prerelease mode determines the dist-tag."
  )
}
if (!/^\s*id-token:\s*write\s*$/mu.test(releaseWorkflow)) {
  throw new Error(
    "The release workflow must grant id-token: write for npm OIDC."
  )
}
if (!/^\s*runs-on:\s*ubuntu-latest\s*$/mu.test(releaseWorkflow)) {
  throw new Error(
    "The release workflow must publish from a GitHub-hosted runner."
  )
}
if (
  !releaseNodeVersion ||
  Number(releaseNodeVersion[1]) < 22 ||
  (Number(releaseNodeVersion[1]) === 22 &&
    Number(releaseNodeVersion[2] ?? 0) < 14)
) {
  throw new Error(
    "The release workflow must use Node.js 22.14 or newer for npm OIDC."
  )
}
if (/\b(?:NODE_AUTH_TOKEN|NPM_TOKEN)\b|:_authToken\b/u.test(releaseWorkflow)) {
  throw new Error(
    "The release workflow must use npm Trusted Publishing without a long-lived npm token."
  )
}
if (/\bNPM_CONFIG_PROVENANCE\b|--provenance\b/u.test(releaseWorkflow)) {
  throw new Error(
    "npm Trusted Publishing generates provenance without an explicit workflow override."
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
