import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import { Fx, RefSubject } from "@typed/fx";

interface State {
  readonly open: boolean;
}

/**
 * Creates a scoped ref that synchronizes state with the native Popover API.
 *
 * @remarks
 * ## Why
 *
 * The browser owns top-layer placement and popover lifecycle. The ref checks
 * `:popover-open` before calling `showPopover()` or `hidePopover()`, avoiding
 * invalid duplicate transitions while preserving native toggle events.
 *
 * ## Ownership and lifetime
 *
 * Applying the ref forks one observer in the current Effect Scope. Closing the
 * Scope interrupts it; it does not remove the host or close the caller-owned
 * state. The host must support the Popover API and retain its `popover`
 * attribute. Only one hydration owner may be composed for the element.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as NativePopover from "@typed/ui/NativePopover"
 * import * as Popover from "@typed/ui/Popover"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Popover.makeState()
 *   return NativePopover.ref(state)
 * })
 * ```
 *
 * @since 1.0.0
 * @category refs
 */
export function ref<S extends State, E, R>(
  state: RefSubject.RefSubject<S, E, R>,
): (element: HTMLElement) => Effect.Effect<void, E, R | Scope.Scope> {
  return Effect.fn((element) =>
    Effect.asVoid(
      Effect.forkScoped(
        Fx.observe(
          state,
          Effect.fn((value) => Effect.sync(() => synchronize(element, value.open))),
        ),
      ),
    ),
  );
}

function synchronize(element: HTMLElement, open: boolean): void {
  if (open) {
    if (!element.matches(":popover-open")) element.showPopover();
  } else if (element.matches(":popover-open")) {
    element.hidePopover();
  }
}
