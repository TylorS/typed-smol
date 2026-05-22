import { describe, expect, it } from "vitest";
import { resolveBuiltServerEntry } from "./serverBuildOutput.js";

describe("resolveBuiltServerEntry", () => {
  it("resolves the default server build artifact beside the client build", () => {
    expect(
      resolveBuiltServerEntry({
        projectRoot: "/app",
        entry: "/app/src/server.ts",
      }),
    ).toBe("/app/dist/server/server.js");
  });

  it("resolves configured relative server output directories from the project root", () => {
    expect(
      resolveBuiltServerEntry({
        projectRoot: "/app",
        entry: "/app/src/entry.server.ts",
        typedConfig: {
          build: {
            outDir: "build",
            serverOutDir: "build/node",
          },
        },
      }),
    ).toBe("/app/build/node/entry.server.js");
  });

  it("keeps absolute server output directories absolute", () => {
    expect(
      resolveBuiltServerEntry({
        projectRoot: "/app",
        entry: "/app/server.ts",
        typedConfig: {
          build: {
            serverOutDir: "/tmp/typed-server",
          },
        },
      }),
    ).toBe("/tmp/typed-server/server.js");
  });
});
