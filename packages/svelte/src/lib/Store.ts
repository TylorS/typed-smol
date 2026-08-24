import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import type { Fx } from "@typed/fx/Fx";
import * as FxRuntime from "@typed/fx/Fx";
import { RefSubject as RefSubjectRuntime } from "@typed/fx/RefSubject";
import type { Readable, Writable } from "svelte/store";
import { writable } from "svelte/store";

/**
 * Exposes a non-failing Typed Fx as a Svelte readable store.
 *
 * The subscription is owned by the current Effect Scope. Svelte stores have no
 * error channel, so this adapter deliberately accepts only `E = never`.
 */
export function toReadable<A, R>(
  source: Fx<A, never, R>,
  initial: A,
): Effect.Effect<Readable<A>, never, R | Scope.Scope> {
  return Effect.gen(function* () {
    const store = writable(initial);

    yield* FxRuntime.observe(source, store.set).pipe(Effect.forkScoped);

    return { subscribe: store.subscribe };
  });
}

/**
 * Exposes a non-failing RefSubject as a Svelte writable store.
 *
 * Svelte writes update the local store synchronously and schedule the matching
 * RefSubject transaction through the current Effect context. External
 * RefSubject updates flow back into the store until the current Scope closes.
 */
export function toWritable<A, R>(
  ref: RefSubjectRuntime.RefSubject<A, never, R>,
): Effect.Effect<Writable<A>, never, R | Scope.Scope> {
  return Effect.gen(function* () {
    let current = yield* ref;
    const store = writable(current);
    const services = yield* Effect.context<R>();
    const runFork = Effect.runForkWith(services);

    yield* FxRuntime.observe(ref, (value) => {
      current = value;
      store.set(value);
    }).pipe(Effect.forkScoped);

    const set = (value: A): void => {
      current = value;
      store.set(value);
      runFork(RefSubjectRuntime.set(ref, value));
    };

    return {
      subscribe: store.subscribe,
      set,
      update: (f) => set(f(current)),
    };
  });
}
