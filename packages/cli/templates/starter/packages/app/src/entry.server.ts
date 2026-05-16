import { Effect } from "effect";
import { run } from "typed:server?routes=./routes&api=./api&html=./index.html&client=./entry.browser.ts";
import { entry } from "typed:config";
import { NODE_ENV } from "typed:env";

export const runnable = run();
export default Effect.runPromise(runnable);
export const serverEntry = entry;
export const mode = NODE_ENV;
