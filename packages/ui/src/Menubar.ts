import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import { RefSubject } from "@typed/fx";
import { gen } from "@typed/fx/Fx";
import { EventHandler, html } from "@typed/template";
import * as Collection from "./Collection.js";
import * as Composite from "./Composite.js";
import * as Dom from "./Dom.js";
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
    const current = yield* state;
    const activeId = Composite.moveActiveId(items, current, direction);
    return yield* RefSubject.update(state, (value) => ({ ...value, activeId }));
  });
}

export interface RootOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.RefSubject<State>;
  readonly content: Content;
  readonly items?: readonly Collection.Item[];
  readonly label?: ReactiveValue<string | undefined, any, any>;
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
            const typeaheadId = Composite.typeaheadFromEvent(event, items);
            if (typeaheadId) {
              yield* RefSubject.update(options.state, (value) => ({
                ...value,
                activeId: typeaheadId,
              }));
              return;
            }

            const direction = Composite.keyMove(event, current);
            if (!direction) return;

            event.preventDefault();
            yield* move(options.state, items, direction);
          }),
        );
  const props = Dom.mergeProps(options.props, {
    role: "menubar",
    "aria-label": options.label,
    "aria-orientation": orientation,
    onkeydown: onKeyDown,
  });

  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<div
    role="menubar"
    aria-label=${options.label}
    aria-orientation=${orientation}
    onkeydown=${onKeyDown}
  >
    ${options.content}
  </div>`;
}

export const Menubar = Root;

export interface ItemOptions extends Dom.HostOptions<HTMLDivElement> {
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

    if (options.host) return options.host(Dom.mergeProps(options.props, props), options.content) as Component<Opts>;

    return html`<div ...${props}>${options.content}</div>`;
  });
}
