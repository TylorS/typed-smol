import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface ScaffoldTypedWorkspaceOptions {
  readonly cwd: string;
  readonly name: string;
}

export function scaffoldTypedWorkspace(options: ScaffoldTypedWorkspaceOptions): string {
  const target = join(options.cwd, options.name);
  if (existsSync(target)) throw new Error(`Target already exists: ${target}`);
  const templateRoot = join(dirname(fileURLToPath(import.meta.url)), "../../templates/starter");
  cpSync(templateRoot, target, { recursive: true, filter: shouldCopyTemplatePath });
  replacePlaceholders(target, options.name);
  return target;
}

function shouldCopyTemplatePath(path: string): boolean {
  return !path.includes("node_modules") && !path.endsWith("pnpm-lock.yaml");
}

function replacePlaceholders(root: string, name: string): void {
  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      replacePlaceholders(path, name);
      continue;
    }
    if (!stat.isFile()) continue;
    const source = readFileSync(path, "utf8");
    const next = source.replaceAll("__APP_NAME__", name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, next, "utf8");
  }
}
