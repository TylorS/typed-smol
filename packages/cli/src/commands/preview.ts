import { Effect } from "effect";
import { Command, Flag } from "effect/unstable/cli";
import {
  configFlag,
  modeFlag,
  baseFlag,
  logLevelFlag,
  entryFlag,
} from "../shared/flags.js";
import { previewInlineConfig } from "../shared/resolveConfig.js";
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
  Command.withHandler((config) =>
    Effect.gen(function* () {
      const projectRoot = process.cwd();
      const inlineConfig = previewInlineConfig(config, projectRoot);
      const server = yield* createVitePreview(inlineConfig);
      server.printUrls();
      yield* Effect.never;
    }),
  ),
);
