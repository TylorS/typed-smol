import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import {
  rewriteSourceForPreviewLocation,
  VIRTUAL_NODE_MODULES_RELATIVE,
} from "@typed/virtual-modules";

/** Base directory for virtual preview files: node_modules/.typed/virtual (not user-visible) */
export const VIRTUAL_PREVIEW_RELATIVE = VIRTUAL_NODE_MODULES_RELATIVE;

export interface VirtualPreviewResolverResult {
  readonly virtualFileName: string;
  readonly sourceText: string;
}

export type VirtualPreviewResolver = (moduleId: string) => VirtualPreviewResolverResult | undefined;

/**
 * Absolute path for a virtual preview file under projectRoot/node_modules/.typed/virtual/.
 */
export function getVirtualPreviewPath(projectRoot: string, virtualFileName: string): string {
  const virtualRoot = resolve(projectRoot, VIRTUAL_PREVIEW_RELATIVE);
  const resolvedVirtualFile = resolve(projectRoot, virtualFileName);
  if (isAbsolute(virtualFileName) && isPathInside(virtualRoot, resolvedVirtualFile)) {
    return resolvedVirtualFile;
  }
  if (isAbsolute(virtualFileName)) {
    throw new Error(`Virtual preview path is outside the virtual preview root: ${virtualFileName}`);
  }

  const previewPath = resolve(virtualRoot, virtualFileName);
  if (!isPathInside(virtualRoot, previewPath)) {
    throw new Error(`Virtual preview path is outside the virtual preview root: ${virtualFileName}`);
  }
  return previewPath;
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
  resolveNestedVirtualModule?: VirtualPreviewResolver,
): string {
  const absPath = getVirtualPreviewPath(projectRoot, virtualFileName);
  const rewritten = getVirtualPreviewSource(
    projectRoot,
    importer,
    virtualFileName,
    sourceText,
    resolveNestedVirtualModule,
  );
  mkdirSync(dirname(absPath), { recursive: true });
  writeFileSync(absPath, rewritten, "utf8");
  return absPath;
}

export function getVirtualPreviewSource(
  projectRoot: string,
  importer: string,
  virtualFileName: string,
  sourceText: string,
  resolveNestedVirtualModule?: VirtualPreviewResolver,
  visitedVirtualFiles: ReadonlySet<string> = new Set(),
): string {
  const previewPath = getVirtualPreviewPath(projectRoot, virtualFileName);
  const nextVisited = new Set(visitedVirtualFiles);
  nextVisited.add(previewPath);

  return rewriteSourceForPreviewLocation(sourceText, importer, previewPath, (moduleId) => {
    const nested = resolveNestedVirtualModule?.(moduleId);
    if (!nested) return undefined;
    const nestedPreviewPath = writeNestedVirtualPreview(
      projectRoot,
      importer,
      nested,
      resolveNestedVirtualModule,
      nextVisited,
    );
    if (!nestedPreviewPath) return undefined;
    return toRelativeSpecifier(previewPath, nestedPreviewPath);
  });
}

function writeNestedVirtualPreview(
  projectRoot: string,
  importer: string,
  nested: VirtualPreviewResolverResult,
  resolveNestedVirtualModule: VirtualPreviewResolver | undefined,
  visitedVirtualFiles: ReadonlySet<string>,
): string | undefined {
  const nestedPreviewPath = getVirtualPreviewPath(projectRoot, nested.virtualFileName);
  if (visitedVirtualFiles.has(nestedPreviewPath)) return nestedPreviewPath;
  const nextVisited = new Set(visitedVirtualFiles);
  nextVisited.add(nestedPreviewPath);
  const sourceText = getVirtualPreviewSource(
    projectRoot,
    importer,
    nested.virtualFileName,
    nested.sourceText,
    resolveNestedVirtualModule,
    nextVisited,
  );
  mkdirSync(dirname(nestedPreviewPath), { recursive: true });
  writeFileSync(nestedPreviewPath, sourceText, "utf8");
  return nestedPreviewPath;
}

function toRelativeSpecifier(fromFile: string, toFile: string): string {
  const relativePath = relative(dirname(fromFile), toFile)
    .split(/[/\\]+/)
    .join("/");
  const withJavaScriptExtension = relativePath.replace(/\.[cm]?tsx?$/, ".js");
  return withJavaScriptExtension.startsWith(".")
    ? withJavaScriptExtension
    : `./${withJavaScriptExtension}`;
}
