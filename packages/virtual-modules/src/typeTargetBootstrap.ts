import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type * as ts from "typescript";
import { createTypeTargetBootstrapContent } from "./TypeInfoApi.js";
import type { TypeTargetSpec } from "./types.js";

/** Canonical relative path for the type-target bootstrap file under project root. */
export const TYPE_TARGET_BOOTSTRAP_RELATIVE = ".typed/type-target-bootstrap.ts";

/**
 * Returns the canonical path for the type-target bootstrap file.
 * All consumers (TS plugin, VSCode resolver, VMC) should use this path.
 */
export function getTypeTargetBootstrapPath(projectRoot: string): string {
  return join(projectRoot, ".typed", "type-target-bootstrap.ts");
}

export interface EnsureTypeTargetBootstrapFileFs {
  mkdirSync(path: string, options?: { recursive?: boolean }): void;
  writeFile(path: string, content: string): void;
}

const defaultFs: EnsureTypeTargetBootstrapFileFs = {
  mkdirSync(path: string, options?: { recursive?: boolean }) {
    mkdirSync(path, options);
  },
  writeFile(path: string, content: string) {
    writeFileSync(path, content, "utf8");
  },
};

/**
 * Ensures the type-target bootstrap file exists on disk. Creates .typed dir if needed,
 * writes createTypeTargetBootstrapContent(typeTargetSpecs) to the canonical path.
 * Returns the bootstrap path. Use default Node fs unless passing custom fs (e.g. ts.sys for VMC).
 */
export function ensureTypeTargetBootstrapFile(
  projectRoot: string,
  typeTargetSpecs: readonly TypeTargetSpec[],
  fs: EnsureTypeTargetBootstrapFileFs = defaultFs,
): string {
  const bootstrapPath = getTypeTargetBootstrapPath(projectRoot);
  if (typeTargetSpecs.length === 0) return bootstrapPath;
  const dir = dirname(bootstrapPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFile(bootstrapPath, createTypeTargetBootstrapContent(typeTargetSpecs));
  return bootstrapPath;
}

/**
 * Returns a program that includes the type-target bootstrap file in rootNames when
 * typeTargetSpecs is non-empty, so resolveTypeTargetsFromSpecs can find types.
 * If typeTargetSpecs is empty or the program already includes the bootstrap, returns program unchanged.
 */
export function getProgramWithTypeTargetBootstrap(
  tsMod: typeof import("typescript"),
  program: ts.Program,
  projectRoot: string,
  typeTargetSpecs: readonly TypeTargetSpec[] | undefined,
): ts.Program {
  if (!typeTargetSpecs?.length) return program;
  const bootstrapPath = ensureTypeTargetBootstrapFile(projectRoot, typeTargetSpecs);
  const rootNames = program.getRootFileNames();
  const canonicalBootstrap = resolve(bootstrapPath);
  const alreadyHasBootstrap = rootNames.some((p) => resolve(p) === canonicalBootstrap);
  if (alreadyHasBootstrap) return program;
  const opts = program.getCompilerOptions();
  const host = tsMod.createCompilerHost(opts, true);
  return tsMod.createProgram([...rootNames, bootstrapPath], opts, host);
}
