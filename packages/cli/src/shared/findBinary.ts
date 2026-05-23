import { existsSync } from "node:fs";
import { dirname, join, parse } from "node:path";

export function findBinary(name: string, projectRoot: string): string | undefined {
  let current = projectRoot;
  const root = parse(projectRoot).root;

  while (true) {
    const localBin = join(current, "node_modules", ".bin", name);
    if (existsSync(localBin)) return localBin;
    if (current === root) return undefined;
    current = dirname(current);
  }
}
