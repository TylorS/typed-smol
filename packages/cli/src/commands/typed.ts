import { Command } from "effect/unstable/cli";
import { serve } from "./serve.js";
import { build } from "./build.js";
import { preview } from "./preview.js";
import { run } from "./run.js";

export const typed = Command.make("typed").pipe(
  Command.withDescription("Typed-smol CLI: Vite 7 + server-side capabilities"),
  Command.withSubcommands([serve, build, preview, run]),
);
