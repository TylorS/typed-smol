import { spawn } from "node:child_process";
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(scriptDir, "..");
const packageJsonPath = path.join(packageDir, "package.json");

const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
const extensionName = packageJson.name.includes("/")
  ? packageJson.name.split("/").at(-1)
  : packageJson.name;
const outPath = path.join(packageDir, "dist", `${extensionName}-${packageJson.version}.vsix`);
const baseContentUrl =
  "https://github.com/TylorS/typed-smol/blob/main/packages/virtual-modules-vscode";
const baseImagesUrl =
  "https://github.com/TylorS/typed-smol/raw/main/packages/virtual-modules-vscode";

const tempDir = await mkdtemp(path.join(tmpdir(), "typed-vscode-vsix-"));

const run = (command, args, cwd) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "null"}`));
    });

    child.on("error", reject);
  });

try {
  await mkdir(path.join(packageDir, "dist"), { recursive: true });
  await rm(outPath, { force: true });

  const packageForVsix = {
    ...packageJson,
    name: extensionName,
    dependencies: {},
    devDependencies: {},
  };

  await writeFile(
    path.join(tempDir, "package.json"),
    `${JSON.stringify(packageForVsix, null, 2)}\n`,
    "utf8",
  );

  for (const entry of ["dist", "src", "README.md"]) {
    await cp(path.join(packageDir, entry), path.join(tempDir, entry), { recursive: true });
  }

  await run(
    "pnpm",
    [
      "exec",
      "vsce",
      "package",
      "--no-dependencies",
      "--baseContentUrl",
      baseContentUrl,
      "--baseImagesUrl",
      baseImagesUrl,
      "--out",
      outPath,
    ],
    tempDir,
  );
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
