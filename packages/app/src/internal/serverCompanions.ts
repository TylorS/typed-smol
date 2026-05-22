import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

export interface ServerCompanionResolution {
  readonly imports: readonly ServerCompanionImport[];
}

export interface ServerCompanionImport {
  readonly name: ServerCompanionName;
  readonly binding: string;
  readonly importPath: `./${string}`;
}

export type ServerCompanionName =
  | "layout"
  | "dependencies"
  | "middleware"
  | "html"
  | "server"
  | "config"
  | "errors";

const SERVER_COMPANIONS: readonly ServerCompanionName[] = [
  "layout",
  "dependencies",
  "middleware",
  "html",
  "server",
  "config",
  "errors",
];

export function resolveServerCompanion(importer: string): ServerCompanionResolution {
  const importerDir = dirname(importer);
  return {
    imports: SERVER_COMPANIONS.flatMap((name) => {
      const companion = resolveCompanion(importerDir, name);
      return companion === undefined
        ? []
        : [{ name, binding: toBinding(name), importPath: companion }];
    }),
  };
}

function resolveCompanion(
  importerDir: string,
  name: ServerCompanionName,
): `./${string}` | undefined {
  const candidates =
    name === "dependencies"
      ? [".server.dependencies", ".dependencies"]
      : [`.${name}`];
  const found = candidates.find((candidate) => existsSync(join(importerDir, `${candidate}.ts`)));
  return found === undefined ? undefined : `./${found}.js`;
}

function toBinding(name: ServerCompanionName): string {
  return `Server${name[0].toUpperCase()}${name.slice(1)}Companion`;
}
