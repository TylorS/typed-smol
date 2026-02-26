import { Command } from "effect/unstable/cli";
import { build } from "./build.js";
import { fmt, format } from "./format.js";
import { lint } from "./lint.js";
import { preview } from "./preview.js";
import { run } from "./run.js";
import { serve } from "./serve.js";
import { test } from "./test.js";

export const typed = Command.make("typed").pipe(
  Command.withDescription("Typed: Your type-safe framework."),
  Command.withSubcommands([serve, build, preview, run, test, lint, format, fmt]),
);
