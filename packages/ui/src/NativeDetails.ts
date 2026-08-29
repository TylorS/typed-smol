import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import { Fx, RefSubject } from "@typed/fx";

interface State {
  readonly open: boolean;
}

export function ref<S extends State, E, R>(
  state: RefSubject.RefSubject<S, E, R>,
): (element: HTMLDetailsElement) => Effect.Effect<void, E, R | Scope.Scope> {
  return Effect.fn((element) =>
    Effect.asVoid(
      Effect.forkScoped(
        Fx.observe(
          state,
          Effect.fn((value) =>
            Effect.sync(() => {
              if (element.open !== value.open) element.open = value.open;
            }),
          ),
        ),
      ),
    ),
  );
}
