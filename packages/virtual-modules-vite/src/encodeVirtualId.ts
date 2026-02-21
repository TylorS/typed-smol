const PREFIX = "\0virtual:";

function toBase64Url(s: string): string {
  return Buffer.from(s, "utf8").toString("base64url");
}

function fromBase64Url(s: string): string {
  return Buffer.from(s, "base64url").toString("utf8");
}

/**
 * Encode (id, importer) into a single string for Vite's resolveId return value.
 * Uses base64url so path characters (e.g. `:`, `\`) don't break parsing.
 */
export function encodeVirtualId(id: string, importer: string): string {
  return `${PREFIX}${toBase64Url(id)}:${toBase64Url(importer)}`;
}

/**
 * Parse a virtual id produced by encodeVirtualId. Returns null if not a virtual id.
 */
export function decodeVirtualId(resolvedId: string): { id: string; importer: string } | null {
  if (!resolvedId.startsWith(PREFIX)) {
    return null;
  }
  const rest = resolvedId.slice(PREFIX.length);
  const colonIndex = rest.indexOf(":");
  if (colonIndex === -1) {
    return null;
  }
  const encodedId = rest.slice(0, colonIndex);
  const encodedImporter = rest.slice(colonIndex + 1);
  try {
    return {
      id: fromBase64Url(encodedId),
      importer: fromBase64Url(encodedImporter),
    };
  } catch {
    return null;
  }
}

export function isVirtualId(resolvedId: string): boolean {
  return resolvedId.startsWith(PREFIX);
}
