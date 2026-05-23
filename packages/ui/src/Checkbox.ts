import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { gen } from "@typed/fx/Fx";
import { EventHandler, html } from "@typed/template";
import * as DataAttr from "./DataAttr.js";
import * as Dom from "./Dom.js";
import { makeRef, type Component, type Content, type Value as ReactiveValue } from "./Reactive.js";

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

type OptionalBoolean = ReactiveValue<boolean | undefined, any, any>;
type OptionalString = ReactiveValue<string | undefined, any, any>;
type RequiredString = ReactiveValue<string, any, any>;

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

export function Input<const E, const R, const Opts extends InputOptions<E, R>>(
  options: Opts,
): Component<Opts> {
  return gen(function* () {
    const disabledValue = yield* makeRef(options.disabled ?? false);
    const requiredValue = yield* makeRef(options.required ?? false);
    const disabled = RefSubject.map(disabledValue, (value) => value === true);
    const required = RefSubject.map(requiredValue, (value) => value === true);
    const checked = RefSubject.map(options.state, (current) => current.checked === true);
    const indeterminate = RefSubject.map(options.state, (current) => current.checked === "mixed");
    const checkedValue = RefSubject.map(options.state, (current) => current.checked);
    const onChange = EventHandler.make((event: CheckboxChangeEvent) =>
      setChecked(options.state, event.currentTarget.checked),
    );

    const props = Dom.mergeProps(options.props, {
      id: options.id,
      name: options.name,
      value: options.value,
      type: "checkbox",
      "aria-checked": checkedValue,
      "?checked": checked,
      "?disabled": disabled,
      "?required": required,
      ".indeterminate": indeterminate,
      ".data": { checked: dataChecked(options.state) },
      onchange: onChange,
    });

    if (options.host) return options.host(props, "") as Component<Opts>;

    return html`<input
      id=${options.id}
      name=${options.name}
      value=${options.value}
      type="checkbox"
      aria-checked=${checkedValue}
      ?checked=${checked}
      ?disabled=${disabled}
      ?required=${required}
      .indeterminate=${indeterminate}
      .data=${{ checked: dataChecked(options.state) }}
      onchange=${onChange}
    />`;
  });
}

export const Checkbox = Input;

export interface LabelOptions extends Dom.HostOptions<HTMLLabelElement> {
  readonly for?: OptionalString;
  readonly content: Content;
}

export function Label<const Opts extends LabelOptions>(options: Opts): Component<Opts> {
  if (options.host) return options.host(Dom.mergeProps(options.props, { for: options.for }), options.content) as Component<Opts>;
  return html`<label for=${options.for}>${options.content}</label>`;
}

export interface CheckOptions<E = never, R = never> extends Dom.HostOptions<HTMLSpanElement> {
  readonly state: RefSubject.RefSubject<State, E, R>;
  readonly content?: Content;
}

export function Check<const Opts extends CheckOptions<any, any> | CheckOptions<never, never> | CheckOptions<any, never> | CheckOptions<never, any>>(
  options: Opts,
): Component<Opts> {
  const hidden = RefSubject.map(options.state, (state) => state.checked !== true);
  if (options.host) return options.host(Dom.mergeProps(options.props, { "aria-hidden": "true", "?hidden": hidden }), options.content ?? "✓") as Component<Opts>;
  return html`<span aria-hidden="true" ?hidden=${hidden}>${options.content ?? "✓"}</span>` as Component<Opts>;
}

interface CheckboxChangeEvent extends Event {
  readonly currentTarget: HTMLInputElement;
}

function dataChecked<E, R>(state: RefSubject.RefSubject<State, E, R>) {
  return RefSubject.mapEffect(state, (value) =>
    DataAttr.encode(data, value).pipe(Effect.map((encoded) => encoded.checked ?? "false")),
  );
}
