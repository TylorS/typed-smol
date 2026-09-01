import * as fs from "node:fs/promises";
import * as path from "node:path";

const websiteRoot = path.resolve(import.meta.dirname, "../..");
const source = path.join(websiteRoot, "public");
const destination = path.join(websiteRoot, "dist/client");

await fs.cp(source, destination, {
  recursive: true,
  filter: (pathname) => !isTransientGeneratedDirectory(path.basename(pathname)),
});

function isTransientGeneratedDirectory(name: string): boolean {
  return (
    name.startsWith(".docs-") ||
    name.startsWith(".schemas-") ||
    name.startsWith("docs.previous-") ||
    name.startsWith("schemas.previous-")
  );
}
