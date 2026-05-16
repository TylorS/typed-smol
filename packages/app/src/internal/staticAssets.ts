import { join, resolve } from "node:path";

export interface InferStaticAssetRootOptions {
  readonly projectRoot: string;
  readonly buildOutDir?: string;
}

export function inferStaticAssetRoot(options: InferStaticAssetRootOptions): string {
  return join(resolve(options.projectRoot), options.buildOutDir ?? "dist", "client");
}
