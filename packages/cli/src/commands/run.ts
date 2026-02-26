import { Effect, Option } from "effect";
import { Argument, Command } from "effect/unstable/cli";
import { pathToFileURL } from "node:url";
import { configFlag, modeFlag } from "../shared/flags.js";
import { loadProjectConfig } from "../shared/loadConfig.js";
import { resolveViteInlineConfig } from "../shared/resolveViteConfig.js";
import { runnerImport } from "vite";

export const run = Command.make("run", {
  file: Argument.path("file", { pathType: "file", mustExist: false }).pipe(
    Argument.withDescription("TypeScript file to execute"),
  ),
  config: configFlag,
  mode: modeFlag,
}).pipe(
  Command.withDescription("Run a TypeScript file with Vite transforms"),
  Command.withHandler((flags) =>
    Effect.tryPromise({
      try: () => {
        const projectRoot = process.cwd();
        const loaded = loadProjectConfig(projectRoot);

        const inlineConfig = resolveViteInlineConfig({
          projectRoot,
          typedConfig: loaded?.config,
          explicitConfigFile: Option.getOrUndefined(flags.config ?? Option.none()),
          baseInlineConfig: {
            root: projectRoot,
            mode: Option.getOrUndefined(flags.mode ?? Option.none()),
          },
        });

        const fileUrl = pathToFileURL(flags.file).href;
        return runnerImport(fileUrl, inlineConfig).then(() => {});
      },
      catch: (e) => (e instanceof Error ? e : new Error(String(e))),
    }),
  ),
);
