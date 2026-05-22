import * as Effect from "effect/Effect";
import { run } from "typed:browser?routes=./routes";

await Effect.runPromise(run());
