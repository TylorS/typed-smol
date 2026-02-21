/**
 * Sanitizes error messages for structured diagnostics: strips stack traces and
 * redacts absolute paths to avoid leaking filesystem layout.
 */
export function sanitizeErrorMessage(message: string): string {
  const withoutStack = message
    .split(/\r?\n/)
    .filter((line) => !/^\s*at\s+/.test(line.trim()))
    .join("\n")
    .trim();

  const unixPath = /\/[\w./-]+\/[\w./-]+(?:\/[\w./-]*)*/g;
  const winPath = /[A-Za-z]:[\\/][\w.-]+(?:[\\/][\w.-]+)*/g;
  let out = withoutStack
    .replace(unixPath, "[path]")
    .replace(winPath, "[path]");
  return out.replace(/\s{2,}/g, " ").trim();
}
