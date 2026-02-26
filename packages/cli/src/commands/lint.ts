import { Effect, Option } from "effect";
import { Argument, Command, Flag } from "effect/unstable/cli";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { loadProjectConfig, resolveBoolean } from "../shared/loadConfig.js";

const OXLINT_CONFIG_NAMES = [".oxlintrc.json", "oxlint.config.ts", "oxlint.config.js"] as const;

function findOxlintConfig(projectRoot: string): string | undefined {
  for (const name of OXLINT_CONFIG_NAMES) {
    const candidate = join(projectRoot, name);
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

function findBinary(name: string, projectRoot: string): string | undefined {
  const localBin = join(projectRoot, "node_modules", ".bin", name);
  if (existsSync(localBin)) return localBin;
  return undefined;
}

export const lint = Command.make("lint", {
  fix: Flag.boolean("fix").pipe(Flag.withDefault(false), Flag.withDescription("Apply auto-fixes")),
  rule: Flag.optional(Flag.string("rule")).pipe(
    Flag.withDescription("Override a rule level (e.g. no-unused-vars=error)"),
  ),
  category: Flag.optional(Flag.string("category")).pipe(
    Flag.withDescription("Override a category level (e.g. correctness=error)"),
  ),
  targets: Argument.variadic(
    Argument.string("targets").pipe(Argument.withDescription("Files or directories to lint")),
  ),
}).pipe(
  Command.withDescription("Lint with oxlint"),
  Command.withHandler((flags) =>
    Effect.gen(function* () {
      const projectRoot = process.cwd();
      const bin = findBinary("oxlint", projectRoot);
      if (!bin) {
        return yield* Effect.fail(new Error("oxlint is not installed. Run: pnpm add -D oxlint"));
      }

      const loaded = loadProjectConfig(projectRoot);
      const tc = loaded?.config;
      const lintConfig = tc?.lint;

      const args: string[] = [];

      const existingConfig = findOxlintConfig(projectRoot);
      if (existingConfig) {
        args.push("--config", existingConfig);
      } else {
        const categories = lintConfig?.categories ?? {
          correctness: "warn" as const,
          suspicious: "warn" as const,
        };
        for (const [cat, level] of Object.entries(categories)) {
          args.push(`--${cat}-category`, level);
        }

        if (lintConfig?.rules) {
          for (const [rule, level] of Object.entries(lintConfig.rules)) {
            args.push("--rule", `${rule}=${level}`);
          }
        }

        if (lintConfig?.plugins) {
          for (const plugin of lintConfig.plugins) {
            args.push("--plugin", plugin);
          }
        }
      }

      const ruleOverride = Option.getOrUndefined(flags.rule ?? Option.none());
      if (ruleOverride) args.push("--rule", ruleOverride);

      const categoryOverride = Option.getOrUndefined(flags.category ?? Option.none());
      if (categoryOverride) {
        const [cat, level] = categoryOverride.split("=");
        if (cat && level) args.push(`--${cat}-category`, level);
      }

      if (resolveBoolean(flags.fix, lintConfig?.fix, false)) {
        args.push("--fix");
      }

      if (flags.targets.length > 0) {
        args.push(...flags.targets);
      } else if (lintConfig?.include && lintConfig.include.length > 0) {
        args.push(...lintConfig.include);
      } else {
        args.push("src/");
      }

      try {
        execFileSync(bin, args, {
          cwd: projectRoot,
          stdio: "inherit",
        });
      } catch (err: unknown) {
        const exitCode = (err as { status?: number }).status ?? 1;
        process.exitCode = exitCode;
      }
    }),
  ),
);
