import * as Effect from "effect/Effect";
import { run } from "typed:browser?routes=./routes&devtools=1";

await Effect.runPromise(run());
