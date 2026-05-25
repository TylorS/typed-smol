import * as Effect from "effect/Effect";
import { run } from "typed:browser?routes=./routes";

await Effect.runPromise(run({ devtools: import.meta.env.VITE_TYPED_DEVTOOLS_SMOKE === "1" }));
