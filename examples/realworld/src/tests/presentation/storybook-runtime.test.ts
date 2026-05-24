import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createStorybookVirtualModulePlugin } from "@typed/app/StorybookVirtualModulePlugin";
import { describe, expect, it } from "vitest";

const testDir = dirname(fileURLToPath(import.meta.url));
const srcRoot = resolve(testDir, "../..");

describe("realworld storybook runtime", () => {
  it("keeps stories on generated runtime defaults", () => {
    const homeStorySource = readSource("Home.stories.ts");
    const shellStorySource = readSource("Shell.stories.ts");

    expect(homeStorySource).toContain('from "typed:storybook/runtime?path=/"');
    expect(shellStorySource).toContain('from "typed:storybook/runtime?path=/"');
    expect(homeStorySource).not.toContain("routes=./src/routes");
    expect(shellStorySource).not.toContain("routes=./src/routes");
  });

  it("generates Storybook runtime source from RealWorld defaults", () => {
    const generatedRuntimeSource = generatedSource(
      createStorybookVirtualModulePlugin({
        runtimeDefaults: {
          api: ["./src/api"],
          baseDir: resolve(srcRoot, ".."),
          proxyPath: "/__typed_storybook_api",
          routes: ["./src/routes"],
        },
      }).build("typed:storybook/runtime?path=/", resolve(srcRoot, "Home.stories.ts"), {} as never),
    );

    expect(generatedRuntimeSource).toContain('import Routes0 from "typed:router?dir=./routes";');
    expect(generatedRuntimeSource).toContain("apiBaseUrl");
    expect(generatedRuntimeSource).toContain("makeStoryRuntime");
  });
});

function readSource(path: string): string {
  return readFileSync(resolve(srcRoot, path), "utf8");
}

function generatedSource(result: unknown): string {
  if (typeof result === "string") return result;
  if (result && typeof result === "object" && "sourceText" in result) {
    const sourceText = result.sourceText;
    if (typeof sourceText === "string") return sourceText;
  }
  throw new Error(JSON.stringify(result));
}
