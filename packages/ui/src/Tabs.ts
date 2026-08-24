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

export type ActivationMode = "automatic" | "manual";
export type Orientation = "horizontal" | "vertical";

export interface State extends Omit<Composite.State, "orientation"> {
  readonly orientation: Orientation;
  readonly selectedId: string;
  readonly activeId: string;
  readonly activationMode: ActivationMode;
}

export interface InitialState {
  readonly selectedId: string;
  readonly activeId?: string;
  readonly activationMode?: ActivationMode;
  readonly orientation?: Orientation;
  readonly loop?: boolean;
  readonly rtl?: boolean;
}

export const StateSchema = Schema.Struct({
  selectedId: Schema.String,
  activeId: Schema.String,
  activationMode: Schema.Literals(["automatic", "manual"]),
  orientation: Schema.Literals(["horizontal", "vertical"]),
  loop: Schema.Boolean,
  rtl: Schema.Boolean,
  virtualFocus: Schema.Boolean,
});

export function makeState(initial: InitialState) {
  return RefSubject.hydrate(StateSchema, {
    selectedId: initial.selectedId,
    activeId: initial.activeId ?? initial.selectedId,
    activationMode: initial.activationMode ?? "automatic",
    orientation: initial.orientation ?? "horizontal",
    loop: initial.loop ?? true,
    rtl: initial.rtl ?? false,
    virtualFocus: false,
  });
}

export const makeCollection = Collection.makeState<string>;

export function select<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  selectedId: string,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, activeId: selectedId, selectedId }));
}

export function move<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  items: readonly Collection.Item[],
  direction: Composite.Move,
): Effect.Effect<State, E, R> {
  return Effect.gen(function* () {
    const current = yield* state;
    const activeId = Composite.moveActiveId(items, current, direction);
    if (activeId === null) return current;
    return yield* RefSubject.update(state, (value) => ({
      ...value,
      activeId,
      selectedId: value.activationMode === "automatic" ? activeId : value.selectedId,
    }));
  });
}

function moveAndFocus(
  state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  collection: RefSubject.RefSubject<Collection.State<string>>,
  direction: Composite.Move,
): Effect.Effect<State, Schema.SchemaError> {
  return Effect.gen(function* () {
    const next = yield* move(state, yield* collection, direction);
    yield* Composite.focusActive({ state, collection });
    yield* Composite.scrollActive({ state, collection });
    return next;
  });
}

export interface ListOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly content: Renderable.Any;
  readonly label?: Renderable.Any<string | null | undefined>;
  readonly items?: readonly Collection.Item[];
  readonly collection?: RefSubject.RefSubject<Collection.State<string>>;
}

function listInternalProps<const Options extends ListOptions>(options: Options) {
  const orientation = RefSubject.map(options.state, (state) => state.orientation);
  const onkeydown =
    options.collection === undefined && options.items === undefined
      ? undefined
      : EventHandler.make((event: KeyboardEvent) =>
          Effect.gen(function* () {
            const direction = Composite.keyMove(event, yield* options.state);
            if (direction !== undefined) {
              event.preventDefault();
              if (options.collection !== undefined) {
                yield* moveAndFocus(options.state, options.collection, direction);
              } else {
                yield* move(options.state, options.items!, direction);
              }
              return;
            }
            if ((event.key === "Enter" || event.key === " ") && (yield* options.state).activationMode === "manual") {
              event.preventDefault();
              yield* select(options.state, (yield* options.state).activeId);
            }
          }),
        );
  return ({ property }: Dom.InternalPropsHelpers<Options>) => ({
    role: "tablist",
    "aria-label": property("label", undefined),
    "aria-orientation": orientation,
    onkeydown,
    ref: options.state,
  } as const);
}

type ListInternalProps<Options extends ListOptions> = ReturnType<
  ReturnType<typeof listInternalProps<Options>>
>;

export function List<const Options extends ListOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, ListInternalProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<RenderEvent, Renderable.Error<Options | Host>, Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate> {
  return Dom.renderHost<HTMLDivElement>()<Options, ListInternalProps<Options>, Options["content"], HostResult, Host>(
    options,
    host,
    listInternalProps(options),
    options.content,
    (props, content) => {
      const { props: attributes, ref } = Dom.splitRef(props);
      return html`<div ...${attributes} ref=${ref}>${content}</div>`;
    },
  );
}

export interface TabOptions extends Dom.HostOptions<HTMLButtonElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly id: string;
  readonly panelId: string;
  readonly content: Renderable.Any;
  readonly collection?: RefSubject.RefSubject<Collection.State<string>>;
  readonly disabled?: boolean;
}

function tabInternalProps<const Options extends TabOptions>(options: Options) {
  const selected = RefSubject.map(options.state, (state) => state.selectedId === options.id);
  const register = options.collection === undefined ? undefined : Collection.ref(options.collection, {
    id: options.id,
    value: options.id,
    textValue: options.id,
    disabled: options.disabled,
  });
  return () => ({
    id: options.id,
    type: "button",
    role: "tab",
    "aria-controls": options.panelId,
    "aria-selected": selected,
    "aria-disabled": options.disabled ?? false,
    tabindex: Composite.tabIndex(options.state, options.id),
    onclick: EventHandler.make(() => options.disabled === true ? Effect.void : select(options.state, options.id)),
    onfocus: EventHandler.make(() =>
      options.disabled === true
        ? Effect.void
        : RefSubject.update(options.state, (state) => state.activationMode === "automatic"
          ? { ...state, activeId: options.id, selectedId: options.id }
          : { ...state, activeId: options.id }),
    ),
    ref: Dom.composeRefs(register, options.ref),
  } as const);
}

type TabInternalProps<Options extends TabOptions> = ReturnType<ReturnType<typeof tabInternalProps<Options>>>;

export function Tab<const Options extends TabOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, TabInternalProps<Options>>, Options["content"], Host>,
): Fx<RenderEvent, Renderable.Error<Options | Host>, Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate> {
  return Dom.renderHost<HTMLButtonElement>()<Options, TabInternalProps<Options>, Options["content"], HostResult, Host>(
    options,
    host,
    tabInternalProps(options),
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}

export interface PanelOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly id: string;
  readonly tabId: string;
  readonly content: Renderable.Any;
}

function panelInternalProps<const Options extends PanelOptions>(options: Options) {
  const selected = RefSubject.map(options.state, (state) => state.selectedId === options.tabId);
  return () => ({
    id: options.id,
    role: "tabpanel",
    "aria-labelledby": options.tabId,
    "?hidden": RefSubject.map(selected, (value) => !value),
  } as const);
}

type PanelInternalProps<Options extends PanelOptions> = ReturnType<
  ReturnType<typeof panelInternalProps<Options>>
>;

export function Panel<const Options extends PanelOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, PanelInternalProps<Options>>, Options["content"], Host>,
): Fx<RenderEvent, Renderable.Error<Options | Host>, Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate> {
  return Dom.renderHost<HTMLDivElement>()<Options, PanelInternalProps<Options>, Options["content"], HostResult, Host>(
    options,
    host,
    panelInternalProps(options),
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}
