import { describe, expect, it } from "vitest";
import ts from "typescript";
import type { VirtualModuleResolver } from "@typed/virtual-modules";
import type { VmcCompilerExtension } from "./extensions.js";
import { runVmcCli } from "./runVmcCli.js";

const resolver = {} as VirtualModuleResolver;

describe("runVmcCli", () => {
  it("forwards extensions to single compile mode", () => {
    const extension = extensionNamed("typed");
    const compileCalls: unknown[] = [];

    const exitCode = runVmcCli({
      args: ["src/main.ts", "--noEmit"],
      compile: (params) => {
        compileCalls.push(params.extensions);
        return 0;
      },
      extensions: [extension],
      loadResolver: () => ({ resolver }),
      sys: testSys(),
      ts,
    });

    expect(exitCode).toBe(0);
    expect(compileCalls).toEqual([[extension]]);
  });

  it("forwards extensions to build mode", () => {
    const extension = extensionNamed("typed");
    const buildCalls: unknown[] = [];

    const exitCode = runVmcCli({
      args: ["--build", "tsconfig.json"],
      extensions: [extension],
      loadResolver: () => ({ resolver }),
      runBuild: (params) => {
        buildCalls.push(params.extensions);
        return 0;
      },
      sys: testSys(),
      ts,
    });

    expect(exitCode).toBe(0);
    expect(buildCalls).toEqual([[extension]]);
  });

  it("forwards extensions to watch mode", () => {
    const extension = extensionNamed("typed");
    const watchCalls: unknown[] = [];

    const exitCode = runVmcCli({
      args: ["--watch", "src/main.ts", "--noEmit"],
      extensions: [extension],
      loadResolver: () => ({ resolver }),
      runWatch: (params) => {
        watchCalls.push(params.extensions);
      },
      sys: testSys(),
      ts,
    });

    expect(exitCode).toBeUndefined();
    expect(watchCalls).toEqual([[extension]]);
  });
});

function extensionNamed(name: string): VmcCompilerExtension {
  return { name };
}

function testSys(): ts.System {
  return {
    ...ts.sys,
    getCurrentDirectory: () => "/project",
    write: () => {},
  };
}
