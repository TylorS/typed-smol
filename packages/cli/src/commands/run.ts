import { Effect } from "effect";
import { Argument, Command, Flag } from "effect/unstable/cli";
import { pathToFileURL } from "node:url";
import { configFlag, modeFlag } from "../shared/flags.js";
import { baseInlineConfig } from "../shared/resolveConfig.js";
import { runnerImport } from "vite";

export const run = Command.make("run", {
  file: Argument.path("file", { pathType: "file", mustExist: false }).pipe(
    Argument.withDescription("TypeScript file to execute"),
  ),
  config: configFlag,
  mode: modeFlag,
}).pipe(
  Command.withDescription("Run a TypeScript file with Vite transforms"),
  Command.withHandler((config) =>
    Effect.tryPromise({
      try: () => {
        const inlineConfig = baseInlineConfig(config, process.cwd());
        const fileUrl = pathToFileURL(config.file).href;
        return runnerImport(fileUrl, inlineConfig).then(() => {});
      },
      catch: (e) => (e instanceof Error ? e : new Error(String(e))),
    }),
  ),
);
