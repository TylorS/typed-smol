import { join, resolve } from "node:path";

export interface InferStaticAssetRootOptions {
  readonly projectRoot: string;
  readonly buildOutDir?: string;
  readonly clientOutDir?: string;
}

export function inferStaticAssetRoot(options: InferStaticAssetRootOptions): string {
  if (options.clientOutDir) return join(resolve(options.projectRoot), options.clientOutDir);
  return join(resolve(options.projectRoot), options.buildOutDir ?? "dist", "client");
}
