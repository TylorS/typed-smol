import * as Route from "@typed/router";
import { Effect, Layer, ServiceMap } from "effect";

export class Foo extends ServiceMap.Service<Foo>()("Foo", {
  // oxlint-disable-next-line require-yield
  make: Effect.gen(function* () {
    return {
      foo: "Foo",
    } as const;
  }),
}) {
  static readonly Default = Layer.effect(Foo, Foo.make);
}

export const route = Route.Join(Route.Parse("api"), Route.Parse("status"));
export const handler = Effect.gen(function* () {
  const { foo } = yield* Foo;
  return foo;
});
