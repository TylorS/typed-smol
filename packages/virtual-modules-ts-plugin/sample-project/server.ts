/**
 * Combined demo entrypoint: router + HttpApi virtual modules.
 * Resolves router:./routes and api:./api when TS plugin loads bundled plugins.
 */
import * as Api from "api:./api";
import { Layer } from "effect";
import { NodeRuntime } from "@effect/platform-node";

Api.serve().pipe(
  Layer.launch,
  NodeRuntime.runMain
)
