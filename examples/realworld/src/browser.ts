import * as Effect from "effect/Effect";
import { run } from "typed:browser?routes=./browser-routes";
import { createRealWorldClient } from "./presentation/ClientApi.js";
import { installConduitDebug } from "./presentation/Debug.js";
import { createAuthStore } from "./presentation/State.js";

export const browserRuntime = run();
void Effect.runPromise(browserRuntime);

export const authRuntime = createAuthStore(window, createRealWorldClient()).pipe(
  Effect.tap((store) => Effect.sync(() => installConduitDebug(window, store))),
  Effect.flatMap((store) => store.initialize),
);
void Effect.runPromise(authRuntime);
