import { Effect } from "effect";
import { run } from "typed:browser?routes=*";

export const browserRuntime = run();
void Effect.runPromise(browserRuntime);
