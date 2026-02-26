import { Effect } from "effect";
import { Argument, Command, Flag } from "effect/unstable/cli";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { loadProjectConfig, resolve, resolveBoolean } from "../shared/loadConfig.js";

function findBinary(name: string, projectRoot: string): string | undefined {
  const localBin = join(projectRoot, "node_modules", ".bin", name);
  if (existsSync(localBin)) return localBin;
  return undefined;
}

const config = {
  check: Flag.boolean("check").pipe(
    Flag.withDefault(false),
    Flag.withDescription("Check formatting without writing"),
  ),
  printWidth: Flag.optional(Flag.integer("print-width")).pipe(Flag.withDescription("Line width")),
  tabWidth: Flag.optional(Flag.integer("tab-width")).pipe(Flag.withDescription("Tab width")),
  useTabs: Flag.boolean("use-tabs").pipe(
    Flag.withDefault(false),
    Flag.withDescription("Use tabs instead of spaces"),
  ),
  targets: Argument.variadic(
    Argument.string("targets").pipe(Argument.withDescription("Files or directories to format")),
  ),
} as const;

const setup = (name: string) =>
  Command.make(name, config).pipe(
    Command.withDescription("Format with oxfmt"),
    Command.withHandler((flags) =>
      Effect.gen(function* () {
        const projectRoot = process.cwd();
        const bin = findBinary("oxfmt", projectRoot);
        if (!bin) {
          return yield* Effect.fail(new Error("oxfmt is not installed. Run: pnpm add -D oxfmt"));
        }

        const loaded = loadProjectConfig(projectRoot);
        const tc = loaded?.config;
        const fmtConfig = tc?.format;

        const args: string[] = [];

        if (flags.check) args.push("--check");

        const printWidth = resolve(flags.printWidth, fmtConfig?.printWidth, undefined!);
        if (printWidth !== undefined) args.push("--print-width", String(printWidth));

        const tabWidth = resolve(flags.tabWidth, fmtConfig?.tabWidth, undefined!);
        if (tabWidth !== undefined) args.push("--tab-width", String(tabWidth));

        if (resolveBoolean(flags.useTabs, fmtConfig?.useTabs, false)) {
          args.push("--use-tabs");
        }

        if (fmtConfig?.semi === false) args.push("--no-semi");
        if (fmtConfig?.singleQuote) args.push("--single-quote");
        if (fmtConfig?.trailingComma && fmtConfig.trailingComma !== "all") {
          args.push("--trailing-comma", fmtConfig.trailingComma);
        }
        if (fmtConfig?.bracketSpacing === false) args.push("--no-bracket-spacing");
        if (fmtConfig?.arrowParens === "avoid") args.push("--arrow-parens", "avoid");

        if (flags.targets.length > 0) {
          args.push(...flags.targets);
        } else if (fmtConfig?.include && fmtConfig.include.length > 0) {
          args.push(...fmtConfig.include);
        } else {
          args.push(".");
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

export const format = setup("format");
export const fmt = setup("fmt");
