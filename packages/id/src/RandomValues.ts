import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Random from "effect/Random";
import * as Context from "effect/Context";

const allocate = <const N extends number>(
  length: N,
  fill: (view: Uint8Array<ArrayBuffer>) => void,
): Uint8Array & { readonly length: N } => {
  const view = new Uint8Array(length);
  fill(view);
  return view as Uint8Array & { readonly length: N };
};

const fillFromWebCrypto = (view: Uint8Array<ArrayBuffer>) => {
  const webCrypto = globalThis.crypto;
  if (typeof webCrypto?.getRandomValues !== "function") {
    throw new TypeError(
      "RandomValues.Default requires globalThis.crypto.getRandomValues. Provide RandomValues.Random or a custom RandomValues service for unsupported runtimes.",
    );
  }
  void webCrypto.getRandomValues(view);
};

const fromRandom = (random: (typeof Random.Random)["Service"]): RandomValues["Service"] =>
  RandomValues.of(
    <const N extends number>(length: N): Effect.Effect<Uint8Array & { readonly length: N }> =>
      Effect.sync(() =>
        allocate(length, (view) => {
          for (let i = 0; i < length; ++i) view[i] = random.nextIntUnsafe();
        }),
      ),
  );

export class RandomValues extends Context.Service<RandomValues>()("@typed/id/RandomValues", {
  make: Effect.succeed(
    <const N extends number>(length: N): Effect.Effect<Uint8Array & { readonly length: N }> =>
      Effect.sync(() => allocate(length, fillFromWebCrypto)),
  ),
}) {
  static override readonly call = <const N extends number>(
    length: N,
  ): Effect.Effect<Uint8Array & { readonly length: N }, never, RandomValues> =>
    RandomValues.pipe(Effect.flatMap((randomValues) => randomValues(length)));

  static readonly Default = Layer.effect(RandomValues, RandomValues.make);

  static readonly Random = Layer.effect(
    RandomValues,
    Effect.gen(function* () {
      const random = yield* Random.Random;
      return fromRandom(random);
    }),
  );
}
