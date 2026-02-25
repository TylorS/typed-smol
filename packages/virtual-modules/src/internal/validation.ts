/**
 * Pure validators for plugin and TypeInfoApi boundaries. No I/O.
 */

const DEFAULT_MAX_LENGTH = 4096;

export type ValidationOk<T> = { ok: true; value: T };
export type ValidationFail = { ok: false; reason: string };
export type ValidationResult<T> = ValidationOk<T> | ValidationFail;

/**
 * Validates a non-empty string (trimmed). Rejects null bytes.
 */
export function validateNonEmptyString(
  value: unknown,
  name: string,
  maxLength: number = DEFAULT_MAX_LENGTH,
): ValidationResult<string> {
  if (typeof value !== "string") {
    return { ok: false, reason: `${name} must be a string` };
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    return { ok: false, reason: `${name} must be non-empty` };
  }
  if (value.includes("\0")) {
    return { ok: false, reason: `${name} must not contain null bytes` };
  }
  if (value.length > maxLength) {
    return { ok: false, reason: `${name} exceeds max length ${maxLength}` };
  }
  return { ok: true, value: trimmed };
}

/**
 * Validates a path-like segment: string, non-empty, no null byte, optional max length.
 * Does not trim so path semantics are preserved.
 */
export function validatePathSegment(
  value: unknown,
  name: string,
  maxLength: number = DEFAULT_MAX_LENGTH,
): ValidationResult<string> {
  if (typeof value !== "string") {
    return { ok: false, reason: `${name} must be a string` };
  }
  if (value.length === 0 || value.trim() === "") {
    return { ok: false, reason: `${name} must be non-empty` };
  }
  if (value.includes("\0")) {
    return { ok: false, reason: `${name} must not contain null bytes` };
  }
  if (value.length > maxLength) {
    return { ok: false, reason: `${name} exceeds max length ${maxLength}` };
  }
  return { ok: true, value };
}

/**
 * Validates relativeGlobs: array or single string; each element non-empty, no null byte,
 * no parent-segment (..) or absolute paths, optional max length.
 * Rejects patterns that could escape the intended base directory.
 */
export function validateRelativeGlobs(
  value: unknown,
  name: string,
  maxLength: number = DEFAULT_MAX_LENGTH,
): ValidationResult<string[]> {
  const arr = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
  const result: string[] = [];
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    const r = validatePathSegment(v, `${name}[${i}]`, maxLength);
    if (!r.ok) return r;
    const normalized = (r.value as string).replaceAll("\\", "/");
    if (normalized.includes("..")) {
      return { ok: false, reason: `${name}[${i}] must not contain parent path segments (..)` };
    }
    if (normalized.startsWith("/") || /^[A-Za-z]:/.test(normalized)) {
      return { ok: false, reason: `${name}[${i}] must be a relative glob, not absolute` };
    }
    result.push(r.value);
  }
  return { ok: true, value: result };
}
