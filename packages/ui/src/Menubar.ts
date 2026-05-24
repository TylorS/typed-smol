import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { gen } from "@typed/fx/Fx";
import { EventHandler, html } from "@typed/template";
import * as Collection from "./Collection.js";
import * as Composite from "./Composite.js";
import * as DataAttr from "./DataAttr.js";
import * as Dom from "./Dom.js";
import { makeRef, type AnyContent, type Component, type AnyValue } from "./Reactive.js";

export interface State extends Composite.State {}

export const data = DataAttr.schema({
  activeId: Schema.optionalKey(Schema.String),
  orientation: Schema.Literals(["horizontal", "vertical", "both"]),
  loop: Schema.Boolean,
  rtl: Schema.Boolean,
  virtualFocus: Schema.Boolean,
});

export function makeState(
  initial: Composite.InitialState = { orientation: "horizontal" },
): Effect.Effect<RefSubject.RefSubject<State>, never, Scope.Scope> {
  return Composite.makeState({ orientation: "horizontal", ...initial });
}

export function move<Value, E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  items: readonly Collection.Item<Value>[],
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
  readonly items?: readonly Collection.Item[];
  readonly label?: AnyValue<string | undefined>;
}

export function Root<const E, const R, const Opts extends RootOptions<NoInfer<E>, NoInfer<R>>>(
  options: Opts & Pick<RootOptions<E, R>, "state">,
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
  const props = {
    role: "menubar",
    "aria-label": options.label,
    "aria-orientation": orientation,
    onkeydown: onKeyDown,
  };

  return Dom.renderHost<HTMLDivElement, Opts>(options, props, options.content, (props, content) =>
    html`<div ...${props}>${content}</div>`,
  );
}

export const Menubar = Root;

export interface ItemOptions<E = never, R = never> extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.RefSubject<State, E, R>;
  readonly id: AnyValue<string>;
  readonly content: AnyContent;
}

export function Item<const E, const R, const Opts extends ItemOptions<NoInfer<E>, NoInfer<R>>>(
  options: Opts & Pick<ItemOptions<E, R>, "state">,
): Component<Opts> {
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
      "data-ui-item": "typed/ui/Menubar.Item",
      tabindex: RefSubject.map(active, (value) => (value ? 0 : -1)),
      onfocus: onFocus,
    } as const;

    return Dom.renderHost<HTMLDivElement, Opts>(options, props, options.content, (props, content) =>
      html`<div ...${props}>${content}</div>`,
    );
  });
}
