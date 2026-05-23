import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import { RefSubject } from "@typed/fx";
import { gen } from "@typed/fx/Fx";
import { EventHandler, html } from "@typed/template";
import * as Collection from "./Collection.js";
import * as Composite from "./Composite.js";
import { makeRef, type Component, type Content, type Value as ReactiveValue } from "./Reactive.js";

export interface State extends Composite.State {}

export function makeState(
  initial: Composite.InitialState = { orientation: "horizontal" },
): Effect.Effect<RefSubject.RefSubject<State>, never, Scope.Scope> {
  return Composite.makeState({ orientation: "horizontal", ...initial });
}

export function move<Value>(
  state: RefSubject.RefSubject<State>,
  items: readonly Collection.Item<Value>[],
  direction: Composite.Move,
): Effect.Effect<State> {
  return Effect.gen(function* () {
    const enabled = Collection.enabledItems(Collection.byDomOrder(items));
    const current = yield* state;
    if (enabled.length === 0) return current;
    const index = Math.max(
      0,
      enabled.findIndex((item) => item.id === current.activeId),
    );
    const activeId =
      direction === "first"
        ? enabled[0]?.id
        : direction === "last"
          ? enabled[enabled.length - 1]?.id
          : enabled[(index + (direction === "next" ? 1 : -1) + enabled.length) % enabled.length]
              ?.id;

    return yield* RefSubject.update(state, (value) => ({ ...value, activeId: activeId ?? null }));
  });
}

export interface RootOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly content: Content;
  readonly label?: ReactiveValue<string | undefined, any, any>;
}

export function Root<const Opts extends RootOptions>(options: Opts): Component<Opts> {
  const orientation = RefSubject.map(options.state, (state) => state.orientation);
  return html`<div role="menubar" aria-label=${options.label} aria-orientation=${orientation}>
    ${options.content}
  </div>`;
}

export const Menubar = Root;

export interface ItemOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly id: ReactiveValue<string, any, any>;
  readonly content: Content;
}

export function Item<const Opts extends ItemOptions>(options: Opts): Component<Opts> {
  return gen(function* () {
    const id = yield* makeRef(options.id);
    const active = RefSubject.mapEffect(options.state, (state) =>
      Effect.map(id, (itemId) => state.activeId === itemId),
    );
    const onFocus = EventHandler.make(() =>
      Effect.flatMap(id, (itemId) =>
        RefSubject.update(options.state, (state) => ({ ...state, activeId: itemId })),
      ),
    );
    const props = {
      id,
      role: "menuitem",
      tabindex: RefSubject.map(active, (value) => (value ? 0 : -1)),
      onfocus: onFocus,
    } as const;

    return html`<div ...${props}>${options.content}</div>`;
  });
}
