import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Schema from "effect/Schema";
import type * as Scope from "effect/Scope";
import { RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";
import * as CheckboxPrimitive from "./Checkbox.js";
import * as DataAttr from "./DataAttr.js";
import * as Dom from "./Dom.js";
import * as SelectPrimitive from "./Select.js";
import type { AnyContent, Component, AnyValue } from "./Reactive.js";

export interface State<out Values extends {} = {}> {
  readonly values: Values;
  readonly defaultValues: Values;
  readonly errors: Partial<Record<keyof Values & string, string>>;
  readonly meta: FieldMetaByName<Values>;
  readonly submitting: boolean;
  readonly schema?: Schema.Optic<Values, unknown>;
}

export interface InitialState<Values extends {} = {}> {
  readonly values: Values;
  readonly defaultValues?: Values;
  readonly errors?: Partial<Record<keyof Values & string, string>>;
  readonly meta?: Partial<FieldMetaByName<Values>>;
  readonly submitting?: boolean;
  readonly schema?: Schema.Optic<Values, unknown>;
}

export const data = DataAttr.schema({
  submitting: Schema.Boolean,
});

export const component = "typed/ui/Form";

export interface Result<Values extends {}> {
  readonly values?: Partial<Values>;
  readonly errors?: Partial<Record<keyof Values & string, string>>;
  readonly formError?: string;
}

export interface FieldMeta {
  readonly dirty: boolean;
  readonly touched: boolean;
}

export type FieldMetaByName<Values extends {}> = Partial<
  Record<keyof Values & string, FieldMeta>
>;

export interface FieldData<Name extends string = string> {
  readonly field: Name;
  readonly dirty: boolean;
  readonly touched: boolean;
  readonly invalid: boolean;
  readonly submitting: boolean;
}

export function makeState<Values extends {}>(
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

export function setValue<Values extends {}, E, R>(
  state: RefSubject.RefSubject<State<Values>, E, R>,
  name: keyof Values & string,
  value: unknown,
): Effect.Effect<State<Values>, E, R> {
  return RefSubject.update(state, (current) => updateField(current, name, value));
}

export function validate<Values extends {}, E, R>(
  state: RefSubject.RefSubject<State<Values>, E, R>,
): Effect.Effect<Values, Schema.SchemaError | E, R> {
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

export function reset<Values extends {}, E, R>(
  state: RefSubject.RefSubject<State<Values>, E, R>,
): Effect.Effect<State<Values>, E, R> {
  return RefSubject.update(state, (current) => ({
    ...current,
    values: current.defaultValues,
    errors: {},
    meta: {},
    submitting: false,
  }));
}

export function fieldMeta<Values extends {}>(
  state: State<Values>,
  name: keyof Values & string,
): FieldMeta {
  return state.meta[name] ?? { dirty: false, touched: false };
}

export function fieldData<Values extends {}>(
  state: State<Values>,
  name: keyof Values & string,
): FieldData<keyof Values & string> {
  const meta = fieldMeta(state, name);
  return {
    field: name,
    dirty: meta.dirty,
    touched: meta.touched,
    invalid: state.errors[name] !== undefined,
    submitting: state.submitting,
  };
}

export function applyResult<Values extends {}, E, R>(
  state: RefSubject.RefSubject<State<Values>, E, R>,
  result: Result<Values>,
): Effect.Effect<State<Values>, E, R> {
  return RefSubject.update(state, (current) => ({
    ...current,
    values: result.values === undefined ? current.values : { ...current.values, ...result.values },
    errors: result.errors === undefined ? current.errors : { ...current.errors, ...result.errors },
  }));
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

export type ArrayFieldName<Values extends {}> = {
  readonly [Name in keyof Values & string]: Values[Name] extends readonly unknown[] ? Name : never;
}[keyof Values & string];

export type BooleanFieldName<Values extends {}> = {
  readonly [Name in keyof Values & string]: Values[Name] extends boolean ? Name : never;
}[keyof Values & string];

export type StringFieldName<Values extends {}> = {
  readonly [Name in keyof Values & string]: Values[Name] extends string ? Name : never;
}[keyof Values & string];

export type ArrayFieldValue<
  Values extends {} ,
  Name extends ArrayFieldName<Values>,
> = Values[Name] extends readonly (infer Value)[] ? Value : never;

export function pushValue<
  Values extends {} ,
  Name extends ArrayFieldName<Values>,
  E,
  R,
>(
  state: RefSubject.RefSubject<State<Values>, E, R>,
  name: Name,
  value: ArrayFieldValue<Values, Name>,
): Effect.Effect<State<Values>, E, R> {
  return RefSubject.update(state, (current) => {
    const currentValue = current.values[name];
    const values = Array.isArray(currentValue) ? currentValue.concat(value) : [value];
    return updateField(current, name, values);
  });
}

export function removeValue<
  Values extends {} ,
  Name extends ArrayFieldName<Values>,
  E,
  R,
>(
  state: RefSubject.RefSubject<State<Values>, E, R>,
  name: Name,
  index: number,
): Effect.Effect<State<Values>, E, R> {
  return RefSubject.update(state, (current) => {
    const currentValue = current.values[name];
    const values = Array.isArray(currentValue)
      ? currentValue.filter((_, valueIndex) => valueIndex !== index)
      : [];
    return updateField(current, name, values);
  });
}

export type ValidSubmitHandler<Values extends {}, E = never, R = never> = (
  values: Values,
  event: SubmitEvent,
) => void | Effect.Effect<unknown, E, R>;

export interface FormOptions<Values extends {} = {}, E = never, R = never, E2 = never, R2 = never>
  extends Dom.HostOptions<HTMLFormElement> {
  readonly state: RefSubject.RefSubject<State<Values>, E, R>;
  readonly content: AnyContent;
  readonly onsubmit?: Parameters<typeof EventHandler.fromEffectOrEventHandler>[0];
  readonly onValidSubmit?: ValidSubmitHandler<Values, E2, R2>;
}

export function Form<
  const Values extends {} ,
  const E,
  const R,
  const E2,
  const R2,
  const Opts extends FormOptions<Values, NoInfer<E>, NoInfer<R>, NoInfer<E2>, NoInfer<R2>>,
>(options: Opts & Pick<FormOptions<Values, E, R>, "state">): Component<Opts> {
  const internalSubmit = EventHandler.make((event: SubmitEvent) =>
    Effect.gen(function* () {
      event.preventDefault();
      yield* RefSubject.update(options.state, (state) => ({ ...state, submitting: true }));
      const exit = yield* validate(options.state).pipe(Effect.exit);
      if (Exit.isFailure(exit)) return;

      const values = exit.value;
      const result = options.onValidSubmit?.(values, event);
      if (Effect.isEffect(result)) yield* result;
    }).pipe(
      Effect.ensuring(
        RefSubject.update(options.state, (state) => ({ ...state, submitting: false })).pipe(
          Effect.orDie,
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
  const onReset = EventHandler.make(() => reset(options.state), { preventDefault: true });
  const props = Dom.mergeProps(options.props, {
    "data-ui": component,
    onsubmit: onSubmit,
    onreset: onReset,
  });
  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<form ...${props}>${options.content}</form>`;
}

export interface InputOptions<
  Values extends {} = {},
  Name extends keyof Values & string = keyof Values & string,
  E = never,
  R = never,
> extends Dom.HostOptions<HTMLInputElement> {
  readonly state: RefSubject.RefSubject<State<Values>, E, R>;
  readonly name: Name;
  readonly codec?: Schema.Schema<Values[Name]>;
  readonly id?: AnyValue<string | undefined>;
  readonly type?: AnyValue<string | undefined>;
}

export type FieldBinding<Values extends {}, Name extends keyof Values & string, E, R> = {
  readonly state: RefSubject.RefSubject<State<Values>, E, R>;
  readonly name: Name;
};

export interface FieldInputOptions<
  Values extends {} = {},
  Name extends keyof Values & string = keyof Values & string,
  E = never,
  R = never,
> extends Omit<InputOptions<Values, Name, E, R>, "state" | "name"> {}

export function Input<
  const Values extends {},
  const Name extends keyof Values & string,
  const E,
  const R,
  const Opts extends InputOptions<Values, Name, NoInfer<E>, NoInfer<R>>,
>(options: Opts & Pick<InputOptions<Values, Name, E, R>, "state">): Component<Opts>;
export function Input<
  const Values extends {},
  const Name extends keyof Values & string,
  const E,
  const R,
  const Opts extends FieldInputOptions<Values, Name, NoInfer<E>, NoInfer<R>>,
>(
  state: RefSubject.RefSubject<State<Values>, E, R>,
  name: Name,
  options?: Opts,
): Component<Opts & FieldBinding<Values, Name, E, R>>;
export function Input(...args: ReadonlyArray<any>): any {
  const [optionsOrState, name, fieldOptions = {}] = args;
  const options: any =
    typeof name === "string"
      ? { ...fieldOptions, state: optionsOrState, name }
      : optionsOrState;
  const value = options.codec
    ? RefSubject.mapEffect(options.state, (state: any) =>
        encodeDomValue(options.codec!, state.values[options.name]),
      )
    : RefSubject.map(options.state, (state: any) => String(state.values[options.name] ?? ""));
  const describedBy = RefSubject.map(options.state, (state: any) =>
    state.errors[options.name] ? `${options.name}-error` : undefined,
  );
  const onInput = EventHandler.make((event: InputEventLike) =>
    options.codec
      ? Effect.matchEffect(decodeDomValue(options.codec, event.currentTarget.value), {
          onFailure: (error) => setAnyFieldError(options.state, options.name, error),
          onSuccess: (value) => setAnyValue(options.state, options.name, value),
        })
      : setAnyValue(options.state, options.name, event.currentTarget.value),
  );
  const props = Dom.mergeProps<HTMLInputElement>(options.props, {
    id: options.id,
    name: options.name,
    type: options.type ?? "text",
    ...fieldDataAttrs(options.state, options.name, "typed/ui/Form.Input"),
    "aria-describedby": describedBy,
    ".value": value,
    oninput: onInput,
  });

  if (options.host) return options.host(props, "");

  return html`<input ...${props} />`;
}

export interface CheckboxOptions extends Omit<CheckboxPrimitive.InputViewOptions, "name"> {}

export function Checkbox<
  const Values extends {},
  const Name extends BooleanFieldName<Values>,
  const E,
  const R,
  const Opts extends CheckboxOptions,
>(
  state: RefSubject.RefSubject<State<Values>, E, R>,
  name: Name,
  options = {} as Opts,
): Component<Opts & FieldBinding<Values, Name, E, R>> {
  const checked = RefSubject.map(state, (current) => current.values[name] === true);
  const checkboxState: CheckboxPrimitive.InputViewState<E, R> = {
    checked,
    checkedValue: checked,
    indeterminate: RefSubject.map(checked, () => false),
  };
  const onChange = EventHandler.make((event: CheckboxPrimitive.CheckboxChangeEvent) => {
    event.preventDefault();
    return setValue(state, name, event.currentTarget.checked);
  });

  const props = Dom.mergeProps<HTMLInputElement>(
    options.props,
    fieldDataAttrs(state, name, "typed/ui/Form.Checkbox"),
  );

  return CheckboxPrimitive.InputView({ ...options, name, props }, checkboxState, onChange) as Component<
    Opts & FieldBinding<Values, Name, E, R>
  >;
}

export interface SelectOptions<
  Value extends string = string,
  Values extends {} = {},
  E = never,
  R = never,
  E2 = never,
  R2 = never,
> extends Omit<
    SelectPrimitive.HiddenInputOptions<Value, Values, E, R, E2, R2>,
    "formState" | "name"
  > {}

export function Select<
  const Values extends {},
  const Name extends StringFieldName<Values>,
  const E,
  const R,
  const E2,
  const R2,
  const Value extends Values[Name] & string,
  const Opts extends SelectOptions<Value, Values, NoInfer<E2>, NoInfer<R2>, NoInfer<E>, NoInfer<R>>,
>(
  formState: RefSubject.RefSubject<State<Values>, E, R>,
  name: Name,
  options: Opts & Pick<SelectOptions<Value, Values, E2, R2, E, R>, "state">,
): Component<Opts & FieldBinding<Values, Name, E, R>> {
  return SelectPrimitive.HiddenInput({
    ...options,
    formState,
    name,
    props: Dom.mergeProps<HTMLInputElement>(
      options.props,
      fieldDataAttrs(formState, name, "typed/ui/Form.Select"),
    ),
  }) as Component<Opts & FieldBinding<Values, Name, E, R>>;
}

export interface LabelOptions extends Dom.HostOptions<HTMLLabelElement> {
  readonly content: AnyContent;
  readonly for?: AnyValue<string | undefined>;
}

export function Label<const Opts extends LabelOptions>(options: Opts): Component<Opts> {
  const props = Dom.mergeProps(options.props, { for: options.for });
  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<label ...${props}>${options.content}</label>`;
}

export interface DescriptionOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly id?: string;
  readonly content: AnyContent;
}

export function Description<const Opts extends DescriptionOptions>(
  options: Opts,
): Component<Opts> {
  const props = Dom.mergeProps(options.props, { id: options.id });
  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<div ...${props}>${options.content}</div>`;
}

export interface ErrorOptions<
  Values extends {} = {} ,
  Name extends keyof Values & string = keyof Values & string,
  E = never,
  R = never,
> extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.RefSubject<State<Values>, E, R>;
  readonly name: Name;
}

export function Error<
  const Values extends {} ,
  const Name extends keyof Values & string,
  const E,
  const R,
  const Opts extends ErrorOptions<Values, Name, NoInfer<E>, NoInfer<R>>,
>(options: Opts & Pick<ErrorOptions<Values, Name, E, R>, "state">): Component<Opts> {
  const id = `${options.name}-error`;
  const props = Dom.mergeProps(options.props, { id, role: "alert" });
  if (options.host) {
    return options.host(
      props,
      RefSubject.map(options.state, (state) => state.errors[options.name] ?? ""),
    ) as Component<Opts>;
  }

  const content = RefSubject.map(options.state, (state) => state.errors[options.name] ?? "");
  return Dom.renderDivHost<Opts>(props, content);
}

export interface SubmitOptions extends Dom.HostOptions<HTMLButtonElement> {
  readonly content: AnyContent;
}

export function Submit<const Opts extends SubmitOptions>(
  options: Opts,
): Component<Opts> {
  const props = Dom.mergeProps(options.props, { type: "submit" });
  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<button ...${props}>${options.content}</button>`;
}

export interface ResetOptions extends Dom.HostOptions<HTMLButtonElement> {
  readonly content: AnyContent;
}

export function Reset<const Opts extends ResetOptions>(
  options: Opts,
): Component<Opts> {
  const props = Dom.mergeProps(options.props, { type: "reset" });
  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<button ...${props}>${options.content}</button>`;
}

export interface PushOptions<
  Values extends {} = {} ,
  Name extends ArrayFieldName<Values> = ArrayFieldName<Values>,
  E = never,
  R = never,
> extends Dom.HostOptions<HTMLButtonElement> {
  readonly state: RefSubject.RefSubject<State<Values>, E, R>;
  readonly name: Name;
  readonly value: ArrayFieldValue<Values, Name>;
  readonly content: AnyContent;
}

export function Push<
  const Values extends {} ,
  const Name extends ArrayFieldName<Values>,
  const E,
  const R,
  const Opts extends PushOptions<Values, Name, NoInfer<E>, NoInfer<R>>,
>(options: Opts & Pick<PushOptions<Values, Name, E, R>, "state">): Component<Opts>;
export function Push<
  const Values extends {} ,
  const Name extends ArrayFieldName<Values>,
  const E,
  const R,
  const Opts extends Omit<PushOptions<Values, Name, NoInfer<E>, NoInfer<R>>, "state" | "name">,
>(
  state: RefSubject.RefSubject<State<Values>, E, R>,
  name: Name,
  options: Opts,
): Component<Opts & FieldBinding<Values, Name, E, R>>;
export function Push(...args: ReadonlyArray<any>): any {
  const [optionsOrState, name, fieldOptions] = args;
  const options =
    typeof name === "string"
      ? { ...fieldOptions, state: optionsOrState, name } as PushOptions
      : optionsOrState as PushOptions;
  const onClick = EventHandler.make(() => pushValue(options.state, options.name, options.value));
  const props = Dom.mergeProps(options.props, { type: "button", onclick: onClick });
  if (options.host) return options.host(props, options.content);

  return html`<button ...${props}>${options.content}</button>`;
}

export interface RemoveOptions<
  Values extends {} = {} ,
  Name extends ArrayFieldName<Values> = ArrayFieldName<Values>,
  E = never,
  R = never,
> extends Dom.HostOptions<HTMLButtonElement> {
  readonly state: RefSubject.RefSubject<State<Values>, E, R>;
  readonly name: Name;
  readonly index: AnyValue<number>;
  readonly content: AnyContent;
}

export function Remove<
  const Values extends {} ,
  const Name extends ArrayFieldName<Values>,
  const E,
  const R,
  const Opts extends RemoveOptions<Values, Name, NoInfer<E>, NoInfer<R>>,
>(options: Opts & Pick<RemoveOptions<Values, Name, E, R>, "state">): Component<Opts>;
export function Remove<
  const Values extends {} ,
  const Name extends ArrayFieldName<Values>,
  const E,
  const R,
  const Opts extends Omit<RemoveOptions<Values, Name, NoInfer<E>, NoInfer<R>>, "state" | "name">,
>(
  state: RefSubject.RefSubject<State<Values>, E, R>,
  name: Name,
  options: Opts,
): Component<Opts & FieldBinding<Values, Name, E, R>>;
export function Remove(...args: ReadonlyArray<any>): any {
  const [optionsOrState, name, fieldOptions] = args;
  const options =
    typeof name === "string"
      ? { ...fieldOptions, state: optionsOrState, name } as RemoveOptions
      : optionsOrState as RemoveOptions;
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
  if (options.host) return options.host(props, options.content);

  return html`<button ...${props}>${options.content}</button>`;
}

export interface GroupOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly content: AnyContent;
  readonly label?: string;
}

export function Group<const Opts extends GroupOptions>(
  options: Opts,
): Component<Opts> {
  const props = Dom.mergeProps(options.props, { role: "group", "aria-label": options.label });
  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<div ...${props}>${options.content}</div>`;
}

export const GroupLabel = Label;
export const Control = Input;
export const Field = Input;

interface InputEventLike extends Event {
  readonly currentTarget: HTMLInputElement;
}

function fieldDataAttrs<Values extends {}, Name extends keyof Values & string, E, R>(
  state: RefSubject.RefSubject<State<Values>, E, R>,
  name: Name,
  component: string,
): Dom.HostProps<HTMLInputElement>;
function fieldDataAttrs<E, R>(
  state: RefSubject.RefSubject<State<any>, E, R>,
  name: string,
  component: string,
): Dom.HostProps<HTMLInputElement>;
function fieldDataAttrs<E, R>(
  state: RefSubject.RefSubject<State<any>, E, R>,
  name: string,
  component: string,
) {
  const fields = RefSubject.proxy(state);
  const meta = RefSubject.map(fields.meta, (value) => value[name] ?? cleanFieldMeta);
  const dirty = RefSubject.map(meta, (value) => value.dirty);
  const touched = RefSubject.map(meta, (value) => value.touched);
  const invalid = RefSubject.map(fields.errors, (value) => value[name] !== undefined);
  return {
    "data-ui": component,
    "data-field": name,
    "data-dirty": dirty,
    "data-touched": touched,
    "data-invalid": invalid,
    "data-submitting": fields.submitting,
  };
}

const cleanFieldMeta: FieldMeta = { dirty: false, touched: false };

function setAnyValue<E, R>(
  state: RefSubject.RefSubject<State<any>, E, R>,
  name: string,
  value: unknown,
): Effect.Effect<State<any>, E, R> {
  return RefSubject.update(state, (current) => updateField(current, name, value));
}

function setAnyFieldError<E, R>(
  state: RefSubject.RefSubject<State<any>, E, R>,
  name: string,
  error: Schema.SchemaError,
): Effect.Effect<State<any>, E, R> {
  return RefSubject.update(state, (current) => ({
    ...current,
    errors: { ...current.errors, [name]: String(error) },
    meta: {
      ...current.meta,
      [name]: {
        dirty: !sameValue(current.defaultValues[name], current.values[name]),
        touched: true,
      },
    },
  }));
}

function errorsForValues<Values extends {} >(
  values: Values,
  error: Schema.SchemaError,
): Partial<Record<keyof Values & string, string>> {
  const message = String(error);
  return Object.keys(values).reduce<Partial<Record<keyof Values & string, string>>>(
    (errors, key) => ({ ...errors, [key]: message }),
    {},
  );
}

function updateField<Values extends {} >(
  current: State<Values>,
  name: keyof Values & string,
  value: unknown,
): State<Values> {
  const errors: Partial<Record<keyof Values & string, string>> = { ...current.errors };
  delete errors[name];
  return {
    ...current,
    values: { ...current.values, [name]: value },
    errors,
    meta: {
      ...current.meta,
      [name]: {
        dirty: !sameValue(current.defaultValues[name], value),
        touched: true,
      },
    },
  };
}

function sameValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (!Array.isArray(left) || !Array.isArray(right)) return false;
  if (left.length !== right.length) return false;
  return left.every((value, index) => Object.is(value, right[index]));
}
