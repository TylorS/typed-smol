#!/usr/bin/env node

import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Effect } from "effect";
import { Command } from "effect/unstable/cli";
import { typed } from "./commands/typed.js";

const program = Command.run(typed, { version: "1.0.0-beta.1" }).pipe(
  Effect.provide(NodeServices.layer),
) as Effect.Effect<void, unknown, never>;

NodeRuntime.runMain(program);
