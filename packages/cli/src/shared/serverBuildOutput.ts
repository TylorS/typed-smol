import { basename, extname, isAbsolute, join, resolve } from "node:path";
import type { TypedConfig } from "./loadConfig.js";

const DEFAULT_OUT_DIR = "dist";
const SERVER_OUT = "server";

export interface ResolveBuiltServerEntryOptions {
  readonly projectRoot: string;
  readonly entry: string;
  readonly typedConfig?: TypedConfig;
}

export function resolveBuiltServerEntry(options: ResolveBuiltServerEntryOptions): string {
  const outDir = resolveOutputDir(
    options.projectRoot,
    options.typedConfig?.build?.outDir,
    DEFAULT_OUT_DIR,
  );
  const serverOutDir = resolveOutputDir(
    options.projectRoot,
    options.typedConfig?.build?.serverOutDir,
    join(outDir, SERVER_OUT),
  );
  const entryName = basename(options.entry, extname(options.entry));

  return join(serverOutDir, `${entryName}.js`);
}

function resolveOutputDir(
  projectRoot: string,
  configured: string | undefined,
  fallback: string,
): string {
  const value = configured ?? fallback;
  return isAbsolute(value) ? value : resolve(projectRoot, value);
}
