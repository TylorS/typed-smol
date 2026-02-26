import { RouteHandler } from "@typed/app";
import * as Route from "@typed/router";
import { Effect, Layer, ServiceMap } from "effect";
import { Fx } from "@typed/fx";
import { html } from "@typed/template";

export class Foo extends ServiceMap.Service<Foo>()("Foo", {
  make: Effect.succeed({ foo: "foo" }),
}) {
  static readonly Default = Layer.effect(Foo, Foo.make);
}

export const route = Route.Join(Route.Parse("api"), Route.Parse("status"));

export const handler = RouteHandler(route)(
  Fx.fn(function* () {
    const { foo } = yield* Foo;
    return html`<div>${foo}</div>`;
  }),
);
