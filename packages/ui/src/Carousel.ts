import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import type { Fx } from "@typed/fx/Fx";
import { RefSubject } from "@typed/fx";
import {
  EventHandler,
  html,
  type Renderable,
  type RenderEvent,
  type RenderTemplate,
} from "@typed/template";
import * as Collection from "./Collection.js";
import * as Composite from "./Composite.js";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

export interface State {
  readonly activeId: string;
  readonly paused: boolean;
}

export interface InitialState {
  readonly activeId: string;
  readonly paused?: boolean;
}

export const StateSchema = Schema.Struct({ activeId: Schema.String, paused: Schema.Boolean });

export function makeState(initial: InitialState) {
  return RefSubject.hydrate(StateSchema, {
    activeId: initial.activeId,
    paused: initial.paused ?? true,
  });
}

export const makeCollection = Collection.makeState<string>;

export function select<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  activeId: string,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, activeId }));
}

export function move<E, R, E2, R2>(
  state: RefSubject.RefSubject<State, E, R>,
  collection: RefSubject.RefSubject<Collection.State<string>, E2, R2>,
  direction: "next" | "previous",
): Effect.Effect<State, E | E2, R | R2> {
  return Effect.gen(function* () {
    const next = Composite.moveActiveId(
      yield* collection,
      { activeId: (yield* state).activeId, loop: true },
      direction,
    );
    return next === null ? yield* state : yield* select(state, next);
  });
}

export function toggleRotation<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, paused: !current.paused }));
}

export interface RootOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly content: Renderable.Any;
  readonly label: Renderable.Any<string | null | undefined>;
}

function rootInternalProps<const Options extends RootOptions>(options: Options) {
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      role: "region",
      "aria-roledescription": "carousel",
      "aria-label": property("label", undefined),
      ref: options.state,
    }) as const;
}
type RootInternalProps<Options extends RootOptions> = ReturnType<
  ReturnType<typeof rootInternalProps<Options>>
>;

export function Root<const Options extends RootOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, RootInternalProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLDivElement>()<
    Options,
    RootInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, rootInternalProps(options), options.content, (props, content) => {
    const { props: attributes, ref } = Dom.splitRef(props);
    return html`<div ...${attributes} ref=${ref}>${content}</div>`;
  });
}

export interface SlideOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly collection?: RefSubject.RefSubject<Collection.State<string>>;
  readonly id: string;
  readonly label: Renderable.Any<string | null | undefined>;
  readonly content: Renderable.Any;
}

function slideInternalProps<const Options extends SlideOptions>(options: Options) {
  const register =
    options.collection === undefined
      ? undefined
      : Collection.ref(options.collection, {
          id: options.id,
          value: options.id,
          textValue: options.id,
        });
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      id: options.id,
      role: "group",
      "aria-roledescription": "slide",
      "aria-label": property("label", undefined),
      "?hidden": RefSubject.map(options.state, (state) => state.activeId !== options.id),
      ref: register,
    }) as const;
}
type SlideInternalProps<Options extends SlideOptions> = ReturnType<
  ReturnType<typeof slideInternalProps<Options>>
>;

export function Slide<const Options extends SlideOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, SlideInternalProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLDivElement>()<
    Options,
    SlideInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, slideInternalProps(options), options.content, (props, content) => {
    const { props: attributes, ref } = Dom.splitRef(props);
    return html`<div ...${attributes} ref=${ref}>${content}</div>`;
  });
}

export interface ControlOptions extends Dom.HostOptions<HTMLButtonElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly collection?: RefSubject.RefSubject<Collection.State<string>>;
  readonly content: Renderable.Any;
}

function controlInternalProps<const Options extends ControlOptions>(
  options: Options,
  action: () => Effect.Effect<unknown, Schema.SchemaError>,
) {
  return () => ({ type: "button", onclick: EventHandler.make(action) }) as const;
}

function control<const Options extends ControlOptions, const Host extends HostResult>(
  options: Options,
  host:
    | Dom.HostOverride<
        Dom.RenderHostProps<Options, ReturnType<ReturnType<typeof controlInternalProps<Options>>>>,
        Options["content"],
        Host
      >
    | undefined,
  action: () => Effect.Effect<unknown, Schema.SchemaError>,
) {
  const internal = controlInternalProps(options, action);
  return Dom.renderHost<HTMLButtonElement>()<
    Options,
    ReturnType<typeof internal>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    internal,
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}

export function Previous<
  const Options extends ControlOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, ReturnType<ReturnType<typeof controlInternalProps<Options>>>>,
    Options["content"],
    Host
  >,
) {
  return control(options, host, () =>
    options.collection === undefined
      ? Effect.void
      : move(options.state, options.collection, "previous"),
  );
}

export function Next<const Options extends ControlOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, ReturnType<ReturnType<typeof controlInternalProps<Options>>>>,
    Options["content"],
    Host
  >,
) {
  return control(options, host, () =>
    options.collection === undefined
      ? Effect.void
      : move(options.state, options.collection, "next"),
  );
}

export function RotationControl<
  const Options extends Omit<ControlOptions, "collection">,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, ReturnType<ReturnType<typeof controlInternalProps<Options>>>>,
    Options["content"],
    Host
  >,
) {
  return control(options, host, () => toggleRotation(options.state));
}
