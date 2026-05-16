import { Effect } from "effect";
import { Argument, Command } from "effect/unstable/cli";
import { scaffoldTypedWorkspace } from "../create/scaffold.js";

export const create = Command.make("create", {
  name: Argument.string("name"),
}).pipe(
  Command.withDescription("Create a Typed workspace from the starter template"),
  Command.withHandler(({ name }) =>
    Effect.sync(() => {
      const target = scaffoldTypedWorkspace({ cwd: process.cwd(), name });
      console.log(`Created Typed workspace at ${target}`);
    }),
  ),
);
