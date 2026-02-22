import { realpathSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";

export const toPosixPath = (path: string): string => path.replaceAll("\\", "/");

export const resolveRelativePath = (baseDir: string, relativePath: string): string =>
  toPosixPath(resolve(baseDir, relativePath));

/**
 * Resolves relativePath against baseDir and ensures the result stays under baseDir.
 */
export function resolvePathUnderBase(
  baseDir: string,
  relativePath: string,
): { ok: true; path: string } | { ok: false; error: "path-escapes-base" } {
  const baseAbs = resolve(baseDir);
  const resolved = resolve(baseDir, relativePath);
  const rel = relative(baseAbs, resolved);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    return { ok: false, error: "path-escapes-base" };
  }
  return { ok: true, path: toPosixPath(resolved) };
}

export function pathIsUnderBase(baseDir: string, absolutePath: string): boolean {
  let baseAbs: string;
  let resolvedAbs: string;
  try {
    baseAbs = realpathSync(resolve(baseDir));
    resolvedAbs = realpathSync(resolve(absolutePath));
  } catch {
    baseAbs = resolve(baseDir);
    resolvedAbs = resolve(absolutePath);
  }
  const rel = relative(baseAbs, resolvedAbs);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    return false;
  }
  return true;
}
