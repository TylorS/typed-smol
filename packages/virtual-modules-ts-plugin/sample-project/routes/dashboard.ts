import { Effect } from "effect";
import * as Route from "@typed/router";

export const route = Route.Parse("dashboard");
/** Effect-valued handler (non-function); plugin will lift via Fx.fromEffect. */
export const handler: Effect.Effect<number> = Effect.succeed(1);
