import * as Effect from "effect/Effect";
import { run } from "typed:browser?routes=./routes";
import { BrowserAuth } from "./presentation/BrowserAuth.js";
import { createRealWorldClient } from "./presentation/ClientApi.js";

export const browserRuntime = run({
  layers: [BrowserAuth.Live(window, createRealWorldClient())],
});
void Effect.runPromise(browserRuntime as Effect.Effect<never, never, never>);
