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

const formBindings = new WeakMap<object, ReadonlyArray<SelectFormBinding<any>>>();
const hiddenInputRefs = new WeakMap<object, unknown>();

interface SelectFormBinding<Values extends Record<string, unknown>> {
  readonly state: RefSubject.RefSubject<Form.State<Values>>;
  readonly name: keyof Values & string;
}

export function makeState<Value extends string = string>(
  initial: InitialState<Value>,
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

export function setOpen<Value extends string>(
  state: RefSubject.RefSubject<State<Value>>,
  open: boolean,
): Effect.Effect<State<Value>> {
  return NativePopover.setOpen(state, open);
}

export function select<Value extends string>(
  state: RefSubject.RefSubject<State<Value>>,
  activeId: string,
  value: Value,
): Effect.Effect<State<Value>> {
  return RefSubject.update(state, (current) => ({ ...current, activeId, open: false, value })).pipe(
    Effect.tap(() => syncFormBindings(state, value)),
  );
}

export function move<Value extends string>(
  state: RefSubject.RefSubject<State<Value>>,
  items: readonly Item<Value>[],
  direction: Composite.Move,
): Effect.Effect<State<Value>> {
  return Effect.gen(function* () {
    const current = yield* state;
    const activeId = Composite.moveActiveId(items, current, direction);
    return yield* RefSubject.update(state, (value) => ({ ...value, activeId }));
  });
}

export interface TriggerOptions<Value extends string = string>
  extends Dom.HostOptions<HTMLButtonElement> {
  readonly state: RefSubject.RefSubject<State<Value>>;
  readonly content: AnyContent;
}

export function Trigger<const Opts extends TriggerOptions>(options: Opts): Component<Opts> {
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

export interface ContentOptions<Value extends string = string> extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.RefSubject<State<Value>>;
  readonly content: AnyContent;
  readonly items?: readonly Item<Value>[];
  readonly label?: RequiredString;
}

export function Content<const Opts extends ContentOptions>(options: Opts): Component<Opts> {
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

export interface OptionOptions<Value extends string = string> extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.RefSubject<State<Value>>;
  readonly id: RequiredString;
  readonly value: ReactiveValue<Value, any, any>;
  readonly content: AnyContent;
  readonly disabled?: OptionalBoolean;
}

export function Option<const Opts extends OptionOptions>(options: Opts): Component<Opts> {
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
  const Opts extends { readonly for?: RequiredString; readonly content: AnyContent },
>(options: Opts): Component<Opts> {
  return html`<label for=${options.for}>${options.content}</label>`;
}

export function Value<const Opts extends { readonly state: RefSubject.RefSubject<State> }>(
  options: Opts,
): Component<Opts> {
  return html`${RefSubject.map(options.state, (state) => state.value ?? "")}`;
}

export interface HiddenInputOptions<Value extends string = string>
  extends Dom.HostOptions<HTMLInputElement> {
  readonly state: RefSubject.RefSubject<State<Value>>;
  readonly name: RequiredString;
  readonly formState?: RefSubject.RefSubject<Form.State<Record<string, unknown>>>;
  readonly form?: ReactiveValue<string | undefined, any, any>;
  readonly disabled?: OptionalBoolean;
  readonly required?: OptionalBoolean;
}

export function HiddenInput<const Opts extends HiddenInputOptions>(options: Opts): Component<Opts> {
  const value = RefSubject.map(options.state, (state) => state.value ?? "");
  const register = hiddenInputRef(options);
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

export function Arrow<const Opts extends { readonly content?: AnyContent }>(
  options = {} as Opts,
): Component<Opts> {
  return html`<span aria-hidden="true">${options.content ?? "▾"}</span>`;
}

export function Dismiss<
  const Opts extends { readonly state: RefSubject.RefSubject<State>; readonly content: AnyContent },
>(options: Opts): Component<Opts> {
  const id = RefSubject.map(options.state, (current) => current.id);
  const onClick = EventHandler.make((event: Event) =>
    NativePopover.hideFromEvent(options.state, event),
  );
  return html`<button
    type="button"
    popovertarget=${id}
    popovertargetaction="hide"
    onclick=${onClick}
  >
    ${options.content}
  </button>`;
}

export function Group<
  const Opts extends { readonly content: AnyContent; readonly label?: RequiredString },
>(options: Opts): Component<Opts> {
  return html`<div role="group" aria-label=${options.label}>${options.content}</div>`;
}

export function GroupLabel<const Opts extends { readonly content: AnyContent }>(
  options: Opts,
): Component<Opts> {
  return html`<span>${options.content}</span>`;
}

export function Heading<
  const Opts extends { readonly content: AnyContent; readonly id?: RequiredString },
>(options: Opts): Component<Opts> {
  return html`<div id=${options.id} role="heading" aria-level="1">${options.content}</div>`;
}

export function ItemCheck<
  const Opts extends {
    readonly selected: ReactiveValue<boolean, any, any>;
    readonly content?: AnyContent;
  },
>(options: Opts): Component<Opts> {
  return gen(function* () {
    const selected = yield* makeRef(options.selected);
    const hidden = RefSubject.map(selected, (value) => !value);
    return html`<span aria-hidden="true" ?hidden=${hidden}>${options.content ?? "✓"}</span>`;
  });
}

export function Row<const Opts extends { readonly content: AnyContent }>(
  options: Opts,
): Component<Opts> {
  return html`<div role="row">${options.content}</div>`;
}

export function Separator(): Component<{}> {
  return html`<div role="separator"></div>`;
}

interface ToggleEventLike extends Event {
  readonly newState?: string;
}

function dataOpen<Value extends string>(state: RefSubject.RefSubject<State<Value>>) {
  return RefSubject.mapEffect(state, (value) =>
    DataAttr.encode(data, value).pipe(Effect.map((encoded) => encoded.open ?? "false")),
  );
}

function dataMode<Value extends string>(state: RefSubject.RefSubject<State<Value>>) {
  return RefSubject.mapEffect(state, (value) =>
    DataAttr.encode(data, value).pipe(Effect.map((encoded) => encoded.mode ?? "auto")),
  );
}

function dataActive<Value extends string>(
  state: RefSubject.RefSubject<State<Value>>,
  id: RefSubject.Computed<string, any, any>,
  disabled: RefSubject.Computed<boolean, any, any>,
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

function isSelected<Value extends string>(
  state: RefSubject.RefSubject<State<Value>>,
  value: RefSubject.Computed<Value, any, any>,
) {
  return RefSubject.mapEffect(state, (current) =>
    Effect.map(value, (value) => current.value === value),
  );
}

function dataSelected<Value extends string>(
  state: RefSubject.RefSubject<State<Value>>,
  value: RefSubject.Computed<Value, any, any>,
  disabled: RefSubject.Computed<boolean, any, any>,
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

function isDisabled(disabled: RefSubject.Computed<boolean | undefined, any, any>) {
  return RefSubject.map(disabled, (value) => value === true);
}

function boolString(value: RefSubject.Computed<boolean, any, any>) {
  return RefSubject.map(value, String);
}

function registerFormBinding<Values extends Record<string, unknown>>(
  selectState: RefSubject.RefSubject<State>,
  formState: RefSubject.RefSubject<Form.State<Values>>,
  name: keyof Values & string,
): void {
  const current = formBindings.get(selectState) ?? [];
  formBindings.set(selectState, current.concat({ state: formState, name }));
}

function hiddenInputRef<const Opts extends HiddenInputOptions>(
  options: Opts,
): Dom.ElementRef<HTMLInputElement>["ref"] | undefined {
  if (!options.formState) return undefined;

  return (element) => {
    if (hiddenInputRefs.get(element) === options.formState) return;
    hiddenInputRefs.set(element, options.formState);
    registerFormBinding(options.state, options.formState!, options.name as string);

    void Effect.runPromise(
      Effect.gen(function* () {
        const current = yield* options.state;
        if (current.value !== null) {
          yield* Form.setValue(options.formState!, options.name as string, current.value);
        }
      }),
    );
  };
}

function syncFormBindings<Value extends string>(
  selectState: RefSubject.RefSubject<State<Value>>,
  value: Value,
): Effect.Effect<void> {
  const bindings = formBindings.get(selectState) ?? [];
  return Effect.all(
    bindings.map((binding) => Form.setValue(binding.state, binding.name, value)),
    { concurrency: "unbounded" },
  ).pipe(Effect.asVoid);
}
