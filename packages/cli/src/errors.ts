export class CliError extends Error {
  readonly code: string
  readonly details?: unknown

  constructor(code: string, message: string, details?: unknown) {
    super(message)
    this.name = "CliError"
    this.code = code
    this.details = details
  }
}

export function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

export function invariant(
  condition: unknown,
  code: string,
  message: string,
  details?: unknown
): asserts condition {
  if (!condition) {
    throw new CliError(code, message, details)
  }
}
