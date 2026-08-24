import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import * as SchemaIssue from "effect/SchemaIssue";
import * as SchemaTransformation from "effect/SchemaTransformation";
import type * as SchemaAST from "effect/SchemaAST";
import { RefSubject } from "@typed/fx";
import type * as Scope from "effect/Scope";
import type { Fx } from "@typed/fx/Fx";
import {
  EventHandler,
  html,
  type Renderable,
  type RenderEvent,
  type RenderTemplate,
} from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

export interface FieldMeta {
  readonly dirty: boolean;
  readonly touched: boolean;
}
export interface State<Values extends object = object> {
  readonly values: Values;
  readonly defaultValues: Values;
  readonly errors: Partial<Record<keyof Values & string, string>>;
  readonly meta: Partial<Record<keyof Values & string, FieldMeta>>;
  readonly submitting: boolean;
}
export interface InitialState<Values extends object> {
  readonly values: Values;
  readonly defaultValues?: Values;
  readonly errors?: Partial<Record<keyof Values & string, string>>;
  readonly meta?: Partial<Record<keyof Values & string, FieldMeta>>;
  readonly submitting?: boolean;
}

export type FormState<Values extends object> = RefSubject.HydratedRefSubject<
  State<Values>,
  Schema.SchemaError
> & {
  /** Runtime-only validation codec; it is deliberately absent from hydration state. */
  readonly codec?: unknown;
};

export function StateSchema<Values extends object>() {
  return Schema.declare<State<Values>>(
    (value): value is State<Values> => typeof value === "object" && value !== null,
  );
}
export function makeState<Values extends object>(
  initial: InitialState<Values>,
  codec?: Schema.Codec<Values, unknown>,
): Effect.Effect<FormState<Values>, Schema.SchemaError, Scope.Scope> {
  return Effect.map(
    RefSubject.hydrate(StateSchema<Values>(), {
      values: initial.values,
      defaultValues: initial.defaultValues ?? initial.values,
      errors: initial.errors ?? {},
      meta: initial.meta ?? {},
      submitting: initial.submitting ?? false,
    }),
    (state) => Object.assign(state, { codec }),
  );
}

export type FieldNameFor<Values extends object, Value> = {
  [Key in keyof Values & string]: Values[Key] extends Value ? Key : never;
}[keyof Values & string];

export interface InputOptions<
  Values extends object,
  Value,
> extends Dom.HostOptions<HTMLInputElement> {
  readonly state: FormState<Values>;
  readonly name: FieldNameFor<Values, Value>;
  readonly codec?: Schema.Codec<Value, string>;
}

export type TextInputOptions<Values extends object> = InputOptions<Values, string>;
export type NumberInputOptions<Values extends object> = InputOptions<Values, number>;
export type DateInputOptions<Values extends object> = InputOptions<Values, Date>;

function setFieldError<Values extends object, Key extends keyof Values & string, E, R>(
  state: RefSubject.RefSubject<State<Values>, E, R>,
  key: Key,
  error: string | undefined,
): Effect.Effect<State<Values>, E, R> {
  return RefSubject.update(state, (current) => ({
    ...current,
    errors: { ...current.errors, [key]: error },
  }));
}

function decodeField<Values extends object, Value>(
  state: FormState<Values>,
  name: FieldNameFor<Values, Value>,
  codec: Schema.Codec<Value, string>,
  value: string,
): Effect.Effect<State<Values>, Schema.SchemaError, never> {
  return Schema.decodeEffect(codec)(value).pipe(
    Effect.flatMap((decoded) =>
      Effect.andThen(updateDecodedValue(state, name, decoded), () =>
        setFieldError(state, name, undefined),
      ),
    ),
    Effect.catch((error) => setFieldError(state, name, error.message)),
  );
}

function inputProps<Values extends object, Value>(
  options: InputOptions<Values, Value>,
  type: string,
  codec: Schema.Codec<Value, string>,
) {
  return () =>
    ({
      type,
      name: options.name,
      "aria-describedby": RefSubject.map(options.state, (state) =>
        state.errors[options.name] === undefined ? undefined : `${options.name}-error`,
      ),
      "aria-invalid": RefSubject.map(options.state, (state) =>
        state.errors[options.name] === undefined ? undefined : true,
      ),
      ".value": RefSubject.mapEffect(options.state, (state) =>
        Schema.encodeUnknownEffect(codec)(state.values[options.name]),
      ),
      oninput: EventHandler.make((event: Event) =>
        decodeField(
          options.state,
          options.name,
          codec,
          Dom.currentTarget<HTMLInputElement>(event).value,
        ),
      ),
    }) as const;
}

type InputProps<Values extends object, Value> = ReturnType<
  ReturnType<typeof inputProps<Values, Value>>
>;

function renderInput<
  const Values extends object,
  Value,
  const Options extends InputOptions<Values, Value>,
  const Host extends HostResult = never,
>(
  options: Options,
  host:
    | Dom.HostOverride<Dom.RenderHostProps<Options, InputProps<Values, Value>>, "", Host>
    | undefined,
  type: string,
  defaultCodec: Schema.Codec<Value, string>,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  const codec = options.codec ?? defaultCodec;
  return Dom.renderHost<HTMLInputElement>()<
    Options,
    InputProps<Values, Value>,
    "",
    HostResult,
    Host
  >(options, host, inputProps(options, type, codec), "", (props) => html`<input ...${props} />`);
}

function makeInput<Value>(type: string, codec: Schema.Codec<Value, string>) {
  return function <
    const Values extends object,
    const Options extends InputOptions<Values, Value>,
    const Host extends HostResult = never,
  >(
    options: Options & Pick<InputOptions<Values, Value>, "state" | "name">,
    host?: Dom.HostOverride<Dom.RenderHostProps<Options, InputProps<Values, Value>>, "", Host>,
  ) {
    return renderInput(options, host, type, codec);
  };
}

export const TextInput = makeInput("text", Schema.String);
export const SearchInput = makeInput("search", Schema.String);
export const EmailInput = makeInput("email", Schema.String);
export const UrlInput = makeInput("url", Schema.String);
export const TelInput = makeInput("tel", Schema.String);
export const PasswordInput = makeInput("password", Schema.String);
export const HiddenInput = makeInput("hidden", Schema.String);
export const ColorInput = makeInput("color", Schema.String);
export const TimeInput = makeInput("time", Schema.String);
export const DateTimeLocalInput = makeInput("datetime-local", Schema.String);
export const MonthInput = makeInput("month", Schema.String);
export const WeekInput = makeInput("week", Schema.String);
export const NumberInput = makeInput("number", Schema.FiniteFromString);
export const RangeInput = makeInput("range", Schema.FiniteFromString);
export const DateInput = makeInput("date", Schema.DateFromString);

export type FormDataValue = string | File;
export type FormDataRecord = Readonly<Record<string, FormDataValue | ReadonlyArray<FormDataValue>>>;

/** Preserves repeated native fields as arrays before passing them to a Schema codec. */
export function formDataToRecord(data: FormData): FormDataRecord {
  const result: Record<string, FormDataValue | ReadonlyArray<FormDataValue>> = {};
  for (const [name, value] of data.entries()) {
    const existing = result[name];
    result[name] =
      existing === undefined
        ? value
        : Array.isArray(existing)
          ? [...existing, value]
          : [existing, value];
  }
  return result;
}

/** Decodes browser FormData directly, including repeated fields and File values. */
export function decodeFormData<Values extends object, Codec extends Schema.Codec<Values, unknown>>(
  codec: Codec,
  data: FormData,
) {
  return Schema.decodeEffect(codec)(formDataToRecord(data));
}

export function validate<Values extends object>(state: FormState<Values>, data: FormData) {
  if (!isFormCodec<Values>(state.codec)) return Effect.map(state, (current) => current.values);
  return decodeFormData(state.codec, data).pipe(
    Effect.flatMap((values) =>
      Effect.as(
        RefSubject.update(state, (current) => ({
          ...current,
          values,
          errors: {},
          submitting: false,
        })),
        values,
      ),
    ),
    Effect.catch((error) =>
      RefSubject.update(state, (current) => ({
        ...current,
        errors: formErrors(current.values, current.errors, error.message),
        submitting: false,
      })).pipe(Effect.andThen(() => Effect.fail(error))),
    ),
  );
}

function isFormCodec<Values extends object>(
  codec: unknown,
): codec is Schema.Codec<Values, unknown> {
  return Schema.isSchema(codec);
}

function formErrors<Values extends object>(
  values: Values,
  errors: Partial<Record<keyof Values & string, string>>,
  error: string,
): Partial<Record<keyof Values & string, string>> {
  const next = { ...errors };
  for (const key of Object.keys(values)) Reflect.set(next, key, error);
  return next;
}

export interface MaskSlot<Name extends string = string, Value = unknown> {
  readonly _tag: "MaskSlot";
  readonly name: Name;
  readonly codec: Schema.Codec<Value, string>;
  readonly length?: number;
  readonly charset?: RegExp | ((character: string) => boolean);
}

export type MaskPart = string | MaskSlot;
export type MaskValue<Parts extends ReadonlyArray<MaskPart>> = {
  readonly [
    Part in Parts[number] as Part extends MaskSlot<infer Name> ? Name : never
  ]: Part extends MaskSlot<string, infer Value> ? Value : never;
};

export function slot<Name extends string, Value>(
  name: Name,
  codec: Schema.Codec<Value, string>,
  options: Omit<MaskSlot<Name, Value>, "_tag" | "name" | "codec"> = {},
): MaskSlot<Name, Value> {
  return { _tag: "MaskSlot", name, codec, ...options };
}

export function mask<const Parts extends ReadonlyArray<MaskPart>>(
  ...parts: Parts
): Schema.Codec<MaskValue<Parts>, string> {
  const valueSchema = Schema.declare<MaskValue<Parts>>(
    (value): value is MaskValue<Parts> =>
      typeof value === "object" &&
      value !== null &&
      parts.every((part) => typeof part === "string" || Reflect.has(value, part.name)),
  );
  return Schema.String.pipe(
    Schema.decodeTo(
      valueSchema,
      SchemaTransformation.transformOrFail({
        decode: (display, options) => decodeMask(parts, display, options),
        encode: (value, options) => encodeMask(parts, value, options),
      }),
    ),
  );
}

function decodeMask<Parts extends ReadonlyArray<MaskPart>>(
  parts: Parts,
  display: string,
  options: SchemaAST.ParseOptions,
): Effect.Effect<MaskValue<Parts>, SchemaIssue.Issue> {
  return Effect.gen(function* () {
    const value: Record<string, unknown> = {};
    let offset = 0;
    for (let index = 0; index < parts.length; index++) {
      const part = parts[index];
      if (typeof part === "string") {
        if (!display.startsWith(part, offset)) return yield* invalidMask(display, options);
        offset += part.length;
        continue;
      }
      const nextLiteral = parts.slice(index + 1).find((next) => typeof next === "string");
      const end =
        part.length === undefined
          ? nextLiteral === undefined
            ? display.length
            : display.indexOf(nextLiteral, offset)
          : offset + part.length;
      if (end < offset) return yield* invalidMask(display, options);
      const encoded = display.slice(offset, end);
      if (
        encoded.length === 0 ||
        (part.length !== undefined && encoded.length !== part.length) ||
        [...encoded].some((character) => !matchesCharset(part, character))
      )
        return yield* invalidMask(display, options);
      const decoded = yield* Schema.decodeEffect(part.codec)(encoded).pipe(
        Effect.mapError(
          () => new SchemaIssue.InvalidValue({ message: `Invalid ${part.name}` }, display, options),
        ),
      );
      Reflect.set(value, part.name, decoded);
      offset = end;
    }
    if (offset !== display.length || !isMaskValue(parts, value))
      return yield* invalidMask(display, options);
    return value;
  });
}

function encodeMask<Parts extends ReadonlyArray<MaskPart>>(
  parts: Parts,
  value: MaskValue<Parts>,
  options: SchemaAST.ParseOptions,
): Effect.Effect<string, SchemaIssue.Issue> {
  return Effect.gen(function* () {
    let display = "";
    for (const part of parts) {
      if (typeof part === "string") {
        display += part;
        continue;
      }
      const encoded = yield* Schema.encodeUnknownEffect(part.codec)(
        Reflect.get(value, part.name),
      ).pipe(
        Effect.mapError(
          () => new SchemaIssue.InvalidValue({ message: `Invalid ${part.name}` }, value, options),
        ),
      );
      if (
        encoded.length === 0 ||
        (part.length !== undefined && encoded.length !== part.length) ||
        [...encoded].some((character) => !matchesCharset(part, character))
      )
        return yield* invalidMask(value, options);
      display += encoded;
    }
    return display;
  });
}

function isMaskValue<Parts extends ReadonlyArray<MaskPart>>(
  parts: Parts,
  value: unknown,
): value is MaskValue<Parts> {
  return (
    typeof value === "object" &&
    value !== null &&
    parts.every((part) => typeof part === "string" || Reflect.has(value, part.name))
  );
}

function matchesCharset(slot: MaskSlot, character: string): boolean {
  if (slot.charset === undefined) return true;
  if (slot.charset instanceof RegExp) {
    slot.charset.lastIndex = 0;
    return slot.charset.test(character);
  }
  return slot.charset(character);
}

function invalidMask(
  input: unknown,
  options: SchemaAST.ParseOptions,
): Effect.Effect<never, SchemaIssue.Issue> {
  return Effect.fail(new SchemaIssue.InvalidValue({ message: "Invalid mask" }, input, options));
}

export interface MaskedInputOptions<
  Values extends object,
  Parts extends ReadonlyArray<MaskPart>,
> extends InputOptions<Values, MaskValue<Parts>> {
  readonly mask: Schema.Codec<MaskValue<Parts>, string>;
}

export function MaskedInput<
  const Values extends object,
  const Parts extends ReadonlyArray<MaskPart>,
  const Options extends MaskedInputOptions<Values, Parts>,
  const Host extends HostResult = never,
>(
  options: Options & Pick<MaskedInputOptions<Values, Parts>, "state" | "name" | "mask">,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Omit<Options, "mask">, InputProps<Values, MaskValue<Parts>>>,
    "",
    Host
  >,
) {
  const { mask, ...inputOptions } = options;
  return renderInput(inputOptions, host, "text", mask);
}

export interface CheckboxOptions<Values extends object> extends Dom.HostOptions<HTMLInputElement> {
  readonly state: FormState<Values>;
  readonly name: BooleanFieldName<Values>;
}

function checkboxProps<Values extends object>(options: CheckboxOptions<Values>) {
  return () =>
    ({
      type: "checkbox",
      name: options.name,
      "?checked": RefSubject.map(options.state, (state) => state.values[options.name] === true),
      onchange: EventHandler.make((event: Event) =>
        updateDecodedValue(
          options.state,
          options.name,
          Dom.currentTarget<HTMLInputElement>(event).checked,
        ),
      ),
    }) as const;
}

type CheckboxProps<Values extends object> = ReturnType<ReturnType<typeof checkboxProps<Values>>>;

export function Checkbox<
  const Values extends object,
  const Options extends CheckboxOptions<Values>,
  const Host extends HostResult = never,
>(
  options: Options & Pick<CheckboxOptions<Values>, "state" | "name">,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, CheckboxProps<Values>>, "", Host>,
) {
  return Dom.renderHost<HTMLInputElement>()<Options, CheckboxProps<Values>, "", HostResult, Host>(
    options,
    host,
    checkboxProps(options),
    "",
    (props) => html`<input ...${props} />`,
  );
}

export interface SelectOptions<Values extends object> extends Dom.HostOptions<HTMLSelectElement> {
  readonly state: FormState<Values>;
  readonly name: FieldNameFor<Values, string>;
  readonly content: Renderable.Any;
}

function selectProps<Values extends object>(options: SelectOptions<Values>) {
  return () =>
    ({
      name: options.name,
      ".value": RefSubject.map(options.state, (state) => String(state.values[options.name])),
      onchange: EventHandler.make((event: Event) =>
        updateDecodedValue(
          options.state,
          options.name,
          Dom.currentTarget<HTMLSelectElement>(event).value,
        ),
      ),
    }) as const;
}

type SelectProps<Values extends object> = ReturnType<ReturnType<typeof selectProps<Values>>>;

export function Select<
  const Values extends object,
  const Options extends SelectOptions<Values>,
  const Host extends HostResult = never,
>(
  options: Options & Pick<SelectOptions<Values>, "state" | "name" | "content">,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, SelectProps<Values>>,
    Options["content"],
    Host
  >,
) {
  return Dom.renderHost<HTMLSelectElement>()<
    Options,
    SelectProps<Values>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    selectProps(options),
    options.content,
    (props, content) =>
      html`<select ...${props}>
        ${content}
      </select>`,
  );
}

export interface LabelOptions extends Dom.HostOptions<HTMLLabelElement> {
  readonly for: string;
  readonly content: Renderable.Any;
}
function labelProps<const Options extends LabelOptions>(options: Options) {
  return () => ({ for: options.for }) as const;
}
type LabelProps<Options extends LabelOptions> = ReturnType<ReturnType<typeof labelProps<Options>>>;
export function Label<const Options extends LabelOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, LabelProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLLabelElement>()<
    Options,
    LabelProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    labelProps(options),
    options.content,
    (props, content) => html`<label ...${props}>${content}</label>`,
  );
}

export interface DescriptionOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly content: Renderable.Any;
}

function descriptionProps() {
  return () => ({}) as const;
}
type DescriptionProps = ReturnType<ReturnType<typeof descriptionProps>>;
export function Description<
  const Options extends DescriptionOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, DescriptionProps>, Options["content"], Host>,
) {
  return Dom.renderHost<HTMLDivElement>()<
    Options,
    DescriptionProps,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    descriptionProps(),
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}

export interface ErrorOptions<Values extends object> extends Dom.HostOptions<HTMLDivElement> {
  readonly state: FormState<Values>;
  readonly name: keyof Values & string;
}

function errorProps<Values extends object>(options: ErrorOptions<Values>) {
  return () =>
    ({
      id: `${options.name}-error`,
      role: "alert",
    }) as const;
}
type ErrorProps<Values extends object> = ReturnType<ReturnType<typeof errorProps<Values>>>;
export function Error<
  const Values extends object,
  const Options extends ErrorOptions<Values>,
  const Host extends HostResult = never,
>(
  options: Options & Pick<ErrorOptions<Values>, "state" | "name">,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, ErrorProps<Values>>, Renderable.Any, Host>,
) {
  const content = RefSubject.map(options.state, (state) => state.errors[options.name] ?? "");
  return Dom.renderHost<HTMLDivElement>()<
    Options,
    ErrorProps<Values>,
    Renderable.Any,
    HostResult,
    Host
  >(
    options,
    host,
    errorProps(options),
    content,
    (props, value) => html`<div ...${props}>${value}</div>`,
  );
}

export interface SubmitOptions extends Dom.HostOptions<HTMLButtonElement> {
  readonly content: Renderable.Any;
}
function submitProps() {
  return () => ({ type: "submit" }) as const;
}
type SubmitProps = ReturnType<ReturnType<typeof submitProps>>;
export function Submit<const Options extends SubmitOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, SubmitProps>, Options["content"], Host>,
) {
  return Dom.renderHost<HTMLButtonElement>()<
    Options,
    SubmitProps,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    submitProps(),
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}

export interface ResetOptions<Values extends object> extends Dom.HostOptions<HTMLButtonElement> {
  readonly state: FormState<Values>;
  readonly content: Renderable.Any;
}
function resetProps<Values extends object>(options: ResetOptions<Values>) {
  return () =>
    ({
      type: "reset",
      onclick: EventHandler.make(() => reset(options.state), { preventDefault: true }),
    }) as const;
}
type ResetProps<Values extends object> = ReturnType<ReturnType<typeof resetProps<Values>>>;
export function Reset<
  const Values extends object,
  const Options extends ResetOptions<Values>,
  const Host extends HostResult = never,
>(
  options: Options & Pick<ResetOptions<Values>, "state" | "content">,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, ResetProps<Values>>,
    Options["content"],
    Host
  >,
) {
  return Dom.renderHost<HTMLButtonElement>()<
    Options,
    ResetProps<Values>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    resetProps(options),
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}

export interface GroupOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly content: Renderable.Any;
  readonly label?: string;
}
function groupProps<const Options extends GroupOptions>(options: Options) {
  return () => ({ role: "group", "aria-label": options.label }) as const;
}
type GroupProps<Options extends GroupOptions> = ReturnType<ReturnType<typeof groupProps<Options>>>;
export function Group<const Options extends GroupOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, GroupProps<Options>>,
    Options["content"],
    Host
  >,
) {
  return Dom.renderHost<HTMLDivElement>()<
    Options,
    GroupProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    groupProps(options),
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}

export interface PushOptions<
  Values extends object,
  Name extends ArrayFieldName<Values>,
> extends Dom.HostOptions<HTMLButtonElement> {
  readonly state: FormState<Values>;
  readonly name: Name;
  readonly value: ArrayFieldValue<Values, Name>;
  readonly content: Renderable.Any;
}
function pushProps<Values extends object, Name extends ArrayFieldName<Values>>(
  options: PushOptions<Values, Name>,
) {
  return () =>
    ({
      type: "button",
      onclick: EventHandler.make(() => pushValue(options.state, options.name, options.value)),
    }) as const;
}
type PushProps<Values extends object, Name extends ArrayFieldName<Values>> = ReturnType<
  ReturnType<typeof pushProps<Values, Name>>
>;
export function Push<
  const Values extends object,
  const Name extends ArrayFieldName<Values>,
  const Options extends PushOptions<Values, Name>,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, PushProps<Values, Name>>,
    Options["content"],
    Host
  >,
) {
  return Dom.renderHost<HTMLButtonElement>()<
    Options,
    PushProps<Values, Name>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    pushProps(options),
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}

export interface RemoveOptions<
  Values extends object,
  Name extends ArrayFieldName<Values>,
> extends Dom.HostOptions<HTMLButtonElement> {
  readonly state: FormState<Values>;
  readonly name: Name;
  readonly index: number;
  readonly content: Renderable.Any;
}
function removeProps<Values extends object, Name extends ArrayFieldName<Values>>(
  options: RemoveOptions<Values, Name>,
) {
  return () =>
    ({
      type: "button",
      onclick: EventHandler.make(() => removeValue(options.state, options.name, options.index)),
    }) as const;
}
type RemoveProps<Values extends object, Name extends ArrayFieldName<Values>> = ReturnType<
  ReturnType<typeof removeProps<Values, Name>>
>;
export function Remove<
  const Values extends object,
  const Name extends ArrayFieldName<Values>,
  const Options extends RemoveOptions<Values, Name>,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, RemoveProps<Values, Name>>,
    Options["content"],
    Host
  >,
) {
  return Dom.renderHost<HTMLButtonElement>()<
    Options,
    RemoveProps<Values, Name>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    removeProps(options),
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}
export function setValue<Values extends object, Key extends keyof Values & string, E, R>(
  state: RefSubject.RefSubject<State<Values>, E, R>,
  key: Key,
  value: Values[Key],
): Effect.Effect<State<Values>, E, R> {
  return updateDecodedValue(state, key, value);
}

function updateDecodedValue<Values extends object, Key extends keyof Values & string, Value, E, R>(
  state: RefSubject.RefSubject<State<Values>, E, R>,
  key: Key,
  value: Value,
): Effect.Effect<State<Values>, E, R> {
  return RefSubject.update(state, (current) => ({
    ...current,
    values: updateRecord(current.values, key, value),
    meta: {
      ...current.meta,
      [key]: { dirty: current.defaultValues[key] !== value, touched: true },
    },
  }));
}

function updateRecord<Values extends object, Key extends keyof Values & string, Value>(
  values: Values,
  key: Key,
  value: Value,
): Values {
  const updated = { ...values };
  Reflect.set(updated, key, value);
  return updated;
}
export function reset<Values extends object, E, R>(
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

export type BooleanFieldName<Values extends object> = FieldNameFor<Values, boolean>;
export type ArrayFieldName<Values extends object> = {
  [Key in keyof Values & string]: Values[Key] extends ReadonlyArray<unknown> ? Key : never;
}[keyof Values & string];
export type ArrayFieldValue<Values extends object, Name extends ArrayFieldName<Values>> =
  Values[Name] extends ReadonlyArray<infer Value> ? Value : never;

export function pushValue<Values extends object, Name extends ArrayFieldName<Values>, E, R>(
  state: RefSubject.RefSubject<State<Values>, E, R>,
  name: Name,
  value: ArrayFieldValue<Values, Name>,
): Effect.Effect<State<Values>, E, R> {
  return RefSubject.update(state, (current) => {
    const previous = Reflect.get(current.values, name);
    const values = Array.isArray(previous) ? [...previous, value] : [value];
    return {
      ...current,
      values: updateRecord(current.values, name, values),
      meta: { ...current.meta, [name]: { dirty: true, touched: true } },
    };
  });
}

export function removeValue<Values extends object, Name extends ArrayFieldName<Values>, E, R>(
  state: RefSubject.RefSubject<State<Values>, E, R>,
  name: Name,
  index: number,
): Effect.Effect<State<Values>, E, R> {
  return RefSubject.update(state, (current) => {
    const previous = Reflect.get(current.values, name);
    const values = Array.isArray(previous)
      ? previous.filter((_, currentIndex) => currentIndex !== index)
      : [];
    return {
      ...current,
      values: updateRecord(current.values, name, values),
      meta: { ...current.meta, [name]: { dirty: true, touched: true } },
    };
  });
}

export type ValidSubmitHandler<Values extends object, E = never, R = never> = (
  values: Values,
  event: SubmitEvent,
) => void | Effect.Effect<unknown, E, R>;

export interface FormOptions<
  Values extends object,
  E = never,
  R = never,
> extends Dom.HostOptions<HTMLFormElement> {
  readonly state: FormState<Values>;
  readonly content: Renderable.Any;
  readonly onValidSubmit?: ValidSubmitHandler<Values, E, R>;
}
function formProps<
  const Values extends object,
  E,
  R,
  const Options extends FormOptions<Values, E, R>,
>(options: Options) {
  const shouldHandleSubmit =
    isFormCodec(options.state.codec) || options.onValidSubmit !== undefined;
  return () =>
    ({
      ref: options.state,
      onsubmit: !shouldHandleSubmit
        ? undefined
        : EventHandler.make(
            (event: SubmitEvent) =>
              Effect.matchEffect(
                validate(options.state, new FormData(Dom.currentTarget<HTMLFormElement>(event))),
                {
                  onFailure: () => Effect.void,
                  onSuccess: (values) => {
                    const result = options.onValidSubmit?.(values, event);
                    return Effect.isEffect(result) ? result : Effect.void;
                  },
                },
              ),
            { preventDefault: true },
          ),
      onreset: EventHandler.make(() => reset(options.state), { preventDefault: true }),
    }) as const;
}
type FormProps<Values extends object, E, R, Options extends FormOptions<Values, E, R>> = ReturnType<
  ReturnType<typeof formProps<Values, E, R, Options>>
>;
export function Form<
  const Values extends object,
  E,
  R,
  const Options extends FormOptions<Values, E, R>,
  const Host extends HostResult = never,
>(
  options: Options & Pick<FormOptions<Values, E, R>, "state" | "content">,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, FormProps<Values, E, R, Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLFormElement>()<
    Options,
    FormProps<Values, E, R, Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, formProps(options), options.content, (props, content) => {
    const { props: attributes, ref } = Dom.splitRef(props);
    return html`<form ...${attributes} ref=${ref}>${content}</form>`;
  });
}
