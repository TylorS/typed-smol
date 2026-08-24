import { Effectable } from "effect";
import type * as Effect from "effect/Effect";
import { EFFECT_EVALUATE_KEY } from "./effectableEvaluateKey.js";

/**
 * Effect 4's `Effectable.Class` wires `evaluate` to `return this`. For `Effect.gen`,
 * yielded values are stepped as primitives via `evaluate`, so the instance must
 * return the real work from {@link Effectable.Class#override} — not `this` again.
 * 
 * WTF did this fix ALL my tests?
 *
 * @internal
 */
export abstract class EffectableWithOverride<A, E = never, R = never> extends Effectable.Class<A, E, R> {
  abstract override: Effect.Effect<A, E, R>;
}

// @effect-diagnostics-next-line floatingEffect:off
Object.defineProperty(EffectableWithOverride.prototype, EFFECT_EVALUATE_KEY, {
  value: function (this: EffectableWithOverride<unknown, unknown, unknown>) {
    return this.override;
  },
  configurable: true,
  writable: true,
});
