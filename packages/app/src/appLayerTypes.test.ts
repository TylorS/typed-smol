import { describe, expectTypeOf, it } from "vitest";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { composeWithLayers } from "./internal/appLayerTypes.js";

class Auth extends Context.Service<Auth, { readonly token: string }>()("test/Auth") {}

describe("app layer types", () => {
  it("keeps provided layer requirements out of launched programs", () => {
    const base = Layer.effectDiscard(Effect.flatMap(Auth, () => Effect.void));
    const auth = Layer.succeed(Auth)({ token: "test-token" });
    const layer = composeWithLayers(base, [auth]);
    const program = Effect.provide(Layer.launch(layer), Context.empty());

    expectTypeOf(program).toExtend<Effect.Effect<never, never, never>>();
  });
});
