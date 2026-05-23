import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import type * as Scope from "effect/Scope";
import { RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";
import type { Component, Content, Value as ReactiveValue } from "./Reactive.js";

export interface State<Values extends Record<string, unknown> = Record<string, unknown>> {
  readonly values: Values;
  readonly defaultValues: Values;
  readonly errors: Partial<Record<keyof Values & string, string>>;
  readonly submitting: boolean;
  readonly schema?: Schema.Schema<Values>;
}

export interface InitialState<Values extends Record<string, unknown> = Record<string, unknown>> {
  readonly values: Values;
  readonly defaultValues?: Values;
  readonly errors?: Partial<Record<keyof Values & string, string>>;
  readonly submitting?: boolean;
  readonly schema?: Schema.Schema<Values>;
}

export function makeState<Values extends Record<string, unknown>>(
  initial: InitialState<Values>,
): Effect.Effect<RefSubject.RefSubject<State<Values>>, never, Scope.Scope> {
  const state: State<Values> = {
    values: initial.values,
    defaultValues: initial.defaultValues ?? initial.values,
    errors: initial.errors ?? {},
    submitting: initial.submitting ?? false,
    schema: initial.schema,
  };

  return RefSubject.make(state);
}

export function setValue<Values extends Record<string, unknown>>(
  state: RefSubject.RefSubject<State<Values>>,
  name: keyof Values & string,
  value: unknown,
): Effect.Effect<State<Values>> {
  return RefSubject.update(state, (current) => ({
    ...current,
    values: { ...current.values, [name]: value },
  }));
}

export function validate<Values extends Record<string, unknown>>(
  state: RefSubject.RefSubject<State<Values>>,
): Effect.Effect<Values, Schema.SchemaError, any> {
  return Effect.gen(function* () {
    const current = yield* state;
    if (!current.schema) {
      yield* RefSubject.update(state, (value) => ({ ...value, errors: {} }));
      return current.values;
    }

    const decoded = yield* Schema.decodeUnknownEffect(current.schema)(current.values).pipe(
      Effect.tapError((error) =>
        RefSubject.update(state, (value) => ({
          ...value,
          errors: errorsForValues(value.values, error),
        })),
      ),
    );

    yield* RefSubject.update(state, (value) => ({ ...value, values: decoded, errors: {} }));
    return decoded;
  });
}

export function reset<Values extends Record<string, unknown>>(
  state: RefSubject.RefSubject<State<Values>>,
): Effect.Effect<State<Values>> {
  return RefSubject.update(state, (current) => ({
    ...current,
    values: current.defaultValues,
    errors: {},
    submitting: false,
  }));
}

export type ArrayFieldName<Values extends Record<string, unknown>> = {
  readonly [Name in keyof Values & string]: Values[Name] extends readonly unknown[] ? Name : never;
}[keyof Values & string];

export type ArrayFieldValue<
  Values extends Record<string, unknown>,
  Name extends ArrayFieldName<Values>,
> = Values[Name] extends readonly (infer Value)[] ? Value : never;

export function pushValue<
  Values extends Record<string, unknown>,
  Name extends ArrayFieldName<Values>,
>(
  state: RefSubject.RefSubject<State<Values>>,
  name: Name,
  value: ArrayFieldValue<Values, Name>,
): Effect.Effect<State<Values>> {
  return RefSubject.update(state, (current) => {
    const currentValue = current.values[name];
    const values = Array.isArray(currentValue) ? currentValue.concat(value) : [value];
    return { ...current, values: { ...current.values, [name]: values } };
  });
}

export function removeValue<
  Values extends Record<string, unknown>,
  Name extends ArrayFieldName<Values>,
>(
  state: RefSubject.RefSubject<State<Values>>,
  name: Name,
  index: number,
): Effect.Effect<State<Values>> {
  return RefSubject.update(state, (current) => {
    const currentValue = current.values[name];
    const values = Array.isArray(currentValue)
      ? currentValue.filter((_, valueIndex) => valueIndex !== index)
      : [];
    return { ...current, values: { ...current.values, [name]: values } };
  });
}

export interface FormOptions<Values extends Record<string, unknown> = Record<string, unknown>> {
  readonly state: RefSubject.RefSubject<State<Values>>;
  readonly content: Content;
  readonly onsubmit?: Parameters<typeof EventHandler.fromEffectOrEventHandler>[0];
}

export function Form<
  const Values extends Record<string, unknown>,
  const Opts extends FormOptions<Values>,
>(options: Opts): Component<Opts> {
  const onSubmit = options.onsubmit
    ? EventHandler.fromEffectOrEventHandler(options.onsubmit)
    : EventHandler.make((event: SubmitEvent) => Effect.sync(() => event.preventDefault()));

  return html`<form onsubmit=${onSubmit}>${options.content}</form>`;
}

export interface InputOptions<
  Values extends Record<string, unknown> = Record<string, unknown>,
  Name extends keyof Values & string = keyof Values & string,
> {
  readonly state: RefSubject.RefSubject<State<Values>>;
  readonly name: Name;
  readonly id?: ReactiveValue<string | undefined, any, any>;
  readonly type?: ReactiveValue<string | undefined, any, any>;
}

export function Input<
  const Values extends Record<string, unknown>,
  const Name extends keyof Values & string,
  const Opts extends InputOptions<Values, Name>,
>(options: Opts): Component<Opts> {
  const value = RefSubject.map(options.state, (state) => String(state.values[options.name] ?? ""));
  const describedBy = RefSubject.map(options.state, (state) =>
    state.errors[options.name] ? `${options.name}-error` : undefined,
  );
  const onInput = EventHandler.make((event: InputEventLike) =>
    setValue(options.state, options.name, event.currentTarget.value),
  );

  return html`<input
    id=${options.id}
    name=${options.name}
    type=${options.type ?? "text"}
    aria-describedby=${describedBy}
    .value=${value}
    oninput=${onInput}
  />`;
}

export interface LabelOptions {
  readonly content: Content;
  readonly for?: ReactiveValue<string | undefined, any, any>;
}

export function Label<const Opts extends LabelOptions>(options: Opts): Component<Opts> {
  return html`<label for=${options.for}>${options.content}</label>`;
}

export function Description<const Opts extends { readonly id?: string; readonly content: Content }>(
  options: Opts,
): Component<Opts> {
  return html`<div id=${options.id}>${options.content}</div>`;
}

export interface ErrorOptions<
  Values extends Record<string, unknown> = Record<string, unknown>,
  Name extends keyof Values & string = keyof Values & string,
> {
  readonly state: RefSubject.RefSubject<State<Values>>;
  readonly name: Name;
}

export function Error<
  const Values extends Record<string, unknown>,
  const Name extends keyof Values & string,
  const Opts extends ErrorOptions<Values, Name>,
>(options: Opts): Component<Opts> {
  const id = `${options.name}-error`;
  return html`<div id=${id} role="alert">
    ${RefSubject.map(options.state, (state) => state.errors[options.name] ?? "")}
  </div>`;
}

export function Submit<const Opts extends { readonly content: Content }>(
  options: Opts,
): Component<Opts> {
  return html`<button type="submit">${options.content}</button>`;
}

export function Reset<const Opts extends { readonly content: Content }>(
  options: Opts,
): Component<Opts> {
  return html`<button type="reset">${options.content}</button>`;
}

export interface PushOptions<
  Values extends Record<string, unknown> = Record<string, unknown>,
  Name extends ArrayFieldName<Values> = ArrayFieldName<Values>,
> {
  readonly state: RefSubject.RefSubject<State<Values>>;
  readonly name: Name;
  readonly value: ArrayFieldValue<Values, Name>;
  readonly content: Content;
}

export function Push<
  const Values extends Record<string, unknown>,
  const Name extends ArrayFieldName<Values>,
  const Opts extends PushOptions<Values, Name>,
>(options: Opts): Component<Opts> {
  const onClick = EventHandler.make(() => pushValue(options.state, options.name, options.value));
  return html`<button type="button" onclick=${onClick}>${options.content}</button>`;
}

export interface RemoveOptions<
  Values extends Record<string, unknown> = Record<string, unknown>,
  Name extends ArrayFieldName<Values> = ArrayFieldName<Values>,
> {
  readonly state: RefSubject.RefSubject<State<Values>>;
  readonly name: Name;
  readonly index: ReactiveValue<number, any, any>;
  readonly content: Content;
}

export function Remove<
  const Values extends Record<string, unknown>,
  const Name extends ArrayFieldName<Values>,
  const Opts extends RemoveOptions<Values, Name>,
>(options: Opts): Component<Opts> {
  const onClick = EventHandler.make(() => {
    if (typeof options.index === "number") {
      return removeValue(options.state, options.name, options.index);
    }

    return RefSubject.make(options.index).pipe(
      Effect.flatMap((index) =>
        Effect.flatMap(index, (value) => removeValue(options.state, options.name, value)),
      ),
    );
  });
  return html`<button type="button" onclick=${onClick}>${options.content}</button>`;
}

export function Group<const Opts extends { readonly content: Content; readonly label?: string }>(
  options: Opts,
): Component<Opts> {
  return html`<div role="group" aria-label=${options.label}>${options.content}</div>`;
}

export const GroupLabel = Label;
export const Control = Input;
export const Field = Input;
export const Checkbox = Input;
export const Radio = Input;
export const RadioGroup = Group;

interface InputEventLike extends Event {
  readonly currentTarget: HTMLInputElement;
}

function errorsForValues<Values extends Record<string, unknown>>(
  values: Values,
  error: Schema.SchemaError,
): Partial<Record<keyof Values & string, string>> {
  const message = String(error);
  return Object.keys(values).reduce<Partial<Record<keyof Values & string, string>>>(
    (errors, key) => ({ ...errors, [key]: message }),
    {},
  );
}
