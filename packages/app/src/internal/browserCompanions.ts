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
      const companion = resolveCompanion(importerDir, name);
      return companion === undefined
        ? []
        : [{ name, binding: toBinding(name), importPath: companion }];
    }),
  };
}

function resolveCompanion(
  importerDir: string,
  name: BrowserCompanionName,
): `./${string}` | undefined {
  const candidate = name === "dependencies" ? ".browser.dependencies" : `.${name}`;
  return existsSync(join(importerDir, `${candidate}.ts`)) ? `./${candidate}.js` : undefined;
}

function toBinding(name: BrowserCompanionName): string {
  return `Browser${name[0].toUpperCase()}${name.slice(1)}Companion`;
}
