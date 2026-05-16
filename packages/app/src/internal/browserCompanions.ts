import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

export interface BrowserCompanionResolution {
  readonly importPath: "./_browser" | undefined;
}

export function resolveBrowserCompanion(importer: string): BrowserCompanionResolution {
  const candidate = join(dirname(importer), "_browser.ts");
  return { importPath: existsSync(candidate) ? "./_browser" : undefined };
}
