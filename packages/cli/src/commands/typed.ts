import { Command } from "effect/unstable/cli";
import { serve } from "./serve.js";
import { build } from "./build.js";
import { preview } from "./preview.js";
import { run } from "./run.js";
import { test } from "./test.js";
import { lint } from "./lint.js";
import { format } from "./format.js";

export const typed = Command.make("typed").pipe(
  Command.withDescription("Typed-smol CLI: Vite 7 + server-side capabilities"),
  Command.withSubcommands([serve, build, preview, run, test, lint, format]),
);
