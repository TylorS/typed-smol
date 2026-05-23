import { Effect } from "effect";
import { Command, Flag } from "effect/unstable/cli";
import { loadProjectConfig } from "../shared/loadConfig.js";
import { runVirtualModuleCompiler } from "../shared/vmc.js";
import { runLint } from "./lint.js";
import { runFormat } from "./format.js";

export const check = Command.make("check", {
  skipTypes: Flag.boolean("skip-types").pipe(
    Flag.withDefault(false),
    Flag.withDescription("Skip virtual-module and TypeScript checks"),
  ),
  skipLint: Flag.boolean("skip-lint").pipe(
    Flag.withDefault(false),
    Flag.withDescription("Skip lint checks"),
  ),
  skipFormat: Flag.boolean("skip-format").pipe(
    Flag.withDefault(false),
    Flag.withDescription("Skip format checks"),
  ),
}).pipe(
  Command.withDescription("Check type, lint, and format contracts"),
  Command.withHandler((flags) =>
    Effect.gen(function* () {
      const projectRoot = process.cwd();
      const loaded = loadProjectConfig(projectRoot);
      let exitCode = 0;

      if (!flags.skipTypes) {
        exitCode = maxExitCode(
          exitCode,
          runVirtualModuleCompiler({
            projectRoot,
            typedConfig: loaded?.config,
            noEmit: true,
          }),
        );
      }

      if (!flags.skipLint) {
        try {
          exitCode = maxExitCode(exitCode, runLint({ projectRoot }));
        } catch (err: unknown) {
          return yield* Effect.fail(err instanceof Error ? err : new Error(String(err)));
        }
      }

      if (!flags.skipFormat) {
        try {
          exitCode = maxExitCode(exitCode, runFormat({ projectRoot, check: true }));
        } catch (err: unknown) {
          return yield* Effect.fail(err instanceof Error ? err : new Error(String(err)));
        }
      }

      process.exitCode = exitCode;
    }),
  ),
);

function maxExitCode(left: number, right: number): number {
  return left === 0 ? right : left;
}
