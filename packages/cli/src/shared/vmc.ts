import { existsSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";
import { runVmcCli } from "@typed/virtual-modules-compiler";
import type { TypedConfig } from "./loadConfig.js";
import ts from "typescript";

export interface VirtualModuleCompilerOptions {
  readonly projectRoot: string;
  readonly typedConfig?: TypedConfig;
  readonly noEmit?: boolean;
  readonly tsconfig?: string;
}

export function createVmcArgs(options: VirtualModuleCompilerOptions): readonly string[] {
  const tsconfig = resolveTsconfig(options);
  const args: string[] = [];

  if (options.noEmit) args.push("--noEmit");
  if (tsconfig) args.push("-p", tsconfig);

  return args;
}

export function runVirtualModuleCompiler(options: VirtualModuleCompilerOptions): number {
  const previousCwd = process.cwd();

  try {
    if (previousCwd !== options.projectRoot) {
      process.chdir(options.projectRoot);
    }

    return (
      runVmcCli({
        args: createVmcArgs(options),
        commandName: "typed",
        ts,
      }) ?? 0
    );
  } finally {
    if (process.cwd() !== previousCwd) {
      process.chdir(previousCwd);
    }
  }
}

function resolveTsconfig(options: VirtualModuleCompilerOptions): string | undefined {
  const configured = options.tsconfig ?? options.typedConfig?.tsconfig;
  if (configured) return toProjectRelativePath(options.projectRoot, configured);

  const defaultPath = join(options.projectRoot, "tsconfig.json");
  return existsSync(defaultPath) ? "tsconfig.json" : undefined;
}

function toProjectRelativePath(projectRoot: string, path: string): string {
  if (!isAbsolute(path)) return path;
  return relative(projectRoot, path) || ".";
}
