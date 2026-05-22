import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import { RefSubject } from "@typed/fx";
import { gen } from "@typed/fx/Fx";
import { EventHandler, html } from "@typed/template";
import * as Collection from "./Collection.js";
import * as Composite from "./Composite.js";
import type { Component, Content, Value as ReactiveValue } from "./Reactive.js";

type AnyContent = Content;
type RequiredString = ReactiveValue<string, any, any>;

export interface State<Value extends string = string> {
  readonly value: Value;
  readonly activeId: string;
  readonly orientation: Composite.Orientation;
  readonly loop: boolean;
  readonly toolbar: boolean;
}

export interface InitialState<Value extends string = string> {
  readonly value: Value;
  readonly activeId?: string;
  readonly orientation?: Composite.Orientation;
  readonly loop?: boolean;
  readonly toolbar?: boolean;
}

export interface Item<Value extends string = string> extends Collection.Item<Value> {
  readonly value: Value;
}

export function makeState<Value extends string>(
  initial: InitialState<Value>,
): Effect.Effect<RefSubject.RefSubject<State<Value>>, never, Scope.Scope> {
  return RefSubject.make({
    value: initial.value,
    activeId: initial.activeId ?? initial.value,
    orientation: initial.orientation ?? "horizontal",
    loop: initial.loop ?? true,
    toolbar: initial.toolbar ?? false,
  });
}

export function setValue<Value extends string>(
  state: RefSubject.RefSubject<State<Value>>,
  value: Value,
): Effect.Effect<State<Value>> {
  return RefSubject.update(state, (current) => ({ ...current, activeId: value, value }));
}

export function selectItem<Value extends string>(
  state: RefSubject.RefSubject<State<Value>>,
  activeId: string,
  value: Value,
): Effect.Effect<State<Value>> {
  return RefSubject.update(state, (current) => ({ ...current, activeId, value }));
}

export function move<Value extends string>(
  state: RefSubject.RefSubject<State<Value>>,
  items: readonly Item<Value>[],
  direction: Composite.Move,
): Effect.Effect<State<Value>> {
  return Effect.gen(function* () {
    const current = yield* state;
    const enabled = Collection.enabledItems(items);
    const nextId = nextActiveId(enabled, current.activeId, direction, current.loop);
    const next = enabled.find((item) => item.id === nextId);
    if (!next) return current;

    return yield* RefSubject.update(state, (value) => ({
      ...value,
      activeId: next.id,
      value: value.toolbar ? value.value : next.value,
    }));
  });
}

export interface RootOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly content: AnyContent;
  readonly id?: RequiredString;
  readonly label?: RequiredString;
}

export function Root<const Opts extends RootOptions>(options: Opts): Component<Opts> {
  const orientation = RefSubject.map(options.state, (state) => state.orientation);
  return html`<div
    id=${options.id}
    role="radiogroup"
    aria-label=${options.label}
    aria-orientation=${orientation}
  >
    ${options.content}
  </div>`;
}

export interface ItemOptions<Value extends string = string> {
  readonly state: RefSubject.RefSubject<State<Value>>;
  readonly id: RequiredString;
  readonly value: ReactiveValue<Value, any, any>;
  readonly content: AnyContent;
}

export function Item<const Value extends string, const Opts extends ItemOptions<Value>>(
  options: Opts,
): Component<Opts> {
  return gen(function* () {
    const id = yield* RefSubject.make(options.id);
    const value = yield* RefSubject.make(options.value);
    const checked = isChecked(options.state, value);
    const onClick = EventHandler.make(() =>
      Effect.gen(function* () {
        yield* selectItem(options.state, yield* id, yield* value);
      }),
    );
    const props: Record<string, unknown> = {
      id,
      "data-value": value,
      role: "radio",
      "aria-checked": checked,
      tabindex: RefSubject.map(checked, (value) => (value ? 0 : -1)),
      "data-checked": checked,
      onclick: onClick,
    };

    return html`<div ...${props}>${options.content}</div>`;
  });
}

function isChecked<Value extends string>(
  state: RefSubject.RefSubject<State<Value>>,
  value: RefSubject.Computed<Value, any, any>,
) {
  return RefSubject.mapEffect(state, (current) =>
    Effect.map(value, (value) => current.value === value),
  );
}

function nextActiveId<Value>(
  items: readonly Collection.Item<Value>[],
  activeId: string,
  direction: Composite.Move,
  loop: boolean,
): string | undefined {
  if (items.length === 0) return undefined;
  if (direction === "first") return items[0]?.id;
  if (direction === "last") return items[items.length - 1]?.id;

  const index = Math.max(
    0,
    items.findIndex((item) => item.id === activeId),
  );
  const delta = direction === "next" ? 1 : -1;
  const next = index + delta;
  if (loop) return items[(next + items.length) % items.length]?.id;
  return items[Math.min(Math.max(next, 0), items.length - 1)]?.id;
}
