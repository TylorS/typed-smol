import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import { RefSubject } from "@typed/fx";
import { gen } from "@typed/fx/Fx";
import { EventHandler, html } from "@typed/template";
import * as Collection from "./Collection.js";
import * as Composite from "./Composite.js";
import * as Dom from "./Dom.js";
import { makeRef, type Component, type Content, type Value as ReactiveValue } from "./Reactive.js";

type AnyContent = Content;
type RequiredString = ReactiveValue<string, any, any>;

export interface State extends Composite.State {}

export function makeState(
  initial: Composite.InitialState = {},
): Effect.Effect<RefSubject.RefSubject<State>, never, Scope.Scope> {
  return Composite.makeState(initial);
}

export function move<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  items: Collection.State,
  direction: Composite.Move,
): Effect.Effect<State, E, R> {
  return Effect.gen(function* () {
    const current = yield* state;
    const activeId = Composite.moveActiveId(items, current, direction);
    return yield* RefSubject.update(state, (value) => ({ ...value, activeId }));
  });
}

export interface RootOptions<E = never, R = never> extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.RefSubject<State, E, R>;
  readonly content: AnyContent;
  readonly items?: Collection.State;
  readonly id?: RequiredString;
  readonly label?: RequiredString;
}

export function Root<const E, const R, const Opts extends RootOptions<E, R>>(
  options: Opts,
): Component<Opts> {
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
    id: options.id,
    role: "toolbar",
    "aria-label": options.label,
    "aria-orientation": orientation,
    onkeydown: onKeyDown,
  });

  if (options.host) return options.host(props, options.content) as Component<Opts>;

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

export interface ItemOptions<E = never, R = never> extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.RefSubject<State, E, R>;
  readonly id: RequiredString;
  readonly content: AnyContent;
}

export function Item<const E, const R, const Opts extends ItemOptions<E, R>>(
  options: Opts,
): Component<Opts> {
  return gen(function* () {
    const id = yield* makeRef(options.id);
    const tabIndex = RefSubject.mapEffect(id, (itemId) =>
      Effect.map(options.state, (state) => (state.activeId === itemId ? 0 : -1)),
    );
    const props = Dom.mergeProps(options.props, {
      id,
      role: "button",
      tabindex: tabIndex,
    });

    if (options.host) return options.host(props, options.content) as Component<Opts>;

    return html`<div ...${props}>${options.content}</div>`;
  });
}

export function Container<const Opts extends { readonly content: AnyContent } & Dom.HostOptions<HTMLDivElement>>(
  options: Opts,
): Component<Opts> {
  if (options.host) {
    return options.host(Dom.mergeProps(options.props, { role: "presentation" }), options.content) as Component<Opts>;
  }

  return html`<div role="presentation">${options.content}</div>`;
}

export function Separator<const Opts extends Dom.HostOptions<HTMLDivElement> = {}>(
  options = {} as Opts,
): Component<Opts> {
  if (options.host) {
    return options.host(Dom.mergeProps(options.props, { role: "separator" }), "") as Component<Opts>;
  }

  return html`<div role="separator"></div>`;
}
