import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { toPosixPath } from "./path.js";

/**
 * Rewrite relative import specifiers in sourceText so they resolve correctly when
 * the file is placed in previewDir instead of importerDir.
 */
export function rewriteSourceForPreviewLocation(
  sourceText: string,
  importer: string,
  virtualFilePath: string,
): string {
  const importerDir = dirname(resolve(importer));
  const previewDir = dirname(resolve(virtualFilePath));
  return sourceText.replace(/from\s+['"](\.\.?\/[^'"]+)['"]/g, (match, spec: string) => {
    const absoluteTarget = resolve(importerDir, spec);
    const newRel = toPosixPath(relative(previewDir, absoluteTarget));
    const newSpec = newRel.startsWith(".") ? newRel : `./${newRel}`;
    const quote = match.includes('"') ? '"' : "'";
    return `from ${quote}${newSpec}${quote}`;
  });
}

/**
 * Materialize virtual module content to disk at virtualFilePath. Rewrites relative
 * imports so they resolve from the virtual file's location. Used so go-to-definition
 * can open the file (path must exist on disk).
 */
export function materializeVirtualFile(
  virtualFilePath: string,
  importer: string,
  sourceText: string,
): void {
  const rewritten = rewriteSourceForPreviewLocation(sourceText, importer, virtualFilePath);
  mkdirSync(dirname(resolve(virtualFilePath)), { recursive: true });
  writeFileSync(virtualFilePath, rewritten, "utf8");
}
