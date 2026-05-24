import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { gen } from "@typed/fx/Fx";
import { EventHandler, html } from "@typed/template";
import * as DataAttr from "./DataAttr.js";
import * as Dom from "./Dom.js";
import { makeRef, type AnyContent, type Component, type AnyValue } from "./Reactive.js";

export type Checked = boolean | "mixed";

export interface State {
  readonly checked: Checked;
}

export interface InitialState {
  readonly checked?: Checked;
}

export const data = DataAttr.schema({
  checked: Schema.Union([Schema.Boolean, Schema.Literal("mixed")]),
});

type OptionalBoolean = AnyValue<boolean | undefined>;
type OptionalString = AnyValue<string | undefined>;
type RequiredString = AnyValue<string>;

export function makeState(
  initial: InitialState = {},
): Effect.Effect<RefSubject.RefSubject<State>, never, Scope.Scope> {
  return RefSubject.make({ checked: initial.checked ?? false });
}

export function setChecked<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  checked: Checked,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, checked }));
}

export function toggle<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({
    ...current,
    checked: current.checked === true ? false : true,
  }));
}

export interface InputOptions<E = never, R = never> extends Dom.HostOptions<HTMLInputElement> {
  readonly state: RefSubject.RefSubject<State, E, R>;
  readonly id?: OptionalString;
  readonly name?: OptionalString;
  readonly value?: RequiredString;
  readonly disabled?: OptionalBoolean;
  readonly required?: OptionalBoolean;
}

export interface InputViewOptions extends Dom.HostOptions<HTMLInputElement> {
  readonly id?: OptionalString;
  readonly name?: OptionalString;
  readonly value?: RequiredString;
  readonly disabled?: OptionalBoolean;
  readonly required?: OptionalBoolean;
}

export interface InputViewState<E = never, R = never> {
  readonly checked: RefSubject.Computed<boolean, E, R>;
  readonly checkedValue: RefSubject.Computed<Checked, E, R>;
  readonly indeterminate: RefSubject.Computed<boolean, E, R>;
}

export function Input<const E, const R, const Opts extends InputOptions<NoInfer<E>, NoInfer<R>>>(
  options: Opts & Pick<InputOptions<E, R>, "state">,
): Component<Opts> {
  const state = inputViewState(options.state);
  const onChange = EventHandler.action(
    "setChecked",
    "change",
    (event: CheckboxChangeEvent) => setChecked(options.state, event.currentTarget.checked),
  );

  return InputView(options, state, onChange);
}

export function InputView<
  const Opts extends InputViewOptions,
  const E,
  const R,
  const E2,
  const R2,
>(
  options: Opts,
  state: InputViewState<E, R>,
  onChange: EventHandler.EventHandler<CheckboxChangeEvent, E2, R2>,
): Component<Opts> {
  return gen(function* () {
    const disabled = RefSubject.map(yield* makeRef(options.disabled ?? false), (value) => value === true);
    const required = RefSubject.map(yield* makeRef(options.required ?? false), (value) => value === true);
    const props = inputProps(options, state, disabled, required, onChange);

    return Dom.renderHost<HTMLInputElement, Opts>(options, props, "", (props) => {
      const split = Dom.splitRef(props);
      return html`<input ...${split.props} ref=${split.ref} />`;
    });
  });
}

export const Checkbox = Input;

export interface LabelOptions extends Dom.HostOptions<HTMLLabelElement> {
  readonly for?: OptionalString;
  readonly content: AnyContent;
}

export function Label<const Opts extends LabelOptions>(options: Opts): Component<Opts> {
  return Dom.renderHost<HTMLLabelElement, Opts>(
    options,
    { for: options.for },
    options.content,
    (props, content) => html`<label ...${props}>${content}</label>`,
  );
}

export interface CheckOptions<E = never, R = never> extends Dom.HostOptions<HTMLSpanElement> {
  readonly state: RefSubject.RefSubject<State, E, R>;
  readonly content?: AnyContent;
}

export function Check<const E, const R, const Opts extends CheckOptions<NoInfer<E>, NoInfer<R>>>(
  options: Opts & Pick<CheckOptions<E, R>, "state">,
): Component<Opts> {
  const hidden = RefSubject.map(options.state, (state) => state.checked !== true);
  return Dom.renderHost<HTMLSpanElement, Opts>(
    options,
    { "aria-hidden": "true", "?hidden": hidden },
    options.content ?? "✓",
    (props, content) => html`<span ...${props}>${content}</span>`,
  );
}

export interface CheckboxChangeEvent extends Event {
  readonly currentTarget: HTMLInputElement;
}

export function inputViewState<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
): InputViewState<E, R> {
  return {
    checked: RefSubject.map(state, (current) => current.checked === true),
    checkedValue: RefSubject.map(state, (current) => current.checked),
    indeterminate: RefSubject.map(state, (current) => current.checked === "mixed"),
  };
}

function inputProps<E, R, E2, R2, E3, R3, E4, R4>(
  options: InputViewOptions,
  state: InputViewState<E, R>,
  disabled: RefSubject.Computed<boolean, E3, R3>,
  required: RefSubject.Computed<boolean, E4, R4>,
  onChange: EventHandler.EventHandler<CheckboxChangeEvent, E2, R2>,
): Dom.HostProps<HTMLInputElement> {
  return {
    id: options.id,
    name: options.name,
    value: options.value,
    type: "checkbox",
    "aria-checked": state.checkedValue,
    "?checked": state.checked,
    "?disabled": disabled,
    "?required": required,
    ".indeterminate": state.indeterminate,
    ".data": { checked: dataCheckedValue(state.checkedValue) },
    onchange: onChange,
  };
}

function dataCheckedValue<E, R>(checked: RefSubject.Computed<Checked, E, R>) {
  return RefSubject.map(checked, String);
}
