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
      const candidate = join(importerDir, `.${name}.ts`);
      if (!existsSync(candidate)) return [];
      return [{ name, binding: toBinding(name), importPath: `./.${name}` as const }];
    }),
  };
}

function toBinding(name: ServerCompanionName): string {
  return `Server${name[0].toUpperCase()}${name.slice(1)}Companion`;
}
