import * as Effect from "effect/Effect";
import { run } from "typed:browser?routes=./routes";

export const browserRuntime = run();
await Effect.runPromise(browserRuntime);
