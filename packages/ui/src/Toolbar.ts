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

type RequiredString = AnyValue<string>;

export interface State extends Composite.State {}

export const data = DataAttr.schema({
  activeId: Schema.optionalKey(Schema.String),
  orientation: Schema.Literals(["horizontal", "vertical", "both"]),
  loop: Schema.Boolean,
  rtl: Schema.Boolean,
  virtualFocus: Schema.Boolean,
});

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
    id: options.id,
    role: "toolbar",
    "aria-label": options.label,
    "aria-orientation": orientation,
    onkeydown: onKeyDown,
  };

  return Dom.renderHost<HTMLDivElement, Opts>(options, props, options.content, Dom.renderDivHost);
}

export const Toolbar = Root;

export interface ItemOptions<E = never, R = never> extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.RefSubject<State, E, R>;
  readonly id: RequiredString;
  readonly content: AnyContent;
}

export function Item<const E, const R, const Opts extends ItemOptions<NoInfer<E>, NoInfer<R>>>(
  options: Opts & Pick<ItemOptions<E, R>, "state">,
): Component<Opts> {
  return gen(function* () {
    const id = yield* makeRef(options.id);
    const tabIndex = RefSubject.mapEffect(id, (itemId) =>
      Effect.map(options.state, (state) => (state.activeId === itemId ? 0 : -1)),
    );
    const props = {
      id,
      role: "button",
      "data-ui-item": "typed/ui/Toolbar.Item",
      tabindex: tabIndex,
    };

    return Dom.renderHost<HTMLDivElement, Opts>(options, props, options.content, (props, content) =>
      html`<div ...${props}>${content}</div>`,
    );
  });
}

export interface ContainerOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly content: AnyContent;
}

export function Container<const Opts extends ContainerOptions>(
  options: Opts,
): Component<Opts> {
  return Dom.renderHost<HTMLDivElement, Opts>(
    options,
    { role: "presentation" },
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}

export interface SeparatorOptions extends Dom.HostOptions<HTMLDivElement> {}

export function Separator<const Opts extends SeparatorOptions = {}>(
  options = {} as Opts,
): Component<Opts> {
  return Dom.renderHost<HTMLDivElement, Opts>(options, { role: "separator" }, "", (props) =>
    html`<div ...${props}></div>`,
  );
}
