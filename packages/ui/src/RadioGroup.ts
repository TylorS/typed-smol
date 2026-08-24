import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import type { Fx } from "@typed/fx/Fx";
import { RefSubject } from "@typed/fx";
import { EventHandler, html, type Renderable, type RenderEvent, type RenderTemplate } from "@typed/template";
import * as Collection from "./Collection.js";
import * as Composite from "./Composite.js";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

export interface State extends Omit<Composite.State, "orientation"> {
  readonly orientation: "vertical";
  readonly value: string;
}

export interface InitialState {
  readonly value: string;
  readonly activeId?: string | null;
  readonly loop?: boolean;
}

export const StateSchema = Schema.Struct({
  value: Schema.String,
  activeId: Schema.NullOr(Schema.String),
  orientation: Schema.Literals(["vertical"]),
  loop: Schema.Boolean,
  rtl: Schema.Boolean,
  virtualFocus: Schema.Boolean,
});

export function makeState(initial: InitialState) {
  return RefSubject.hydrate(StateSchema, {
    value: initial.value,
    activeId: initial.activeId ?? null,
    orientation: "vertical",
    loop: initial.loop ?? true,
    rtl: false,
    virtualFocus: false,
  });
}

export const makeCollection = Collection.makeState<string>;

export function setValue<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  value: string,
  activeId?: string,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, value, activeId: activeId ?? current.activeId }));
}

function move(
  state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  collection: RefSubject.RefSubject<Collection.State<string>>,
  direction: Composite.Move,
): Effect.Effect<State, Schema.SchemaError> {
  return Effect.gen(function* () {
    const current = yield* state;
    const items = yield* collection;
    const activeId = current.activeId ?? items.find((item) => item.value === current.value)?.id ?? null;
    const nextId = Composite.moveActiveId(items, { ...current, activeId }, direction);
    const item = nextId === null ? undefined : items.find((item) => item.id === nextId);
    if (item?.value === undefined) return current;
    const next = yield* setValue(state, item.value, item.id);
    yield* Composite.focusActive({ state, collection });
    return next;
  });
}

export interface RootOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly collection?: RefSubject.RefSubject<Collection.State<string>>;
  readonly content: Renderable.Any;
  readonly label?: Renderable.Any<string | null | undefined>;
}

function rootInternalProps<const Options extends RootOptions>(options: Options) {
  const onkeydown = options.collection === undefined ? undefined : EventHandler.make((event: KeyboardEvent) =>
    Effect.gen(function* () {
      const direction = Composite.keyMove(event, { orientation: "vertical" });
      if (direction === undefined) return;
      event.preventDefault();
      yield* move(options.state, options.collection!, direction);
    }),
  );
  return ({ property }: Dom.InternalPropsHelpers<Options>) => ({
    role: "radiogroup",
    "aria-label": property("label", undefined),
    onkeydown,
    ref: options.state,
  }) as const;
}
type RootInternalProps<Options extends RootOptions> = ReturnType<ReturnType<typeof rootInternalProps<Options>>>;

export function Root<const Options extends RootOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, RootInternalProps<Options>>, Options["content"], Host>,
): Fx<RenderEvent, Renderable.Error<Options | Host>, Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate> {
  return Dom.renderHost<HTMLDivElement>()<Options, RootInternalProps<Options>, Options["content"], HostResult, Host>(
    options,
    host,
    rootInternalProps(options),
    options.content,
    (props, content) => {
      const { props: attributes, ref } = Dom.splitRef(props);
      return html`<div ...${attributes} ref=${ref}>${content}</div>`;
    },
  );
}

export interface ItemOptions extends Dom.HostOptions<HTMLInputElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly collection?: RefSubject.RefSubject<Collection.State<string>>;
  readonly id: string;
  readonly value: string;
  readonly name?: string;
  readonly disabled?: boolean;
}

function itemInternalProps<const Options extends ItemOptions>(options: Options) {
  const checked = RefSubject.map(options.state, (state) => state.value === options.value);
  const register = options.collection === undefined ? undefined : Collection.ref(options.collection, {
    id: options.id,
    value: options.value,
    textValue: options.value,
    disabled: options.disabled,
  });
  return () => ({
    id: options.id,
    type: "radio",
    role: "radio",
    name: options.name,
    value: options.value,
    "?disabled": options.disabled ?? false,
    "aria-checked": checked,
    "aria-disabled": options.disabled ?? false,
    "?checked": checked,
    onchange: EventHandler.make(() =>
      options.disabled === true ? Effect.void : setValue(options.state, options.value, options.id),
    ),
    ref: Dom.composeRefs(register, options.ref),
  }) as const;
}
type ItemInternalProps<Options extends ItemOptions> = ReturnType<ReturnType<typeof itemInternalProps<Options>>>;

export function Item<const Options extends ItemOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, ItemInternalProps<Options>>, "", Host>,
): Fx<RenderEvent, Renderable.Error<Options | Host>, Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate> {
  return Dom.renderHost<HTMLInputElement>()<Options, ItemInternalProps<Options>, "", HostResult, Host>(
    options,
    host,
    itemInternalProps(options),
    "",
    (props) => html`<input ...${props}>`,
  );
}

export const RadioGroup = Root;
