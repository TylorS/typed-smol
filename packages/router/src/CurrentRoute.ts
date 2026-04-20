import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Context from "effect/Context";
import { Navigation } from "@typed/navigation/Navigation";
import { Parse, type Route } from "./Route.js";

export interface CurrentRouteTree {
  readonly route: Route<string, any>;
  readonly parent?: CurrentRouteTree | undefined;
}

export class CurrentRoute extends Context.Service<CurrentRoute, CurrentRouteTree>()(
  "@typed/router/CurrentRoute",
  {
    make: Effect.map(Navigation.base, (base) => ({ route: Parse(base) } )),
  },
) {
  static readonly Default = Layer.effect(CurrentRoute, CurrentRoute.make);

  static readonly extend = (route: Route.Any) =>
    Layer.unwrap(
      Effect.gen(function* () {
        const services = yield* Effect.context<never>();
        const parent = Context.getOrUndefined(services, CurrentRoute);
        return Layer.succeed(CurrentRoute, {
          route,
          parent,
        });
      }),
    );
}
