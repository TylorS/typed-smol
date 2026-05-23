import * as Effect from "effect/Effect";
import type * as Context from "effect/Context";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { gen } from "@typed/fx/Fx";
import { EventHandler, html } from "@typed/template";
import * as Collection from "./Collection.js";
import * as Composite from "./Composite.js";
import * as DataAttr from "./DataAttr.js";
import * as Dom from "./Dom.js";
import * as Form from "./Form.js";
import * as NativePopover from "./NativePopover.js";
import { makeRef, type Component, type Content, type Value as ReactiveValue } from "./Reactive.js";

type AnyContent = Content;
type RequiredString = ReactiveValue<string, any, any>;
type OptionalBoolean = ReactiveValue<boolean | undefined, any, any>;

export type Mode = "auto" | "hint" | "manual";

export interface State<Value extends string = string> {
  readonly id: string;
  readonly value: Value | null;
  readonly activeId: string | null;
  readonly open: boolean;
  readonly orientation: Composite.Orientation;
  readonly loop: boolean;
  readonly rtl: boolean;
  readonly virtualFocus: boolean;
  readonly mode: Mode;
}

export interface InitialState<Value extends string = string> {
  readonly id: string;
  readonly value?: Value | null;
  readonly activeId?: string | null;
  readonly open?: boolean;
  readonly orientation?: Composite.Orientation;
  readonly loop?: boolean;
  readonly rtl?: boolean;
  readonly virtualFocus?: boolean;
  readonly mode?: Mode;
}

export interface Item<Value extends string = string> extends Collection.Item<Value> {
  readonly value: Value;
}

export const data = DataAttr.schema({
  open: Schema.Boolean,
  mode: Schema.Literals(["auto", "hint", "manual"]),
});

export const optionData = DataAttr.schema({
  active: Schema.Boolean,
  disabled: Schema.Boolean,
  selected: Schema.Boolean,
});

const formBindings = new WeakMap<object, ReadonlyArray<SelectFormBinding>>();
const hiddenInputRefs = new WeakMap<object, unknown>();

interface SelectFormBinding {
  readonly setValue: (value: unknown) => Effect.Effect<void, never, never>;
}

export function makeState<Value extends string = string>(
  initial: InitialState<NoInfer<Value>>,
): Effect.Effect<RefSubject.RefSubject<State<Value>>, never, Scope.Scope> {
  const state: State<Value> = {
    id: initial.id,
    value: initial.value ?? null,
    activeId: initial.activeId ?? null,
    open: initial.open ?? false,
    orientation: initial.orientation ?? "vertical",
    loop: initial.loop ?? true,
    rtl: initial.rtl ?? false,
    virtualFocus: initial.virtualFocus ?? false,
    mode: initial.mode ?? "auto",
  };

  return RefSubject.make(state);
}

export function setOpen<Value extends string, E, R>(
  state: RefSubject.RefSubject<State<Value>, E, R>,
  open: boolean,
): Effect.Effect<State<Value>, E, R> {
  return NativePopover.setOpen(state, open);
}

export function select<Value extends string, E, R>(
  state: RefSubject.RefSubject<State<Value>, E, R>,
  activeId: string,
  value: Value,
): Effect.Effect<State<Value>, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, activeId, open: false, value })).pipe(
    Effect.tap(() => syncFormBindings(state, value)),
  );
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

export interface TriggerOptions<Value extends string = string, E = never, R = never>
  extends Dom.HostOptions<HTMLButtonElement> {
  readonly state: RefSubject.RefSubject<State<Value>, E, R>;
  readonly content: AnyContent;
}

export function Trigger<
  const Value extends string,
  const E,
  const R,
  const Opts extends TriggerOptions<Value, NoInfer<E>, NoInfer<R>>,
>(options: Opts & Pick<TriggerOptions<Value, E, R>, "state">): Component<Opts> {
  const id = RefSubject.map(options.state, (current) => current.id);
  const open = dataOpen(options.state);
  const props = {
    type: "button",
    popovertarget: id,
    popovertargetaction: "toggle",
    "aria-haspopup": "listbox",
    "aria-expanded": open,
    ".data": { open },
  } as const;

  return Dom.renderHost<HTMLButtonElement, Opts>(options, props, options.content, (props, content) => {
    const split = Dom.splitRef(props);
    return html`<button ...${split.props} ref=${split.ref}>${content}</button>`;
  });
}

export const Select = Trigger;

export interface ContentOptions<Value extends string = string, E = never, R = never>
  extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.RefSubject<State<Value>, E, R>;
  readonly content: AnyContent;
  readonly items?: readonly Item<Value>[];
  readonly label?: RequiredString;
}

export function Content<
  const Value extends string,
  const E,
  const R,
  const Opts extends ContentOptions<Value, NoInfer<E>, NoInfer<R>>,
>(options: Opts & Pick<ContentOptions<Value, E, R>, "state">): Component<Opts> {
  const id = RefSubject.map(options.state, (current) => current.id);
  const mode = dataMode(options.state);
  const open = dataOpen(options.state);
  const orientation = RefSubject.map(options.state, (current) => current.orientation);
  const activeDescendant = RefSubject.map(options.state, (current) =>
    current.virtualFocus && current.activeId ? current.activeId : undefined,
  );
  const onToggle = EventHandler.make((event: ToggleEventLike) =>
    NativePopover.syncToggle(options.state, event),
  );
  const items = options.items;
  const onKeyDown =
    items === undefined
      ? undefined
      : EventHandler.make((event: KeyboardEvent) =>
          Effect.gen(function* () {
            const current = yield* options.state;
            const typeaheadKey = Composite.typeaheadKey(event);
            const typeaheadId =
              typeaheadKey &&
              Composite.typeahead(items, typeaheadKey, (item) => item.textValue ?? item.value);

            if (typeaheadId) {
              event.preventDefault();
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
    id,
    role: "listbox",
    popover: mode,
    "aria-label": options.label,
    "aria-orientation": orientation,
    "aria-activedescendant": activeDescendant,
    ".data": { open },
    ontoggle: onToggle,
    onkeydown: onKeyDown,
    ref: NativePopover.register(options.state),
  } as const;

  return Dom.renderHost<HTMLDivElement, Opts>(options, props, options.content, (props, content) => {
    const split = Dom.splitRef(props);
    return html`<div ...${split.props} ref=${split.ref}>${content}</div>`;
  });
}

export const Popover = Content;
export const List = Content;

export interface OptionOptions<Value extends string = string, E = never, R = never>
  extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.RefSubject<State<Value>, E, R>;
  readonly id: RequiredString;
  readonly value: ReactiveValue<Value, any, any>;
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
    const onClick = EventHandler.make((event: Event) =>
      Effect.gen(function* () {
        if (yield* disabled) return;
        yield* select(options.state, yield* id, yield* value);
        yield* NativePopover.hideFromEvent(options.state, event);
      }),
    );
    const props = {
      id,
      "data-value": value,
      role: "option",
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

    return Dom.renderHost<HTMLDivElement, Opts>(options, props, options.content, (props, content) => {
      const split = Dom.splitRef(props);
      return html`<div ...${split.props} ref=${split.ref}>${content}</div>`;
    });
  });
}

export const Item = Option;

export function Label<
  const Opts extends {
    readonly for?: RequiredString;
    readonly content: AnyContent;
  } & Dom.HostOptions<HTMLLabelElement>,
>(options: Opts): Component<Opts> {
  return Dom.renderHost<HTMLLabelElement, Opts>(
    options,
    { for: options.for },
    options.content,
    (props, content) => html`<label ...${props}>${content}</label>`,
  );
}

export function Value<
  const E,
  const R,
  const Opts extends {
    readonly state: RefSubject.RefSubject<State, NoInfer<E>, NoInfer<R>>;
  } & Dom.HostOptions<HTMLSpanElement>,
>(
  options: Opts & { readonly state: RefSubject.RefSubject<State, E, R> },
): Component<Opts> {
  const value = RefSubject.map(options.state, (state) => state.value ?? "");
  return Dom.renderHost<HTMLSpanElement, Opts>(options, {}, value, (props, content) =>
    html`<span ...${props}>${content}</span>`,
  );
}

export interface HiddenInputOptions<
  Value extends string = string,
  Values extends {} = Record<string, unknown>,
  E = never,
  R = never,
  E2 = never,
  R2 = never,
>
  extends Dom.HostOptions<HTMLInputElement> {
  readonly state: RefSubject.RefSubject<State<Value>, E, R>;
  readonly name: ReactiveValue<string | (keyof NoInfer<Values> & string), any, any>;
  readonly formState?: RefSubject.RefSubject<Form.State<Values>, E2, R2>;
  readonly form?: ReactiveValue<string | undefined, any, any>;
  readonly disabled?: OptionalBoolean;
  readonly required?: OptionalBoolean;
}

export function HiddenInput<
  const Value extends string,
  const Values extends {},
  const E,
  const R,
  const E2,
  const R2,
  const Opts extends HiddenInputOptions<Value, Values, NoInfer<E>, NoInfer<R>, NoInfer<E2>, NoInfer<R2>>,
>(
  options: Opts & Pick<HiddenInputOptions<Value, Values, E, R, E2, R2>, "state" | "formState">,
): Component<Opts> {
  const value = RefSubject.map(options.state, (state) => state.value ?? "");
  const register = hiddenInputRef<Value, Values, E, R, E2, R2>(options);
  const props = {
    type: "hidden",
    name: options.name,
    form: options.form,
    ".value": value,
    "?disabled": options.disabled ?? false,
    "?required": options.required ?? false,
    ref: register,
  } as const;

  return Dom.renderHost<HTMLInputElement, Opts>(options, props, "", (props) => {
    const split = Dom.splitRef(props);
    return html`<input ...${split.props} ref=${split.ref} />`;
  });
}

export function Arrow<
  const Opts extends { readonly content?: AnyContent } & Dom.HostOptions<HTMLSpanElement>,
>(
  options = {} as Opts,
): Component<Opts> {
  return Dom.renderHost<HTMLSpanElement, Opts>(
    options,
    { "aria-hidden": "true" },
    options.content ?? "▾",
    (props, content) => html`<span ...${props}>${content}</span>`,
  );
}

export function Dismiss<
  const E,
  const R,
  const Opts extends {
    readonly state: RefSubject.RefSubject<State, NoInfer<E>, NoInfer<R>>;
    readonly content: AnyContent;
  } & Dom.HostOptions<HTMLButtonElement>,
>(options: Opts & { readonly state: RefSubject.RefSubject<State, E, R> }): Component<Opts> {
  const id = RefSubject.map(options.state, (current) => current.id);
  const onClick = EventHandler.make((event: Event) =>
    NativePopover.hideFromEvent(options.state, event),
  );
  return Dom.renderHost<HTMLButtonElement, Opts>(
    options,
    { type: "button", popovertarget: id, popovertargetaction: "hide", onclick: onClick },
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}

export function Group<
  const Opts extends {
    readonly content: AnyContent;
    readonly label?: RequiredString;
  } & Dom.HostOptions<HTMLDivElement>,
>(options: Opts): Component<Opts> {
  return Dom.renderHost<HTMLDivElement, Opts>(
    options,
    { role: "group", "aria-label": options.label },
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}

export function GroupLabel<
  const Opts extends { readonly content: AnyContent } & Dom.HostOptions<HTMLSpanElement>,
>(
  options: Opts,
): Component<Opts> {
  return Dom.renderHost<HTMLSpanElement, Opts>(options, {}, options.content, (props, content) =>
    html`<span ...${props}>${content}</span>`,
  );
}

export function Heading<
  const Opts extends {
    readonly content: AnyContent;
    readonly id?: RequiredString;
  } & Dom.HostOptions<HTMLDivElement>,
>(options: Opts): Component<Opts> {
  return Dom.renderHost<HTMLDivElement, Opts>(
    options,
    { id: options.id, role: "heading", "aria-level": "1" },
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}

export function ItemCheck<
  const Opts extends {
    readonly selected: ReactiveValue<boolean, any, any>;
    readonly content?: AnyContent;
  } & Dom.HostOptions<HTMLSpanElement>,
>(options: Opts): Component<Opts> {
  return gen(function* () {
    const selected = yield* makeRef(options.selected);
    const hidden = RefSubject.map(selected, (value) => !value);
    return Dom.renderHost<HTMLSpanElement, Opts>(
      options,
      { "aria-hidden": "true", "?hidden": hidden },
      options.content ?? "✓",
      (props, content) => html`<span ...${props}>${content}</span>`,
    );
  });
}

export function Row<
  const Opts extends { readonly content: AnyContent } & Dom.HostOptions<HTMLDivElement>,
>(
  options: Opts,
): Component<Opts> {
  return Dom.renderHost<HTMLDivElement, Opts>(options, { role: "row" }, options.content, (props, content) =>
    html`<div ...${props}>${content}</div>`,
  );
}

export function Separator<const Opts extends Dom.HostOptions<HTMLDivElement> = {}>(
  options = {} as Opts,
): Component<Opts> {
  return Dom.renderHost<HTMLDivElement, Opts>(options, { role: "separator" }, "", (props) =>
    html`<div ...${props}></div>`,
  );
}

interface ToggleEventLike extends Event {
  readonly newState?: string;
}

function dataOpen<Value extends string, E, R>(state: RefSubject.RefSubject<State<Value>, E, R>) {
  return RefSubject.mapEffect(state, (value) =>
    DataAttr.encode(data, value).pipe(Effect.map((encoded) => encoded.open ?? "false")),
  );
}

function dataMode<Value extends string, E, R>(state: RefSubject.RefSubject<State<Value>, E, R>) {
  return RefSubject.mapEffect(state, (value) =>
    DataAttr.encode(data, value).pipe(Effect.map((encoded) => encoded.mode ?? "auto")),
  );
}

function dataActive<Value extends string, E, R, E2, R2, E3, R3>(
  state: RefSubject.RefSubject<State<Value>, E, R>,
  id: RefSubject.Computed<string, E2, R2>,
  disabled: RefSubject.Computed<boolean, E3, R3>,
) {
  return RefSubject.mapEffect(state, (current) =>
    Effect.gen(function* () {
      const itemId = yield* id;
      const itemDisabled = yield* disabled;
      const encoded = yield* DataAttr.encode(optionData, {
        active: current.activeId === itemId,
        disabled: itemDisabled,
        selected: false,
      });
      return encoded.active ?? "false";
    }),
  );
}

function isSelected<Value extends string, E, R, E2, R2>(
  state: RefSubject.RefSubject<State<Value>, E, R>,
  value: RefSubject.Computed<Value, E2, R2>,
) {
  return RefSubject.mapEffect(state, (current) =>
    Effect.map(value, (value) => current.value === value),
  );
}

function dataSelected<Value extends string, E, R, E2, R2, E3, R3>(
  state: RefSubject.RefSubject<State<Value>, E, R>,
  value: RefSubject.Computed<Value, E2, R2>,
  disabled: RefSubject.Computed<boolean, E3, R3>,
) {
  return RefSubject.mapEffect(state, (current) =>
    Effect.gen(function* () {
      const itemValue = yield* value;
      const itemDisabled = yield* disabled;
      const encoded = yield* DataAttr.encode(optionData, {
        active: false,
        disabled: itemDisabled,
        selected: current.value === itemValue,
      });
      return encoded.selected ?? "false";
    }),
  );
}

function isDisabled<E, R>(disabled: RefSubject.Computed<boolean | undefined, E, R>) {
  return RefSubject.map(disabled, (value) => value === true);
}

function boolString<E, R>(value: RefSubject.Computed<boolean, E, R>) {
  return RefSubject.map(value, String);
}

function registerFormBinding<Value extends string, Values extends {}, E, R, E2, R2>(
  selectState: RefSubject.RefSubject<State<Value>, E, R>,
  formState: RefSubject.RefSubject<Form.State<Values>, E2, R2>,
  name: keyof Values & string,
  context: Context.Context<R2>,
): void {
  const current = formBindings.get(selectState) ?? [];
  formBindings.set(
    selectState,
    current.concat({
      setValue: (value) =>
        Form.setValue(formState, name, value).pipe(
          Effect.provide(context),
          Effect.orDie,
          Effect.asVoid,
        ),
    }),
  );
}

function hiddenInputRef<Value extends string, Values extends {}, E, R, E2, R2>(
  options: HiddenInputOptions<Value, Values, E, R, E2, R2>,
): Dom.ElementRef<HTMLInputElement>["ref"] | undefined {
  const formState = options.formState;
  if (!formState) return undefined;

  return (element) =>
    Effect.gen(function* () {
      if (hiddenInputRefs.get(element) === formState) return;
      hiddenInputRefs.set(element, formState);
      const nameRef = yield* makeRef(options.name);
      const name = yield* nameRef;
      const context = yield* Effect.context<R2>();
      const fieldName = name as keyof Values & string;
      registerFormBinding(options.state, formState, fieldName, context);

      const current = yield* options.state;
      if (current.value !== null) {
        yield* Form.setValue(formState, fieldName, current.value);
      }
    });
}

function syncFormBindings<Value extends string, E, R>(
  selectState: RefSubject.RefSubject<State<Value>, E, R>,
  value: Value,
): Effect.Effect<void> {
  const bindings = formBindings.get(selectState) ?? [];
  return Effect.all(
    bindings.map((binding) => binding.setValue(value)),
    { concurrency: "unbounded" },
  ).pipe(Effect.asVoid);
}
