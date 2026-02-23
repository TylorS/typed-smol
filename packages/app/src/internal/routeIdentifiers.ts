import { stripScriptExtension, toPosixPath } from "./path.js";

/**
 * Sanitize a path segment for use in a JS identifier: strip _ and brackets, keep only [a-zA-Z0-9], capitalize.
 * Empty after sanitization is skipped (returns "").
 */
function segmentToIdentifierPart(seg: string): string {
  let name = seg.trim().startsWith("_") ? seg.trim().slice(1) : seg.trim();
  name = name.replace(/[[\]]/g, "").replace(/[^a-zA-Z0-9]/g, "");
  if (!name) return "";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Path relative to baseDir → valid JS identifier.
 * Safe for special chars in filenames; never emits invalid identifiers.
 */
export function pathToIdentifier(relativeFilePath: string): string {
  const posix = toPosixPath(relativeFilePath);
  const withoutExt = stripScriptExtension(posix);
  const raw =
    withoutExt.split("/").filter(Boolean).map(segmentToIdentifierPart).filter(Boolean).join("") ||
    "Module";
  const safe = raw.replace(/[^a-zA-Z0-9_$]/g, "");
  if (!safe) return "Module";
  if (/^\d/.test(safe)) return `M${safe}`;
  return safe;
}

/** Final guard: ensure a string is a valid JS identifier (no spaces, brackets, or leading digit). */
function toSafeIdentifier(s: string): string {
  const cleaned = s.replace(/[\s[\]]/g, "").replace(/[^a-zA-Z0-9_$]/g, "");
  if (!cleaned) return "Module";
  if (/^\d/.test(cleaned)) return `M${cleaned}`;
  return cleaned;
}

const RESERVED_NAMES = new Set(["Router", "Fx", "Effect", "Stream"]);

/**
 * Route module identifier: prefix with M to avoid clashing with Router/Fx/Effect/Stream.
 */
export function routeModuleIdentifier(relativeFilePath: string): string {
  const base = pathToIdentifier(relativeFilePath);
  return RESERVED_NAMES.has(base) ? `M${base}` : base;
}

/** True if the path has a dynamic segment (bracket). */
function pathHasParamSegment(relativePath: string): boolean {
  return /\[[^\]]*\]/.test(relativePath);
}

/**
 * Assign unique var names when proposed names collide (e.g. users/[id].ts and users/id.ts both → UsersId).
 * First occurrence keeps the base name; others get base + "Param" (if path has [x]), "Literal", or numeric suffix.
 */
export function makeUniqueVarNames(
  entries: readonly { path: string; proposedName: string }[],
): Map<string, string> {
  const sorted = [...entries].sort((a, b) => a.path.localeCompare(b.path));
  const nameToPaths = new Map<string, string[]>();
  for (const { path, proposedName } of sorted) {
    const base = toSafeIdentifier(proposedName);
    const list = nameToPaths.get(base) ?? [];
    list.push(path);
    nameToPaths.set(base, list);
  }
  const pathToUnique = new Map<string, string>();
  const used = new Set<string>();
  for (const [base, paths] of nameToPaths) {
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i]!;
      let name: string;
      if (paths.length === 1) {
        name = base;
      } else if (i === 0) {
        name = base;
      } else {
        const suffix = pathHasParamSegment(path) ? "Param" : "Literal";
        let candidate = base + suffix;
        let n = 0;
        while (used.has(candidate)) {
          n += 1;
          candidate = base + String(n);
        }
        name = candidate;
      }
      used.add(name);
      pathToUnique.set(path, name);
    }
  }
  return pathToUnique;
}
