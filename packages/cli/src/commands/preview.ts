import { Effect, Option } from "effect";
import { Command, Flag } from "effect/unstable/cli";
import {
  configFlag,
  modeFlag,
  baseFlag,
  logLevelFlag,
  entryFlag,
} from "../shared/flags.js";
import { loadProjectConfig, resolve, resolveBoolean } from "../shared/loadConfig.js";
import { resolveViteInlineConfig } from "../shared/resolveViteConfig.js";
import { createVitePreview } from "../shared/viteHelpers.js";

export const preview = Command.make("preview", {
  host: Flag.optional(Flag.string("host")).pipe(
    Flag.withDescription("Specify hostname"),
  ),
  port: Flag.optional(Flag.integer("port")).pipe(
    Flag.withDescription("Specify port (default: 4173)"),
  ),
  strictPort: Flag.boolean("strictPort").pipe(
    Flag.withDefault(false),
    Flag.withDescription("Exit if port is in use"),
  ),
  open: Flag.boolean("open").pipe(
    Flag.withDefault(false),
    Flag.withDescription("Open browser on startup"),
  ),
  entry: entryFlag,
  config: configFlag,
  mode: modeFlag,
  base: baseFlag,
  logLevel: logLevelFlag,
}).pipe(
  Command.withDescription("Preview production build"),
  Command.withHandler((flags) =>
    Effect.gen(function* () {
      const projectRoot = process.cwd();
      const loaded = loadProjectConfig(projectRoot);
      const tc = loaded?.config;

      const inlineConfig = resolveViteInlineConfig({
        projectRoot,
        typedConfig: tc,
        explicitConfigFile: Option.getOrUndefined(flags.config ?? Option.none()),
        baseInlineConfig: {
          root: projectRoot,
          mode: Option.getOrUndefined(flags.mode ?? Option.none()),
          base: Option.getOrUndefined(flags.base ?? Option.none()),
          logLevel: Option.getOrUndefined(flags.logLevel ?? Option.none()),
          preview: {
            host: resolve(flags.host, tc?.preview?.host, undefined!),
            port: resolve(flags.port, tc?.preview?.port, undefined!),
            strictPort: resolveBoolean(flags.strictPort, tc?.preview?.strictPort, false),
            open: resolveBoolean(flags.open, tc?.preview?.open, false),
          },
        },
      });

      const server = yield* createVitePreview(inlineConfig);
      server.printUrls();
      yield* Effect.never;
    }),
  ),
);
