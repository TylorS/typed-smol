import { Effect, Option } from "effect";
import { Command, Flag } from "effect/unstable/cli";
import { pathToFileURL } from "node:url";
import {
  configFlag,
  modeFlag,
  baseFlag,
  logLevelFlag,
  entryFlag,
} from "../shared/flags.js";
import { resolveServerEntry } from "../shared/serverEntry.js";
import { loadProjectConfig, resolve, resolveBoolean } from "../shared/loadConfig.js";
import { resolveViteInlineConfig } from "../shared/resolveViteConfig.js";
import { createViteServer } from "../shared/viteHelpers.js";

export const serve = Command.make("serve", {
  host: Flag.optional(Flag.string("host")).pipe(
    Flag.withDescription("Specify hostname"),
  ),
  port: Flag.optional(Flag.integer("port")).pipe(
    Flag.withDescription("Specify port"),
  ),
  open: Flag.boolean("open").pipe(
    Flag.withDefault(false),
    Flag.withDescription("Open browser on startup"),
  ),
  cors: Flag.boolean("cors").pipe(
    Flag.withDefault(false),
    Flag.withDescription("Enable CORS"),
  ),
  strictPort: Flag.boolean("strictPort").pipe(
    Flag.withDefault(false),
    Flag.withDescription("Exit if port is in use"),
  ),
  force: Flag.boolean("force").pipe(
    Flag.withDefault(false),
    Flag.withDescription("Force optimizer to re-bundle"),
  ),
  entry: entryFlag,
  config: configFlag,
  mode: modeFlag,
  base: baseFlag,
  logLevel: logLevelFlag,
}).pipe(
  Command.withDescription("Start the development server"),
  Command.withHandler((flags) =>
    Effect.gen(function* () {
      const projectRoot = process.cwd();
      const loaded = loadProjectConfig(projectRoot);
      const tc = loaded?.config;

      const entry = yield* resolveServerEntry(flags.entry, projectRoot);

      const inlineConfig = resolveViteInlineConfig({
        projectRoot,
        typedConfig: tc,
        explicitConfigFile: Option.getOrUndefined(flags.config ?? Option.none()),
        baseInlineConfig: {
          root: projectRoot,
          mode: Option.getOrUndefined(flags.mode ?? Option.none()),
          base: Option.getOrUndefined(flags.base ?? Option.none()),
          logLevel: Option.getOrUndefined(flags.logLevel ?? Option.none()),
          server: {
            host: resolve(flags.host, tc?.server?.host, undefined!),
            port: resolve(flags.port, tc?.server?.port, undefined!),
            open: resolveBoolean(flags.open, tc?.server?.open, false),
            cors: resolveBoolean(flags.cors, tc?.server?.cors, false),
            strictPort: resolveBoolean(flags.strictPort, tc?.server?.strictPort, false),
          },
          optimizeDeps: flags.force ? { force: true } : undefined,
        },
      });

      const server = yield* createViteServer(inlineConfig);
      yield* Effect.tryPromise(() => server.listen());
      server.printUrls();
      const entryUrl = pathToFileURL(entry).href;
      server.ssrLoadModule(entryUrl).catch((err) => {
        console.error("Failed to load server entry:", err);
      });
      yield* Effect.never;
    }),
  ),
);
