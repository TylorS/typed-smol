import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import type * as Scope from "effect/Scope";
import { RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";
import * as Dom from "./Dom.js";
import type { Component, Content, Value as ReactiveValue } from "./Reactive.js";

export interface State<Values extends Record<string, unknown> = Record<string, unknown>> {
  readonly values: Values;
  readonly defaultValues: Values;
  readonly errors: Partial<Record<keyof Values & string, string>>;
  readonly meta: FieldMetaByName<Values>;
  readonly submitting: boolean;
  readonly schema?: Schema.Schema<Values>;
}

export interface InitialState<Values extends Record<string, unknown> = Record<string, unknown>> {
  readonly values: Values;
  readonly defaultValues?: Values;
  readonly errors?: Partial<Record<keyof Values & string, string>>;
  readonly meta?: Partial<FieldMetaByName<Values>>;
  readonly submitting?: boolean;
  readonly schema?: Schema.Schema<Values>;
}

export interface FieldMeta {
  readonly dirty: boolean;
  readonly touched: boolean;
}

export type FieldMetaByName<Values extends Record<string, unknown>> = Partial<
  Record<keyof Values & string, FieldMeta>
>;

export function makeState<Values extends Record<string, unknown>>(
  initial: InitialState<Values>,
): Effect.Effect<RefSubject.RefSubject<State<Values>>, never, Scope.Scope> {
  const state: State<Values> = {
    values: initial.values,
    defaultValues: initial.defaultValues ?? initial.values,
    errors: initial.errors ?? {},
    meta: initial.meta ?? {},
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
    meta: {
      ...current.meta,
      [name]: {
        dirty: current.defaultValues[name] !== value,
        touched: true,
      },
    },
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
    meta: {},
    submitting: false,
  }));
}

export function fieldMeta<Values extends Record<string, unknown>>(
  state: State<Values>,
  name: keyof Values & string,
): FieldMeta {
  return state.meta[name] ?? { dirty: false, touched: false };
}

export function decodeDomValue<A>(
  codec: Schema.Schema<A>,
  value: string,
): Effect.Effect<A, Schema.SchemaError, any> {
  return Schema.decodeUnknownEffect(codec)(value);
}

export function encodeDomValue<A>(
  codec: Schema.Schema<A>,
  value: A,
): Effect.Effect<string, Schema.SchemaError, any> {
  return Schema.encodeUnknownEffect(codec)(value).pipe(Effect.map(String));
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

export interface FormOptions<Values extends Record<string, unknown> = Record<string, unknown>>
  extends Dom.HostOptions<HTMLFormElement> {
  readonly state: RefSubject.RefSubject<State<Values>>;
  readonly content: Content;
  readonly onsubmit?: Parameters<typeof EventHandler.fromEffectOrEventHandler>[0];
  readonly onValidSubmit?: (
    values: Values,
    event: SubmitEvent,
  ) => void | Effect.Effect<unknown, any, any>;
}

export function Form<
  const Values extends Record<string, unknown>,
  const Opts extends FormOptions<Values>,
>(options: Opts): Component<Opts> {
  const internalSubmit = EventHandler.make((event: SubmitEvent) =>
    Effect.gen(function* () {
      event.preventDefault();
      yield* RefSubject.update(options.state, (state) => ({ ...state, submitting: true }));
      const values = yield* validate(options.state);
      const result = options.onValidSubmit?.(values, event);
      if (Effect.isEffect(result)) yield* result;
    }).pipe(
      Effect.ensuring(
        RefSubject.update(options.state, (state) => ({ ...state, submitting: false })).pipe(
          Effect.asVoid,
        ),
      ),
    ),
  );
  const onSubmit = options.onsubmit
    ? EventHandler.make((event: SubmitEvent) =>
        Effect.gen(function* () {
          yield* EventHandler.fromEffectOrEventHandler(options.onsubmit!).handler(event);
          if (!event.defaultPrevented) yield* internalSubmit.handler(event);
        }),
      )
    : internalSubmit;
  const onReset = EventHandler.make((event: Event) =>
    Effect.gen(function* () {
      event.preventDefault();
      yield* reset(options.state);
    }),
  );

  const props = Dom.mergeProps(options.props, { onsubmit: onSubmit, onreset: onReset });
  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<form ...${props}>${options.content}</form>`;
}

export interface InputOptions<
  Values extends Record<string, unknown> = Record<string, unknown>,
  Name extends keyof Values & string = keyof Values & string,
> extends Dom.HostOptions<HTMLInputElement> {
  readonly state: RefSubject.RefSubject<State<Values>>;
  readonly name: Name;
  readonly codec?: Schema.Schema<Values[Name]>;
  readonly id?: ReactiveValue<string | undefined, any, any>;
  readonly type?: ReactiveValue<string | undefined, any, any>;
}

export function Input<
  const Values extends Record<string, unknown>,
  const Name extends keyof Values & string,
  const Opts extends InputOptions<Values, Name>,
>(options: Opts): Component<Opts> {
  const value = options.codec
    ? RefSubject.mapEffect(options.state, (state) =>
        encodeDomValue(options.codec!, state.values[options.name]),
      )
    : RefSubject.map(options.state, (state) => String(state.values[options.name] ?? ""));
  const describedBy = RefSubject.map(options.state, (state) =>
    state.errors[options.name] ? `${options.name}-error` : undefined,
  );
  const onInput = EventHandler.make((event: InputEventLike) =>
    options.codec
      ? Effect.flatMap(decodeDomValue(options.codec, event.currentTarget.value), (value) =>
          setValue(options.state, options.name, value),
        )
      : setValue(options.state, options.name, event.currentTarget.value),
  );
  const props = Dom.mergeProps(options.props, {
    id: options.id,
    name: options.name,
    type: options.type ?? "text",
    "aria-describedby": describedBy,
    ".value": value,
    oninput: onInput,
  });

  if (options.host) return options.host(props, "") as Component<Opts>;

  return html`<input ...${props} />`;
}

export interface LabelOptions extends Dom.HostOptions<HTMLLabelElement> {
  readonly content: Content;
  readonly for?: ReactiveValue<string | undefined, any, any>;
}

export function Label<const Opts extends LabelOptions>(options: Opts): Component<Opts> {
  const props = Dom.mergeProps(options.props, { for: options.for });
  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<label ...${props}>${options.content}</label>`;
}

export function Description<
  const Opts extends { readonly id?: string; readonly content: Content } & Dom.HostOptions<HTMLDivElement>,
>(
  options: Opts,
): Component<Opts> {
  const props = Dom.mergeProps(options.props, { id: options.id });
  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<div ...${props}>${options.content}</div>`;
}

export interface ErrorOptions<
  Values extends Record<string, unknown> = Record<string, unknown>,
  Name extends keyof Values & string = keyof Values & string,
> extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.RefSubject<State<Values>>;
  readonly name: Name;
}

export function Error<
  const Values extends Record<string, unknown>,
  const Name extends keyof Values & string,
  const Opts extends ErrorOptions<Values, Name>,
>(options: Opts): Component<Opts> {
  const id = `${options.name}-error`;
  const props = Dom.mergeProps(options.props, { id, role: "alert" });
  if (options.host) {
    return options.host(
      props,
      RefSubject.map(options.state, (state) => state.errors[options.name] ?? ""),
    ) as Component<Opts>;
  }

  return html`<div ...${props}>
    ${RefSubject.map(options.state, (state) => state.errors[options.name] ?? "")}
  </div>`;
}

export function Submit<
  const Opts extends { readonly content: Content } & Dom.HostOptions<HTMLButtonElement>,
>(
  options: Opts,
): Component<Opts> {
  const props = Dom.mergeProps(options.props, { type: "submit" });
  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<button ...${props}>${options.content}</button>`;
}

export function Reset<
  const Opts extends { readonly content: Content } & Dom.HostOptions<HTMLButtonElement>,
>(
  options: Opts,
): Component<Opts> {
  const props = Dom.mergeProps(options.props, { type: "reset" });
  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<button ...${props}>${options.content}</button>`;
}

export interface PushOptions<
  Values extends Record<string, unknown> = Record<string, unknown>,
  Name extends ArrayFieldName<Values> = ArrayFieldName<Values>,
> extends Dom.HostOptions<HTMLButtonElement> {
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
  const props = Dom.mergeProps(options.props, { type: "button", onclick: onClick });
  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<button ...${props}>${options.content}</button>`;
}

export interface RemoveOptions<
  Values extends Record<string, unknown> = Record<string, unknown>,
  Name extends ArrayFieldName<Values> = ArrayFieldName<Values>,
> extends Dom.HostOptions<HTMLButtonElement> {
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
  const props = Dom.mergeProps(options.props, { type: "button", onclick: onClick });
  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<button ...${props}>${options.content}</button>`;
}

export function Group<
  const Opts extends { readonly content: Content; readonly label?: string } & Dom.HostOptions<HTMLDivElement>,
>(
  options: Opts,
): Component<Opts> {
  const props = Dom.mergeProps(options.props, { role: "group", "aria-label": options.label });
  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<div ...${props}>${options.content}</div>`;
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
