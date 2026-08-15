import { createHash, randomUUID } from "node:crypto"
import {
  access,
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises"
import path from "node:path"

import { CliError, asError, invariant } from "./errors.js"
import type { FileOperation } from "./types.js"

export function hashContent(content: string | Buffer): string {
  return createHash("sha256").update(content).digest("hex")
}

export function stripJsonComments(source: string): string {
  let output = ""
  let inString = false
  let escaped = false
  let lineComment = false
  let blockComment = false

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index] ?? ""
    const next = source[index + 1] ?? ""

    if (lineComment) {
      if (char === "\n" || char === "\r") {
        lineComment = false
        output += char
      } else {
        output += " "
      }
      continue
    }

    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false
        output += "  "
        index += 1
      } else {
        output += char === "\n" || char === "\r" ? char : " "
      }
      continue
    }

    if (inString) {
      output += char
      if (escaped) {
        escaped = false
      } else if (char === "\\") {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      output += char
    } else if (char === "/" && next === "/") {
      lineComment = true
      output += "  "
      index += 1
    } else if (char === "/" && next === "*") {
      blockComment = true
      output += "  "
      index += 1
    } else {
      output += char
    }
  }

  return output.replace(/,\s*([}\]])/g, "$1")
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  let source: string
  try {
    source = await readFile(filePath, "utf8")
  } catch (error) {
    throw new CliError("FILE_READ_FAILED", `Unable to read ${filePath}.`, asError(error).message)
  }

  try {
    return JSON.parse(stripJsonComments(source)) as T
  } catch (error) {
    throw new CliError("INVALID_JSON", `Invalid JSON in ${filePath}.`, asError(error).message)
  }
}

export function stringifyJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

export async function findUp(
  start: string,
  names: string | readonly string[]
): Promise<string | undefined> {
  const candidates = typeof names === "string" ? [names] : names
  let directory = path.resolve(start)

  while (true) {
    for (const name of candidates) {
      const candidate = path.join(directory, name)
      if (await pathExists(candidate)) {
        return candidate
      }
    }
    const parent = path.dirname(directory)
    if (parent === directory) return undefined
    directory = parent
  }
}

export function normalizeRelativePath(input: string): string {
  invariant(input.length > 0, "UNSAFE_PATH", "Registry file path cannot be empty.")
  invariant(!input.includes("\0"), "UNSAFE_PATH", "Registry file path contains a null byte.")

  const portable = input.replaceAll("\\", "/")
  invariant(
    !path.posix.isAbsolute(portable) && !path.win32.isAbsolute(input),
    "UNSAFE_PATH",
    `Absolute registry path is not allowed: ${input}`
  )

  const segments = portable.split("/")
  invariant(
    !segments.some((segment) => segment === ".." || segment === ""),
    "UNSAFE_PATH",
    `Registry path traversal is not allowed: ${input}`
  )

  const normalized = path.posix.normalize(portable)
  invariant(normalized !== ".", "UNSAFE_PATH", `Invalid registry path: ${input}`)
  return normalized
}

export function isPathInside(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate)
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))
}

/**
 * Resolve a registry-owned path and reject any existing symlink in its ancestry.
 * Rejecting symlinks (instead of following "safe" ones) also closes TOCTOU writes.
 */
export async function resolveSafePath(root: string, relativePath: string): Promise<string> {
  const normalized = normalizeRelativePath(relativePath)
  const rootPath = path.resolve(root)
  const destination = path.resolve(rootPath, normalized)
  invariant(
    isPathInside(rootPath, destination),
    "UNSAFE_PATH",
    `Registry path escapes the project: ${relativePath}`
  )

  let rootRealPath: string
  try {
    rootRealPath = await realpath(rootPath)
  } catch {
    throw new CliError("INVALID_CWD", `Project directory does not exist: ${rootPath}`)
  }

  let cursor = rootPath
  for (const segment of normalized.split("/")) {
    cursor = path.join(cursor, segment)
    try {
      const entry = await lstat(cursor)
      invariant(
        !entry.isSymbolicLink(),
        "SYMLINK_ESCAPE",
        `Refusing to write through symlink: ${path.relative(rootPath, cursor)}`
      )
      const cursorRealPath = await realpath(cursor)
      invariant(
        isPathInside(rootRealPath, cursorRealPath),
        "SYMLINK_ESCAPE",
        `Registry path resolves outside the project: ${relativePath}`
      )
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException
      if (nodeError.code === "ENOENT") break
      throw error
    }
  }

  return destination
}

export async function readProjectFile(
  root: string,
  relativePath: string
): Promise<string | undefined> {
  const safePath = await resolveSafePath(root, relativePath)
  try {
    const entry = await stat(safePath)
    invariant(entry.isFile(), "INVALID_TARGET", `Expected a file: ${relativePath}`)
    return await readFile(safePath, "utf8")
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException
    if (nodeError.code === "ENOENT") return undefined
    throw error
  }
}

export async function currentFileHash(
  root: string,
  relativePath: string
): Promise<string | undefined> {
  const content = await readProjectFile(root, relativePath)
  return content === undefined ? undefined : hashContent(content)
}

/** Commit writes/removals as one recoverable filesystem transaction. */
export async function commitFileOperations(
  root: string,
  operations: readonly FileOperation[],
  dryRun: boolean
): Promise<void> {
  const seen = new Set<string>()
  for (const operation of operations) {
    operation.path = normalizeRelativePath(operation.path)
    invariant(
      !seen.has(operation.path),
      "DUPLICATE_TARGET",
      `Multiple operations target ${operation.path}.`
    )
    seen.add(operation.path)
    await resolveSafePath(root, operation.path)
    if (operation.kind === "write") {
      invariant(
        typeof operation.content === "string",
        "INVALID_OPERATION",
        `Write operation for ${operation.path} has no content.`
      )
    }
  }

  if (dryRun || operations.length === 0) return

  const transactionId = randomUUID()
  const transactionRelative = `.aq-ui/transactions/${transactionId}`
  const transactionRoot = await resolveSafePath(root, transactionRelative)
  const stagedRoot = path.join(transactionRoot, "staged")
  const backupRoot = path.join(transactionRoot, "backup")
  await mkdir(stagedRoot, { recursive: true })
  await mkdir(backupRoot, { recursive: true })

  const applied: Array<{ destination: string; backup: string; hadOriginal: boolean }> = []

  try {
    for (const [index, operation] of operations.entries()) {
      if (operation.kind !== "write") continue
      await writeFile(path.join(stagedRoot, String(index)), operation.content ?? "", {
        encoding: "utf8",
        flag: "wx",
      })
    }

    for (const [index, operation] of operations.entries()) {
      const destination = await resolveSafePath(root, operation.path)
      const backup = path.join(backupRoot, String(index))
      await mkdir(path.dirname(destination), { recursive: true })
      const hadOriginal = await pathExists(destination)
      if (hadOriginal) {
        const entry = await lstat(destination)
        invariant(
          entry.isFile(),
          "INVALID_TARGET",
          `Refusing to replace non-file ${operation.path}.`
        )
        await rename(destination, backup)
      }

      applied.push({ destination, backup, hadOriginal })
      if (operation.kind === "write") {
        await rename(path.join(stagedRoot, String(index)), destination)
      }
    }
  } catch (error) {
    for (const entry of applied.reverse()) {
      await rm(entry.destination, { force: true }).catch(() => undefined)
      if (entry.hadOriginal) {
        await mkdir(path.dirname(entry.destination), { recursive: true })
        await rename(entry.backup, entry.destination).catch(() => undefined)
      }
    }
    throw new CliError(
      "TRANSACTION_FAILED",
      "The file transaction was rolled back.",
      asError(error).message
    )
  } finally {
    await rm(transactionRoot, { force: true, recursive: true }).catch(() => undefined)
  }
}
