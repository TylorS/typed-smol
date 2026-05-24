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
type OptionalBoolean = AnyValue<boolean | undefined>;

export interface State<Value extends string = string> {
  readonly value: Value | null;
  readonly activeId: string | null;
  readonly orientation: Composite.Orientation;
  readonly loop: boolean;
  readonly rtl: boolean;
  readonly virtualFocus: boolean;
}

export interface InitialState<Value extends string = string> {
  readonly value?: Value | null;
  readonly activeId?: string | null;
  readonly orientation?: Composite.Orientation;
  readonly loop?: boolean;
  readonly rtl?: boolean;
  readonly virtualFocus?: boolean;
}

export interface Item<Value extends string = string> extends Collection.Item<Value> {
  readonly value: Value;
}

export const data = DataAttr.schema({
  value: Schema.optionalKey(Schema.String),
  activeId: Schema.optionalKey(Schema.String),
  orientation: Schema.optionalKey(Schema.Literals(["horizontal", "vertical", "both"])),
  loop: Schema.optionalKey(Schema.Boolean),
  rtl: Schema.optionalKey(Schema.Boolean),
  virtualFocus: Schema.optionalKey(Schema.Boolean),
});

export const optionData = DataAttr.schema({
  active: Schema.Boolean,
  disabled: Schema.Boolean,
  selected: Schema.Boolean,
});

export const component = "typed/ui/Listbox";

export function makeState<Value extends string = string>(
  initial: InitialState<NoInfer<Value>> = {},
): Effect.Effect<RefSubject.RefSubject<State<Value>>, never, Scope.Scope> {
  const state: State<Value> = {
    value: initial.value ?? null,
    activeId: initial.activeId ?? null,
    orientation: initial.orientation ?? "vertical",
    loop: initial.loop ?? true,
    rtl: initial.rtl ?? false,
    virtualFocus: initial.virtualFocus ?? false,
  };

  return RefSubject.make(state);
}

export function select<Value extends string, E, R>(
  state: RefSubject.RefSubject<State<Value>, E, R>,
  activeId: string,
  value: Value,
): Effect.Effect<State<Value>, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, activeId, value }));
}

export function move<Value extends string, E, R>(
  state: RefSubject.RefSubject<State<Value>, E, R>,
  items: readonly Item<Value>[],
  direction: Composite.Move,
): Effect.Effect<State<Value>, E, R> {
  return Effect.gen(function* () {
    const current = yield* state;
    const activeId = Composite.moveActiveId(items, current, direction);
    return yield* RefSubject.update(state, (value) => ({ ...value, activeId }));
  });
}

export interface RootOptions<Value extends string = string, E = never, R = never>
  extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.RefSubject<State<Value>, E, R>;
  readonly content: AnyContent;
  readonly items?: readonly Item<Value>[];
  readonly id?: RequiredString;
  readonly label?: RequiredString;
}

export function Root<
  const Value extends string,
  const E,
  const R,
  const Opts extends RootOptions<Value, NoInfer<E>, NoInfer<R>>,
>(options: Opts & Pick<RootOptions<Value, E, R>, "state">): Component<Opts> {
  const orientation = RefSubject.map(options.state, (current) => current.orientation);
  const activeDescendant = RefSubject.map(options.state, (current) =>
    current.virtualFocus && current.activeId ? current.activeId : undefined,
  );
  const items = options.items;
  const onKeyDown =
    items === undefined
      ? undefined
      : EventHandler.make((event: KeyboardEvent) =>
          Effect.gen(function* () {
            const current = yield* options.state;
            const typeaheadId = Composite.typeaheadFromEvent(event, items, (item) =>
              item.textValue ?? item.value ?? item.id,
            );
            if (typeaheadId) {
              yield* RefSubject.update(options.state, (value) => ({ ...value, activeId: typeaheadId }));
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
    role: "listbox",
    "aria-label": options.label,
    "aria-orientation": orientation,
    "aria-activedescendant": activeDescendant,
    "data-ui": component,
    onkeydown: onKeyDown,
  });

  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<div
    id=${options.id}
    role="listbox"
    aria-label=${options.label}
    aria-orientation=${orientation}
    aria-activedescendant=${activeDescendant}
    onkeydown=${onKeyDown}
  >
    ${options.content}
  </div>`;
}

export interface OptionOptions<Value extends string = string, E = never, R = never>
  extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.RefSubject<State<Value>, E, R>;
  readonly id: RequiredString;
  readonly value: AnyValue<Value>;
  readonly content: AnyContent;
  readonly disabled?: OptionalBoolean;
}

export function Option<
  const Value extends string,
  const E,
  const R,
  const Opts extends OptionOptions<Value, NoInfer<E>, NoInfer<R>>,
>(options: Opts & Pick<OptionOptions<Value, E, R>, "state">): Component<Opts> {
  return gen(function* () {
    const id = yield* makeRef(options.id);
    const value = yield* makeRef(options.value);
    const disabledValue = yield* makeRef(options.disabled ?? false);
    const disabled = isDisabled(disabledValue);
    const selected = isSelected(options.state, value);
    const onClick = EventHandler.make(() =>
      Effect.gen(function* () {
        if (yield* disabled) return;
        yield* select(options.state, yield* id, yield* value);
      }),
    );
    const props = {
      id,
      "data-value": value,
      role: "option",
      "data-ui-item": "typed/ui/Listbox.Option",
      "aria-disabled": boolString(disabled),
      "aria-selected": selected,
      tabindex: RefSubject.mapEffect(options.state, (state) =>
        Effect.gen(function* () {
          const itemId = yield* id;
          const itemDisabled = yield* disabled;
          return state.virtualFocus || itemDisabled ? -1 : state.activeId === itemId ? 0 : -1;
        }),
      ),
      "data-active": dataActive(options.state, id, disabled),
      "data-disabled": boolString(disabled),
      "data-selected": dataSelected(options.state, value, disabled),
      onclick: onClick,
    } as const;

    if (options.host) return options.host(Dom.mergeProps(options.props, props), options.content) as Component<Opts>;
    return html`<div ...${props}>${options.content}</div>`;
  });
}

function isSelected<Value extends string, E, R, E2, R2>(
  state: RefSubject.RefSubject<State<Value>, E, R>,
  value: RefSubject.Computed<Value, E2, R2>,
) {
  return RefSubject.mapEffect(state, (current) =>
    Effect.map(value, (value) => current.value === value),
  );
}

function dataActive<Value extends string, E, R, E2, R2, E3, R3>(
  state: RefSubject.RefSubject<State<Value>, E, R>,
  id: RefSubject.Computed<string, E2, R2>,
  _disabled: RefSubject.Computed<boolean, E3, R3>,
) {
  return RefSubject.mapEffect(state, (current) =>
    Effect.map(id, (itemId) => DataAttr.boolean(current.activeId === itemId)),
  );
}

function dataSelected<Value extends string, E, R, E2, R2, E3, R3>(
  state: RefSubject.RefSubject<State<Value>, E, R>,
  value: RefSubject.Computed<Value, E2, R2>,
  _disabled: RefSubject.Computed<boolean, E3, R3>,
) {
  return RefSubject.mapEffect(state, (current) =>
    Effect.map(value, (itemValue) => DataAttr.boolean(current.value === itemValue)),
  );
}

function isDisabled<E, R>(disabled: RefSubject.Computed<boolean | undefined, E, R>) {
  return RefSubject.map(disabled, (value) => value === true);
}

function boolString<E, R>(value: RefSubject.Computed<boolean, E, R>) {
  return RefSubject.map(value, String);
}
