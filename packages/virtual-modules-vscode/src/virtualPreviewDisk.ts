import { isAbsolute, join, relative, resolve } from "node:path";
import { materializeVirtualFile, VIRTUAL_NODE_MODULES_RELATIVE } from "@typed/virtual-modules";

/** Base directory for virtual preview files: node_modules/.typed/virtual (not user-visible) */
export const VIRTUAL_PREVIEW_RELATIVE = VIRTUAL_NODE_MODULES_RELATIVE;

/**
 * Absolute path for a virtual preview file under projectRoot/node_modules/.typed/virtual/.
 * Uses the basename from virtualFileName (e.g. __virtual_router_abc123.ts) for uniqueness.
 */
export function getVirtualPreviewPath(projectRoot: string, virtualFileName: string): string {
  const virtualRoot = resolve(projectRoot, VIRTUAL_PREVIEW_RELATIVE);
  const resolvedVirtualFile = resolve(projectRoot, virtualFileName);
  if (isAbsolute(virtualFileName) && isPathInside(virtualRoot, resolvedVirtualFile)) {
    return resolvedVirtualFile;
  }

  const base = virtualFileName.replace(/^.*[/\\]/, ""); // basename
  const dir = join(projectRoot, VIRTUAL_PREVIEW_RELATIVE);
  return resolve(dir, base);
}

function isPathInside(baseDir: string, candidate: string): boolean {
  const relativePath = relative(baseDir, candidate);
  return relativePath === "" || (!relativePath.startsWith("..") && !isAbsolute(relativePath));
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
  const absPath = getVirtualPreviewPath(projectRoot, virtualFileName);
  materializeVirtualFile(absPath, importer, sourceText);
  return absPath;
}
