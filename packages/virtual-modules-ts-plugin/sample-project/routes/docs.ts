import { Effect } from "effect";
import * as Route from "@typed/router";

export const route = Route.Parse("docs");
/** Effect-valued handler (non-function). */
export const handler: Effect.Effect<string> = Effect.succeed("docs");
