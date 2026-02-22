import { Effect } from "effect";
import * as Route from "@typed/router";

export const route = Route.Parse("search");
/** Effect function handler: (params) => Effect; plugin will lift via Fx.fromEffect. */
export const handler = (_params: { q?: string }): Effect.Effect<string> =>
  Effect.succeed("search-result");
