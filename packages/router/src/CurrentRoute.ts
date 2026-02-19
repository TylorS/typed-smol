import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as ServiceMap from "effect/ServiceMap";
import { Navigation } from "@typed/navigation/Navigation";
import { Parse, type Route } from "./Route.js";

export interface CurrentRouteTree {
  readonly route: Route<string, any>;
  readonly parent?: CurrentRouteTree | undefined;
}

export class CurrentRoute extends ServiceMap.Service<CurrentRoute, CurrentRouteTree>()(
  "@typed/router/CurrentRoute",
  {
    make: Effect.map(Navigation.base, (base) => ({ route: Parse(base) })),
  },
) {
  static readonly Default = Layer.effect(CurrentRoute, CurrentRoute.make);

  static readonly extend = (route: Route.Any) =>
    Layer.unwrap(
      Effect.gen(function* () {
        const services = yield* Effect.services<never>();
        const parent = ServiceMap.getOrUndefined(services, CurrentRoute);
        return Layer.succeed(CurrentRoute, {
          route,
          parent,
        });
      }),
    );
}
