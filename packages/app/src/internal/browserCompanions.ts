import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

export interface BrowserCompanionResolution {
  readonly imports: readonly BrowserCompanionImport[];
}

export interface BrowserCompanionImport {
  readonly name: BrowserCompanionName;
  readonly binding: string;
  readonly importPath: `./${string}`;
}

export type BrowserCompanionName =
  | "layout"
  | "dependencies"
  | "browser"
  | "navigation"
  | "config"
  | "errors";

const BROWSER_COMPANIONS: readonly BrowserCompanionName[] = [
  "layout",
  "dependencies",
  "browser",
  "navigation",
  "config",
  "errors",
];

export function resolveBrowserCompanion(importer: string): BrowserCompanionResolution {
  const importerDir = dirname(importer);
  return {
    imports: BROWSER_COMPANIONS.flatMap((name) => {
      const candidate = join(importerDir, `.${name}.ts`);
      if (!existsSync(candidate)) return [];
      return [{ name, binding: toBinding(name), importPath: `./.${name}` as const }];
    }),
  };
}

function toBinding(name: BrowserCompanionName): string {
  return `Browser${name[0].toUpperCase()}${name.slice(1)}Companion`;
}
