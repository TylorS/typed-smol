import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import { Fx, RefSubject } from "@typed/fx";

interface State {
  readonly open: boolean;
}

export interface Options {
  readonly modal?: boolean;
}

export function ref<S extends State, E, R>(
  state: RefSubject.RefSubject<S, E, R>,
  options: Options = {},
): (element: HTMLDialogElement) => Effect.Effect<void, E, R | Scope.Scope> {
  return (element) =>
    Effect.asVoid(
      Effect.forkScoped(
        Fx.observe(state, (value) => Effect.sync(() => synchronize(element, value.open, options))),
      ),
    );
}

function synchronize(element: HTMLDialogElement, open: boolean, options: Options): void {
  if (open) {
    if (element.open) return;
    if (options.modal === false) element.show();
    else element.showModal();
  } else if (element.open) {
    element.close();
  }
}
