import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { relative } from "node:path";
import { pathToFileURL } from "node:url";
import { Context, Effect } from "effect";
import { Command, Flag } from "effect/unstable/cli";
import { configFlag, modeFlag, baseFlag, logLevelFlag, entryFlag } from "../shared/flags.js";
import { resolveServerEntry } from "../shared/serverEntry.js";
import { loadProjectConfig, resolve, resolveBoolean } from "../shared/loadConfig.js";
import { resolveBuiltServerEntry } from "../shared/serverBuildOutput.js";

interface BuiltServerRunOptions {
  readonly host?: string;
  readonly port?: number;
}

interface BuiltServerModule {
  readonly run?: (options?: BuiltServerRunOptions) => Effect.Effect<never, Error, never>;
}

export const preview = Command.make("preview", {
  host: Flag.optional(Flag.string("host")).pipe(Flag.withDescription("Specify hostname")),
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

      const entry = yield* resolveServerEntry(flags.entry, projectRoot, tc?.entry);
      const builtEntry = resolveBuiltServerEntry({ projectRoot, entry, typedConfig: tc });

      if (!existsSync(builtEntry)) {
        return yield* Effect.fail(
          new Error(
            `[typed] Built server entry not found at ${relative(projectRoot, builtEntry)}. Run "typed build" before "typed preview".`,
          ),
        );
      }

      const host = resolve(flags.host, tc?.preview?.host, "127.0.0.1");
      const port = resolve(flags.port, tc?.preview?.port, 4173);
      const open = resolveBoolean(flags.open, tc?.preview?.open, false);

      if (open) {
        yield* openUrl(`http://${host}:${port}`);
      }

      const server = yield* importBuiltServer(builtEntry);
      const run = getRunExport(server, builtEntry);

      yield* Effect.provide(run({ host, port }), Context.empty());
    }),
  ),
);

function importBuiltServer(path: string): Effect.Effect<BuiltServerModule, Error> {
  return Effect.tryPromise({
    try: () => import(pathToFileURL(path).href) as Promise<BuiltServerModule>,
    catch: (error) => (error instanceof Error ? error : new Error(String(error))),
  });
}

function getRunExport(
  server: BuiltServerModule,
  builtEntry: string,
): Exclude<BuiltServerModule["run"], undefined> {
  if (typeof server.run === "function") return server.run;
  throw new Error(
    `[typed] Built server entry ${builtEntry} does not export run(). Rebuild with a current typed:server entry.`,
  );
}

function openUrl(url: string): Effect.Effect<void> {
  return Effect.sync(() => {
    const command =
      process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
    const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
    const child = spawn(command, args, { detached: true, stdio: "ignore" });
    child.unref();
  });
}
