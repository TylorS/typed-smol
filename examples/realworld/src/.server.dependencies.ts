import * as Layer from "effect/Layer";
import { DependenciesLayer as ApiDependenciesLayer } from "typed:api?dir=./api";
import { RealWorldConfig } from "./infrastructure/Config.js";
import { SqliteLive } from "./infrastructure/Sql.js";
import { ServerApiClient } from "./common/serverApiClient.js";

export const layers = [
  ServerApiClient.pipe(Layer.provideMerge(ApiDependenciesLayer)),
  SqliteLive,
  RealWorldConfig.Live,
] as const;
