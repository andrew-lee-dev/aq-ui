import {
  MANIFEST_FILE,
  detectPackageManager,
  loadComponentsConfig,
  loadManifest,
  resolveRegistryFileTarget,
} from "./config.js"
import { CliError, invariant } from "./errors.js"
import {
  commitFileOperations,
  currentFileHash,
  hashContent,
  normalizeRelativePath,
  stringifyJson,
} from "./fs.js"
import { installPackages } from "./packages.js"
import { isCodeLanguageItemName } from "./languages.js"
import { RegistryClient } from "./registry.js"
import { prepareRegistryFile } from "./transform.js"
import type {
  AqManifest,
  DiffEntry,
  FileOperation,
  GlobalOptions,
  InstallPlan,
  ManifestItem,
  RegistryItem,
} from "./types.js"

export interface InstallerContext {
  options: GlobalOptions
  client: RegistryClient
}

export async function resolveItemGraph(
  client: RegistryClient,
  requestedNames: readonly string[]
): Promise<RegistryItem[]> {
  const ordered: RegistryItem[] = []
  const state = new Map<string, "visiting" | "done">()

  async function visit(name: string, ancestry: string[]): Promise<void> {
    const currentState = state.get(name)
    if (currentState === "done") return
    if (currentState === "visiting") {
      throw new CliError(
        "REGISTRY_DEPENDENCY_CYCLE",
        `Registry dependency cycle: ${[...ancestry, name].join(" -> ")}`
      )
    }
    state.set(name, "visiting")
    const item = await client.item(name)
    for (const dependency of item.registryDependencies ?? []) {
      await visit(dependency, [...ancestry, name])
    }
    state.set(name, "done")
    ordered.push(item)
  }

  for (const name of requestedNames) await visit(name, [])
  return ordered
}

export async function createInstallPlan(
  root: string,
  items: readonly RegistryItem[],
  manifest: AqManifest,
  force: boolean
): Promise<InstallPlan> {
  const config = await loadComponentsConfig(root)
  const operations = new Map<string, FileOperation>()
  const targetContent = new Map<string, string>()
  const conflicts: string[] = []

  for (const item of items) {
    const incomingTargets = new Set<string>()
    for (const file of item.files) {
      invariant(
        typeof file.content === "string",
        "ITEM_CONTENT_MISSING",
        `Registry item ${item.name} has no content for ${file.path}.`
      )
      const prepared = await prepareRegistryFile(
        root,
        config,
        file,
        item.type,
        resolveRegistryFileTarget
      )
      const { target, content } = prepared
      incomingTargets.add(target)
      const duplicateContent = targetContent.get(target)
      if (duplicateContent !== undefined) {
        invariant(
          duplicateContent === content,
          "DUPLICATE_TARGET",
          `Registry items contain different content for ${target}.`
        )
        continue
      }
      targetContent.set(target, content)

      const currentHash = await currentFileHash(root, target)
      const incomingHash = hashContent(content)
      if (currentHash === incomingHash) continue

      const installedOwners = Object.values(manifest.items).filter((entry) =>
        entry.files.some((file) => file.path === target)
      )
      const conflictingOwner = installedOwners.find(
        (entry) =>
          entry.name !== item.name &&
          entry.files.find((file) => file.path === target)?.hash !== incomingHash
      )
      invariant(
        !conflictingOwner,
        "DUPLICATE_OWNERSHIP",
        `${target} is owned by ${conflictingOwner?.name} with different content.`
      )
      const installedFile = installedOwners
        .flatMap((entry) => entry.files)
        .find((entry) => entry.path === target)
      // Preserve local edits when the registry copy itself has not changed.
      if (installedFile?.hash === incomingHash) continue
      const isCleanInstalledFile = installedFile?.hash === currentHash
      if (currentHash !== undefined && !isCleanInstalledFile && !force) {
        conflicts.push(target)
        continue
      }

      operations.set(target, {
        kind: "write",
        path: target,
        content,
        previousHash: currentHash,
        item: item.name,
      })
    }

    const previouslyInstalled = manifest.items[item.name]
    for (const previousFile of previouslyInstalled?.files ?? []) {
      if (incomingTargets.has(previousFile.path)) continue
      if (targetContent.has(previousFile.path)) continue
      const ownedByAnotherItem = Object.values(manifest.items).some(
        (entry) =>
          entry.name !== item.name && entry.files.some((file) => file.path === previousFile.path)
      )
      if (ownedByAnotherItem) continue
      const currentHash = await currentFileHash(root, previousFile.path)
      if (currentHash === undefined) continue
      if (currentHash !== previousFile.hash && !force) {
        conflicts.push(previousFile.path)
        continue
      }
      operations.set(previousFile.path, {
        kind: "remove",
        path: previousFile.path,
        previousHash: currentHash,
        item: item.name,
      })
    }
  }

  return {
    items: [...items],
    operations: [...operations.values()],
    dependencies: [...new Set(items.flatMap((item) => item.dependencies ?? []))].sort(),
    devDependencies: [...new Set(items.flatMap((item) => item.devDependencies ?? []))].sort(),
    conflicts: [...new Set(conflicts)].sort(),
  }
}

async function manifestWithInstalledItems(
  root: string,
  current: AqManifest,
  items: readonly RegistryItem[],
  client: RegistryClient,
  registry: string,
  channel: string,
  prunedItems: readonly string[] = []
): Promise<AqManifest> {
  const config = await loadComponentsConfig(root)
  const next: AqManifest = {
    ...current,
    registry,
    channel,
    items: { ...current.items },
  }

  for (const name of prunedItems) delete next.items[name]

  if (items.some((item) => item.name === "code-language-preset")) {
    next.codeLanguages = [...client.getCodeLanguages()]
  }

  for (const item of items) {
    const files = await Promise.all(
      item.files.map(async (file) => {
        invariant(typeof file.content === "string", "ITEM_CONTENT_MISSING", `Missing ${file.path}.`)
        const prepared = await prepareRegistryFile(
          root,
          config,
          file,
          item.type,
          resolveRegistryFileTarget
        )
        return {
          path: prepared.target,
          hash: hashContent(prepared.content),
        }
      })
    )
    next.items[item.name] = {
      name: item.name,
      type: item.type,
      ...(item.version ? { version: item.version } : {}),
      registry: client.getSourceForItem(item),
      installedAt: new Date().toISOString(),
      registryDependencies: [...(item.registryDependencies ?? [])],
      dependencies: [...(item.dependencies ?? [])],
      devDependencies: [...(item.devDependencies ?? [])],
      files,
    }
  }
  return next
}

interface LanguagePrunePlan {
  items: string[]
  operations: FileOperation[]
  conflicts: string[]
}

async function createLanguagePrunePlan(
  root: string,
  items: readonly RegistryItem[],
  manifest: AqManifest,
  force: boolean
): Promise<LanguagePrunePlan> {
  if (!items.some((item) => item.name === "code-language-preset")) {
    return { items: [], operations: [], conflicts: [] }
  }

  const incomingNames = new Set(items.map((item) => item.name))
  const desiredLanguages = new Set(
    items.map((item) => item.name).filter((name) => isCodeLanguageItemName(name))
  )
  const protectedLanguages = new Set(
    Object.values(manifest.items)
      .filter((entry) => !incomingNames.has(entry.name))
      .flatMap((entry) => entry.registryDependencies)
      .filter((name) => isCodeLanguageItemName(name))
  )
  const staleItems = Object.values(manifest.items).filter(
    (entry) =>
      isCodeLanguageItemName(entry.name) &&
      !desiredLanguages.has(entry.name) &&
      !protectedLanguages.has(entry.name)
  )
  const staleNames = new Set(staleItems.map((item) => item.name))
  const filesToKeep = new Set(
    Object.values(manifest.items)
      .filter((entry) => !staleNames.has(entry.name))
      .flatMap((entry) => entry.files.map((file) => file.path))
  )
  const operations: FileOperation[] = []
  const conflicts: string[] = []

  for (const item of staleItems) {
    for (const file of item.files) {
      if (filesToKeep.has(file.path)) continue
      const currentHash = await currentFileHash(root, file.path)
      if (currentHash === undefined) continue
      if (currentHash !== file.hash && !force) {
        conflicts.push(file.path)
        continue
      }
      operations.push({
        kind: "remove",
        path: file.path,
        previousHash: currentHash,
        item: item.name,
      })
    }
  }

  return {
    items: [...staleNames].sort(),
    operations,
    conflicts: [...new Set(conflicts)].sort(),
  }
}

export interface InstallResult {
  installed: string[]
  files: string[]
  dependencies: string[]
  devDependencies: string[]
  packageManager?: string
  prunedLanguages: string[]
  dryRun: boolean
}

export async function installItems(
  context: InstallerContext,
  requestedNames: readonly string[]
): Promise<InstallResult> {
  const { options, client } = context
  invariant(requestedNames.length > 0, "ITEM_REQUIRED", "Provide at least one registry item.")
  const config = await loadComponentsConfig(options.cwd)
  const registry =
    options.registry ?? config.registry ?? client.getBaseForItem(requestedNames[0] ?? "")
  const manifest = await loadManifest(options.cwd, { registry, channel: options.channel })
  const items = await resolveItemGraph(client, requestedNames)
  const plan = await createInstallPlan(options.cwd, items, manifest, options.force)
  const languagePrune = await createLanguagePrunePlan(options.cwd, items, manifest, options.force)

  const conflicts = [...new Set([...plan.conflicts, ...languagePrune.conflicts])]
  if (conflicts.length > 0) {
    throw new CliError(
      "LOCAL_CHANGES",
      `Refusing to overwrite modified files: ${conflicts.join(", ")}. Use aq-ui diff or --force.`,
      { conflicts }
    )
  }

  const packageManager = options.packageManager ?? (await detectPackageManager(options.cwd))
  if (!options.dryRun && !options.skipDeps) {
    installPackages(options.cwd, packageManager, plan.dependencies, false, options.json)
    installPackages(options.cwd, packageManager, plan.devDependencies, true, options.json)
  }

  const nextManifest = await manifestWithInstalledItems(
    options.cwd,
    manifest,
    items,
    client,
    registry,
    options.channel,
    languagePrune.items
  )
  const operations: FileOperation[] = [
    ...plan.operations,
    ...languagePrune.operations,
    {
      kind: "write",
      path: MANIFEST_FILE,
      content: stringifyJson(nextManifest),
      item: "@aq-ui/manifest",
    },
  ]
  await commitFileOperations(options.cwd, operations, options.dryRun)

  return {
    installed: items.map((item) => item.name),
    files: [...plan.operations, ...languagePrune.operations].map((operation) => operation.path),
    dependencies: plan.dependencies,
    devDependencies: plan.devDependencies,
    ...(!options.skipDeps ? { packageManager } : {}),
    prunedLanguages: languagePrune.items,
    dryRun: options.dryRun,
  }
}

function isDependencyOn(entry: ManifestItem, name: string): boolean {
  return entry.registryDependencies.some((dependency) => dependency === name)
}

export interface RemoveResult {
  removed: string[]
  files: string[]
  dryRun: boolean
}

export async function removeItems(
  root: string,
  names: readonly string[],
  defaults: { registry: string; channel: string },
  options: Pick<GlobalOptions, "dryRun" | "force">
): Promise<RemoveResult> {
  invariant(names.length > 0, "ITEM_REQUIRED", "Provide at least one installed item.")
  const manifest = await loadManifest(root, defaults)
  for (const name of names) {
    invariant(manifest.items[name], "ITEM_NOT_INSTALLED", `${name} is not installed.`)
  }

  const selected = new Set(names)
  const dependents = Object.values(manifest.items).filter(
    (item) => !selected.has(item.name) && names.some((name) => isDependencyOn(item, name))
  )
  invariant(
    dependents.length === 0,
    "ITEM_IN_USE",
    `Cannot remove ${names.join(", ")}; required by ${dependents.map((item) => item.name).join(", ")}.`
  )

  const filesToKeep = new Set(
    Object.values(manifest.items)
      .filter((item) => !selected.has(item.name))
      .flatMap((item) => item.files.map((file) => file.path))
  )
  const operations: FileOperation[] = []
  for (const name of names) {
    const item = manifest.items[name]
    if (!item) continue
    for (const file of item.files) {
      if (filesToKeep.has(file.path)) continue
      const currentHash = await currentFileHash(root, file.path)
      if (currentHash === undefined) continue
      if (currentHash !== file.hash && !options.force) {
        throw new CliError(
          "LOCAL_CHANGES",
          `Refusing to remove modified file ${file.path}. Use --force to remove it.`
        )
      }
      operations.push({ kind: "remove", path: file.path, item: name })
    }
    delete manifest.items[name]
  }
  operations.push({
    kind: "write",
    path: MANIFEST_FILE,
    content: stringifyJson(manifest),
    item: "@aq-ui/manifest",
  })
  await commitFileOperations(root, operations, options.dryRun)
  return {
    removed: [...names],
    files: operations
      .filter((operation) => operation.kind === "remove")
      .map((operation) => operation.path),
    dryRun: options.dryRun,
  }
}

export async function diffItems(
  root: string,
  names: readonly string[],
  defaults: { registry: string; channel: string },
  client?: RegistryClient
): Promise<DiffEntry[]> {
  const manifest = await loadManifest(root, defaults)
  const selected = names.length > 0 ? names : Object.keys(manifest.items)
  const config = await loadComponentsConfig(root)
  const result: DiffEntry[] = []

  for (const name of selected) {
    const installed = manifest.items[name]
    invariant(installed, "ITEM_NOT_INSTALLED", `${name} is not installed.`)
    let upstream: Map<string, string> | undefined
    if (client) {
      try {
        const item = await client.item(name)
        upstream = new Map(
          await Promise.all(
            item.files.map(async (file): Promise<[string, string]> => {
              invariant(
                typeof file.content === "string",
                "ITEM_CONTENT_MISSING",
                `Missing ${file.path}.`
              )
              const prepared = await prepareRegistryFile(
                root,
                config,
                file,
                item.type,
                resolveRegistryFileTarget
              )
              return [prepared.target, hashContent(prepared.content)]
            })
          )
        )
      } catch {
        upstream = undefined
      }
    }

    for (const file of installed.files) {
      const currentHash = await currentFileHash(root, file.path)
      const upstreamHash = upstream?.get(file.path)
      result.push({
        item: name,
        path: normalizeRelativePath(file.path),
        local:
          currentHash === undefined ? "missing" : currentHash === file.hash ? "clean" : "modified",
        upstream:
          upstream === undefined
            ? "unavailable"
            : upstreamHash === undefined
              ? "missing"
              : upstreamHash === file.hash
                ? "unchanged"
                : "changed",
      })
    }
    for (const [upstreamPath] of upstream ?? []) {
      if (installed.files.some((file) => file.path === upstreamPath)) continue
      const currentHash = await currentFileHash(root, upstreamPath)
      result.push({
        item: name,
        path: normalizeRelativePath(upstreamPath),
        local: currentHash === undefined ? "missing" : "modified",
        upstream: "changed",
      })
    }
  }
  return result
}
