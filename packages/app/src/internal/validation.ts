const DEFAULT_MAX_LENGTH = 4096;

export type ValidationOk<T> = { ok: true; value: T };
export type ValidationFail = { ok: false; reason: string };
export type ValidationResult<T> = ValidationOk<T> | ValidationFail;

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
