import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import type { Fx } from "@typed/fx/Fx";
import { RefSubject } from "@typed/fx";
import { EventHandler, html, type Renderable, type RenderEvent, type RenderTemplate } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";
import * as NativePopover from "./NativePopover.js";

export interface State {
  readonly open: boolean;
}

export interface InitialState {
  readonly open?: boolean;
}

export const StateSchema = Schema.Struct({ open: Schema.Boolean });

export function makeState(initial: InitialState = {}) {
  return RefSubject.hydrate(StateSchema, { open: initial.open ?? false });
}

export function setOpen<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  open: boolean,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, open }));
}

export interface TriggerOptions extends Dom.HostOptions<HTMLButtonElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly controls?: string;
  readonly content: Renderable.Any;
}

function triggerInternalProps<const Options extends TriggerOptions>(options: Options) {
  const open = RefSubject.map(options.state, (state) => state.open);
  return ({ property }: Dom.InternalPropsHelpers<Options>) => ({
    type: "button",
    "aria-expanded": open,
    popovertarget: property("controls", undefined),
    popovertargetaction: options.controls === undefined ? undefined : "show",
    onclick:
      options.controls === undefined
        ? EventHandler.make(() => setOpen(options.state, true))
        : undefined,
    onkeydown: EventHandler.make((event: KeyboardEvent) => {
      if (event.key !== "Escape") return Effect.void;
      event.preventDefault();
      return setOpen(options.state, false);
    }),
  } as const);
}

type TriggerInternalProps<Options extends TriggerOptions> = ReturnType<
  ReturnType<typeof triggerInternalProps<Options>>
>;

export function Trigger<const Options extends TriggerOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, TriggerInternalProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLButtonElement>()<
    Options,
    TriggerInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    triggerInternalProps(options),
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}

export interface ContentOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly content: Renderable.Any;
}

function contentInternalProps<const Options extends ContentOptions>(options: Options) {
  return () => ({
    popover: "manual",
    onkeydown: EventHandler.make((event: KeyboardEvent) => {
      if (event.key !== "Escape") return Effect.void;
      event.preventDefault();
      return setOpen(options.state, false);
    }),
    onbeforetoggle: EventHandler.make((event: Event) =>
      setOpen(options.state, Dom.toggleState(event) === "open"),
    ),
    ontoggle: EventHandler.make((event: Event) =>
      setOpen(options.state, Dom.toggleState(event) === "open"),
    ),
    ref: Dom.composeRefs(options.state, NativePopover.ref(options.state)),
  } as const);
}

type ContentInternalProps<Options extends ContentOptions> = ReturnType<
  ReturnType<typeof contentInternalProps<Options>>
>;

export function Content<const Options extends ContentOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, ContentInternalProps<Options>>,
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
    ContentInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    contentInternalProps(options),
    options.content,
    (props, content) => {
      return html`<div ...${props}>${content}</div>`;
    },
  );
}
