import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { gen } from "@typed/fx/Fx";
import { EventHandler, html } from "@typed/template";
import * as DataAttr from "./DataAttr.js";
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

export function setChecked(
  state: RefSubject.RefSubject<State>,
  checked: Checked,
): Effect.Effect<State> {
  return RefSubject.update(state, (current) => ({ ...current, checked }));
}

export function toggle(state: RefSubject.RefSubject<State>): Effect.Effect<State> {
  return RefSubject.update(state, (current) => ({
    ...current,
    checked: current.checked === true ? false : true,
  }));
}

export interface InputOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly id?: OptionalString;
  readonly name?: OptionalString;
  readonly value?: RequiredString;
  readonly disabled?: OptionalBoolean;
  readonly required?: OptionalBoolean;
}

export function Input<const Opts extends InputOptions>(options: Opts): Component<Opts> {
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

export interface LabelOptions {
  readonly for?: OptionalString;
  readonly content: Content;
}

export function Label<const Opts extends LabelOptions>(options: Opts): Component<Opts> {
  return html`<label for=${options.for}>${options.content}</label>`;
}

export interface CheckOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly content?: Content;
}

export function Check<const Opts extends CheckOptions>(options: Opts): Component<Opts> {
  const hidden = RefSubject.map(options.state, (state) => state.checked !== true);
  return html`<span aria-hidden="true" ?hidden=${hidden}>${options.content ?? "✓"}</span>`;
}

interface CheckboxChangeEvent extends Event {
  readonly currentTarget: HTMLInputElement;
}

function dataChecked(state: RefSubject.RefSubject<State>) {
  return RefSubject.mapEffect(state, (value) =>
    DataAttr.encode(data, value).pipe(Effect.map((encoded) => encoded.checked ?? "false")),
  );
}
