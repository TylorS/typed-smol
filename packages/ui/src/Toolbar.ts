import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import { RefSubject } from "@typed/fx";
import { gen } from "@typed/fx/Fx";
import { EventHandler, html } from "@typed/template";
import * as Collection from "./Collection.js";
import * as Composite from "./Composite.js";
import { makeRef, type Component, type Content, type Value as ReactiveValue } from "./Reactive.js";

type AnyContent = Content;
type RequiredString = ReactiveValue<string, any, any>;

export interface State extends Composite.State {}

export function makeState(
  initial: Composite.InitialState = {},
): Effect.Effect<RefSubject.RefSubject<State>, never, Scope.Scope> {
  return Composite.makeState(initial);
}

export function move(
  state: RefSubject.RefSubject<State>,
  items: Collection.State,
  direction: Composite.Move,
): Effect.Effect<State> {
  return Effect.gen(function* () {
    const current = yield* state;
    const enabled = Collection.enabledItems(Collection.byDomOrder(items));
    const activeId = nextActiveId(enabled, current, direction);
    return yield* RefSubject.update(state, (value) => ({ ...value, activeId }));
  });
}

export interface RootOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly content: AnyContent;
  readonly items?: Collection.State;
  readonly id?: RequiredString;
  readonly label?: RequiredString;
}

export function Root<const Opts extends RootOptions>(options: Opts): Component<Opts> {
  const orientation = RefSubject.map(options.state, (state) => state.orientation);
  const items = options.items;
  const onKeyDown =
    items === undefined
      ? undefined
      : EventHandler.make((event: KeyboardEvent) =>
          Effect.gen(function* () {
            const current = yield* options.state;
            const direction = Composite.keyMove(event, current);
            if (!direction) return;

            event.preventDefault();
            yield* move(options.state, items, direction);
          }),
        );
  return html`<div
    id=${options.id}
    role="toolbar"
    aria-label=${options.label}
    aria-orientation=${orientation}
    onkeydown=${onKeyDown}
  >
    ${options.content}
  </div>`;
}

export const Toolbar = Root;

export interface ItemOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly id: RequiredString;
  readonly content: AnyContent;
}

export function Item<const Opts extends ItemOptions>(options: Opts): Component<Opts> {
  return gen(function* () {
    const id = yield* makeRef(options.id);
    const tabIndex = RefSubject.mapEffect(id, (itemId) =>
      Effect.map(options.state, (state) => (state.activeId === itemId ? 0 : -1)),
    );
    return html`<div id=${id} role="button" tabindex=${tabIndex}>${options.content}</div>`;
  });
}

export function Container<const Opts extends { readonly content: AnyContent }>(
  options: Opts,
): Component<Opts> {
  return html`<div role="presentation">${options.content}</div>`;
}

export function Separator(): Component<{}> {
  return html`<div role="separator"></div>`;
}

function nextActiveId(
  items: Collection.State,
  state: State,
  direction: Composite.Move,
): string | null {
  if (items.length === 0) return null;
  if (direction === "first") return items[0]?.id ?? null;
  if (direction === "last") return items[items.length - 1]?.id ?? null;

  const index = Math.max(
    0,
    items.findIndex((item) => item.id === state.activeId),
  );
  const delta = direction === "next" ? 1 : -1;
  const next = index + delta;
  if (state.loop) return items[(next + items.length) % items.length]?.id ?? null;
  return items[Math.min(Math.max(next, 0), items.length - 1)]?.id ?? null;
}
