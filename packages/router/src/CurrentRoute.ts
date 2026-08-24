import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Context from "effect/Context";
import { Navigation } from "@typed/navigation/Navigation";
import { Parse, type Route } from "./Route.js";

const normalizeBasePath = (base: string): string => {
  try {
    return new URL(base).pathname;
  } catch {
    return base;
  }
};

export interface CurrentRouteTree {
  readonly route: Route<string, any>;
  readonly parent?: CurrentRouteTree | undefined;
}

/**
 * The ambient route context for the current routing boundary.
 *
 * Router layers provide a stable mount tree derived from `Navigation.base`.
 * Nested layers and request adapters can shadow that value with a more specific
 * tree. This service is not a reactive view of `Navigation.currentEntry`.
 */
export class CurrentRoute extends Context.Service<CurrentRoute, CurrentRouteTree>()(
  "@typed/router/CurrentRoute",
  {
    make: Effect.map(Navigation.base, (base) => ({ route: Parse(normalizeBasePath(base)) })),
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
