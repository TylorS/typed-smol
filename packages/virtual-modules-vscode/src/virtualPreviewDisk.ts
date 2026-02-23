import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const toPosix = (p: string) => p.replaceAll("\\", "/");

/** Base directory for virtual preview files: node_modules/.typed/virtual (not user-visible) */
export const VIRTUAL_PREVIEW_RELATIVE = "node_modules/.typed/virtual";

/**
 * Absolute path for a virtual preview file under projectRoot/node_modules/.typed/virtual/.
 * Uses the basename from virtualFileName (e.g. __virtual_router_abc123.ts) for uniqueness.
 */
export function getVirtualPreviewPath(
  projectRoot: string,
  virtualFileName: string,
): string {
  const base = virtualFileName.replace(/^.*[/\\]/, ""); // basename
  const dir = join(projectRoot, VIRTUAL_PREVIEW_RELATIVE);
  return resolve(dir, base);
}

/**
 * Rewrite relative import specifiers in sourceText so they resolve correctly when
 * the file is placed in node_modules/.typed/virtual/ instead of importerDir.
 */
function rewriteImportsForPreviewLocation(
  sourceText: string,
  importerDir: string,
  previewDir: string,
): string {
  return sourceText.replace(
    /from\s+['"](\.\.?\/[^'"]+)['"]/g,
    (match, spec: string) => {
      const absoluteTarget = resolve(importerDir, spec);
      const newRel = toPosix(relative(previewDir, absoluteTarget));
      const newSpec = newRel.startsWith(".") ? newRel : `./${newRel}`;
      const quote = match.includes('"') ? '"' : "'";
      return `from ${quote}${newSpec}${quote}`;
    },
  );
}

/**
 * Write virtual module content to node_modules/.typed/virtual/ and return the absolute file URI.
 * Rewrites relative imports so they resolve from the preview location.
 */
export function writeVirtualPreviewAndGetPath(
  projectRoot: string,
  importer: string,
  virtualFileName: string,
  sourceText: string,
): string {
  const importerDir = dirname(resolve(importer));
  const previewDir = resolve(projectRoot, VIRTUAL_PREVIEW_RELATIVE);
  const rewritten = rewriteImportsForPreviewLocation(
    sourceText,
    importerDir,
    previewDir,
  );
  const absPath = getVirtualPreviewPath(projectRoot, virtualFileName);
  mkdirSync(dirname(absPath), { recursive: true });
  writeFileSync(absPath, rewritten, "utf8");
  return absPath;
}
