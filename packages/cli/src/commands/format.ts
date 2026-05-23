import { Effect } from "effect";
import { Argument, Command, Flag } from "effect/unstable/cli";
import { execFileSync } from "node:child_process";
import { loadProjectConfig, resolve, resolveBoolean } from "../shared/loadConfig.js";
import { findBinary } from "../shared/findBinary.js";

export interface RunFormatOptions {
  readonly projectRoot: string;
  readonly check?: boolean;
  readonly printWidth?: number;
  readonly tabWidth?: number;
  readonly useTabs?: boolean;
  readonly targets?: readonly string[];
}

export function runFormat(options: RunFormatOptions): number {
  const { projectRoot } = options;
  const bin = findBinary("oxfmt", projectRoot);
  if (!bin) {
    throw new Error("oxfmt is not installed. Run: pnpm add -D oxfmt");
  }

  const loaded = loadProjectConfig(projectRoot);
  const tc = loaded?.config;
  const fmtConfig = tc?.format;

  const args: string[] = [];

  if (options.check) args.push("--check");

  const printWidth = resolveOption(options.printWidth, fmtConfig?.printWidth);
  if (printWidth !== undefined) args.push("--print-width", String(printWidth));

  const tabWidth = resolveOption(options.tabWidth, fmtConfig?.tabWidth);
  if (tabWidth !== undefined) args.push("--tab-width", String(tabWidth));

  if (resolveBoolean(options.useTabs ?? false, fmtConfig?.useTabs, false)) {
    args.push("--use-tabs");
  }

  if (fmtConfig?.semi === false) args.push("--no-semi");
  if (fmtConfig?.singleQuote) args.push("--single-quote");
  if (fmtConfig?.trailingComma && fmtConfig.trailingComma !== "all") {
    args.push("--trailing-comma", fmtConfig.trailingComma);
  }
  if (fmtConfig?.bracketSpacing === false) args.push("--no-bracket-spacing");
  if (fmtConfig?.arrowParens === "avoid") args.push("--arrow-parens", "avoid");

  if (options.targets && options.targets.length > 0) {
    args.push(...options.targets);
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
    return 0;
  } catch (err: unknown) {
    return (err as { status?: number }).status ?? 1;
  }
}

export const format = Command.make("format", {
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
}).pipe(
  Command.withDescription("Format with oxfmt"),
  Command.withHandler((flags) =>
    Effect.gen(function* () {
      const projectRoot = process.cwd();
      try {
        const exitCode = runFormat({
          projectRoot,
          check: flags.check,
          printWidth: resolve(flags.printWidth, undefined, undefined!),
          tabWidth: resolve(flags.tabWidth, undefined, undefined!),
          useTabs: flags.useTabs,
          targets: flags.targets,
        });
        process.exitCode = exitCode;
      } catch (err: unknown) {
        return yield* Effect.fail(err instanceof Error ? err : new Error(String(err)));
      }
    }),
  ),
);

function resolveOption<A>(value: A | undefined, fallback: A | undefined): A | undefined {
  return value ?? fallback;
}
