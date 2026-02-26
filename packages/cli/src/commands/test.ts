import { Effect, Option } from "effect";
import { Argument, Command, Flag } from "effect/unstable/cli";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { configFlag, modeFlag, logLevelFlag } from "../shared/flags.js";
import { loadProjectConfig, resolveBoolean } from "../shared/loadConfig.js";
import { resolveViteInlineConfig } from "../shared/resolveViteConfig.js";

const VITEST_CONFIG_NAMES = [
  "vitest.config.ts",
  "vitest.config.js",
  "vitest.config.mts",
  "vitest.config.mjs",
] as const;

function findVitestConfig(projectRoot: string): string | undefined {
  for (const name of VITEST_CONFIG_NAMES) {
    const candidate = join(projectRoot, name);
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

export const test = Command.make("test", {
  watch: Flag.boolean("watch").pipe(
    Flag.withDefault(false),
    Flag.withAlias("w"),
    Flag.withDescription("Run in watch mode"),
  ),
  coverage: Flag.boolean("coverage").pipe(
    Flag.withDefault(false),
    Flag.withDescription("Enable coverage"),
  ),
  reporter: Flag.optional(Flag.string("reporter")).pipe(Flag.withDescription("Test reporter")),
  environment: Flag.optional(Flag.string("environment")).pipe(
    Flag.withDescription("Test environment (e.g. node, jsdom)"),
  ),
  config: configFlag,
  mode: modeFlag,
  logLevel: logLevelFlag,
  filters: Argument.variadic(
    Argument.string("filters").pipe(Argument.withDescription("Test file filters")),
  ),
}).pipe(
  Command.withDescription("Run tests with vitest"),
  Command.withHandler((flags) =>
    Effect.gen(function* () {
      const { createVitest } = yield* Effect.tryPromise({
        try: () => import("vitest/node") as Promise<typeof import("vitest/node")>,
        catch: () => new Error("vitest is not installed. Run: pnpm add -D vitest"),
      });

      const projectRoot = process.cwd();
      const loaded = loadProjectConfig(projectRoot);
      const tc = loaded?.config;
      const testConfig = tc?.test;

      const vitestConfigPath = findVitestConfig(projectRoot);

      const viteOverrides = resolveViteInlineConfig({
        projectRoot,
        typedConfig: tc,
        baseInlineConfig: {
          root: projectRoot,
          mode: Option.getOrUndefined(flags.mode ?? Option.none()),
          logLevel: Option.getOrUndefined(flags.logLevel ?? Option.none()),
        },
      });

      const testOptions: Record<string, unknown> = {};

      if (vitestConfigPath) {
        viteOverrides.configFile = vitestConfigPath;
      } else {
        const include = testConfig?.include ?? ["src/**/*.{test,spec}.ts"];
        const exclude = testConfig?.exclude ?? ["**/node_modules/**", "**/dist/**"];
        testOptions.include = [...include];
        testOptions.exclude = [...exclude];

        if (testConfig?.globals !== undefined) {
          testOptions.globals = testConfig.globals;
        }

        const env =
          Option.getOrUndefined(flags.environment ?? Option.none()) ?? testConfig?.environment;
        if (env) testOptions.environment = env;

        if (testConfig?.typecheck !== undefined) {
          testOptions.typecheck =
            typeof testConfig.typecheck === "boolean"
              ? { enabled: testConfig.typecheck }
              : testConfig.typecheck;
        } else {
          testOptions.typecheck = { enabled: true };
        }

        if (
          resolveBoolean(flags.coverage, testConfig?.coverage !== undefined, false) &&
          testConfig?.coverage
        ) {
          testOptions.coverage = { ...testConfig.coverage };
        } else if (flags.coverage) {
          testOptions.coverage = { provider: "v8" as const };
        }

        const reporter = Option.getOrUndefined(flags.reporter ?? Option.none());
        if (reporter) {
          testOptions.reporters = [reporter];
        } else if (testConfig?.reporters) {
          testOptions.reporters = [...testConfig.reporters];
        }
      }

      const vitest = yield* Effect.promise(() =>
        createVitest(
          "test",
          {
            watch: flags.watch,
            ...testOptions,
          },
          viteOverrides,
        ),
      );

      const filters = flags.filters.length > 0 ? flags.filters.slice(0) : [];
      yield* Effect.promise(() => vitest.start(filters));

      if (!flags.watch) {
        yield* Effect.promise(() => vitest.close());
      }
    }),
  ),
);
