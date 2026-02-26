import { Effect, Option } from "effect";
import { Command, Flag } from "effect/unstable/cli";
import * as fs from "node:fs";
import * as path from "node:path";
import { configFlag, modeFlag, baseFlag, logLevelFlag, entryFlag } from "../shared/flags.js";
import { resolveServerEntry } from "../shared/serverEntry.js";
import { buildInlineConfig } from "../shared/resolveConfig.js";
import { runViteBuild } from "../shared/viteHelpers.js";

const DEFAULT_OUT_DIR = "dist";
const CLIENT_OUT = "client";
const SERVER_OUT = "server";

export const build = Command.make("build", {
  outDir: Flag.optional(Flag.string("outDir")).pipe(
    Flag.withDescription("Output directory (default: dist)"),
  ),
  target: Flag.optional(Flag.string("target")).pipe(Flag.withDescription("Transpile target")),
  sourcemap: Flag.boolean("sourcemap").pipe(
    Flag.withDefault(false),
    Flag.withDescription("Output source maps"),
  ),
  minify: Flag.boolean("minify").pipe(
    Flag.withDefault(true),
    Flag.withDescription("Enable minification"),
  ),
  watch: Flag.boolean("watch").pipe(
    Flag.withDefault(false),
    Flag.withAlias("w"),
    Flag.withDescription("Rebuild on file changes"),
  ),
  entry: entryFlag,
  config: configFlag,
  mode: modeFlag,
  base: baseFlag,
  logLevel: logLevelFlag,
}).pipe(
  Command.withDescription("Build for production"),
  Command.withHandler((config) =>
    Effect.gen(function* () {
      const projectRoot = process.cwd();
      const entry = yield* resolveServerEntry(config.entry, projectRoot);
      const outDir = Option.getOrElse(config.outDir ?? Option.none(), () =>
        path.join(projectRoot, DEFAULT_OUT_DIR),
      );
      const clientOutDir = path.join(outDir, CLIENT_OUT);
      const serverOutDir = path.join(outDir, SERVER_OUT);

      const baseConfig = buildInlineConfig(config, projectRoot);

      const hasIndexHtml = yield* Effect.tryPromise(() =>
        fs.promises
          .access(path.join(projectRoot, "index.html"))
          .then(() => true)
          .catch(() => false),
      );

      if (hasIndexHtml) {
        yield* runViteBuild({
          ...baseConfig,
          build: {
            ...baseConfig.build,
            outDir: clientOutDir,
            emptyOutDir: true,
          },
        });
      }

      yield* runViteBuild({
        ...baseConfig,
        build: {
          ...baseConfig.build,
          ssr: entry,
          outDir: serverOutDir,
          emptyOutDir: !hasIndexHtml,
        },
      });
    }),
  ),
);
