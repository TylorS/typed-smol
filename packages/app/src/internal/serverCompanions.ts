import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

export interface ServerCompanionResolution {
  readonly importPath: "./_server" | undefined;
}

export function resolveServerCompanion(importer: string): ServerCompanionResolution {
  const candidate = join(dirname(importer), "_server.ts");
  return { importPath: existsSync(candidate) ? "./_server" : undefined };
}
