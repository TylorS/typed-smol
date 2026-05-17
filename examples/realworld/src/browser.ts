import * as Effect from "effect/Effect";
import { run } from "typed:browser?routes=./browser-routes";

export const browserRuntime = run();
void Effect.runPromise(browserRuntime);
