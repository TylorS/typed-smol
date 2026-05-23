import { Effect, Layer } from "effect";
import { RealWorldConfig } from "../../infrastructure/Config.js";
import { runWithLayer } from "./layers.js";

const needsConfig = Effect.gen(function* () {
  return (yield* RealWorldConfig).databasePath;
});

// @ts-expect-error Layer.empty does not provide RealWorldConfig.
runWithLayer(needsConfig, Layer.empty);
