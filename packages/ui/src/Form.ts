import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import { RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";
import type { Component, Content, Value as ReactiveValue } from "./Reactive.js";

export interface State<Values extends Record<string, unknown> = Record<string, unknown>> {
  readonly values: Values;
  readonly errors: Partial<Record<keyof Values & string, string>>;
  readonly submitting: boolean;
}

export interface InitialState<Values extends Record<string, unknown> = Record<string, unknown>> {
  readonly values: Values;
  readonly errors?: Partial<Record<keyof Values & string, string>>;
  readonly submitting?: boolean;
}

export function makeState<Values extends Record<string, unknown>>(
  initial: InitialState<Values>,
): Effect.Effect<RefSubject.RefSubject<State<Values>>, never, Scope.Scope> {
  return RefSubject.make({
    values: initial.values,
    errors: initial.errors ?? {},
    submitting: initial.submitting ?? false,
  });
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

export interface FormOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly content: Content;
  readonly onsubmit?: Parameters<typeof EventHandler.fromEffectOrEventHandler>[0];
}

export function Form<const Opts extends FormOptions>(options: Opts): Component<Opts> {
  const onSubmit = options.onsubmit
    ? EventHandler.fromEffectOrEventHandler(options.onsubmit)
    : EventHandler.make((event: SubmitEvent) => Effect.sync(() => event.preventDefault()));

  return html`<form onsubmit=${onSubmit}>${options.content}</form>`;
}

export interface InputOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly name: string;
  readonly id?: ReactiveValue<string | undefined, any, any>;
  readonly type?: ReactiveValue<string | undefined, any, any>;
}

export function Input<const Opts extends InputOptions>(options: Opts): Component<Opts> {
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

export interface ErrorOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly name: string;
}

export function Error<const Opts extends ErrorOptions>(options: Opts): Component<Opts> {
  return html`<div id=${`${options.name}-error`} role="alert">
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
export const Push = Submit;
export const Remove = Submit;

interface InputEventLike extends Event {
  readonly currentTarget: HTMLInputElement;
}
