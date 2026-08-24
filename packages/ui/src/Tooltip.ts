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
  readonly id: string;
  readonly open: boolean;
}

export interface InitialState {
  readonly id: string;
  readonly open?: boolean;
}

export const StateSchema = Schema.Struct({ id: Schema.String, open: Schema.Boolean });

export function makeState(initial: InitialState) {
  return RefSubject.hydrate(StateSchema, { id: initial.id, open: initial.open ?? false });
}

export function setOpen<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  open: boolean,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, open }));
}

export interface AnchorOptions extends Dom.HostOptions<HTMLSpanElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly content: Renderable.Any;
  readonly showDelay?: number;
  readonly hideDelay?: number;
}

function anchorInternalProps<const Options extends AnchorOptions>(options: Options) {
  let scheduleVersion = 0;
  const schedule = (open: boolean, delay: number) =>
    Effect.gen(function* () {
      const version = ++scheduleVersion;
      if (delay > 0) yield* Effect.sleep(delay);
      if (version === scheduleVersion) yield* setOpen(options.state, open);
    });
  const id = RefSubject.map(options.state, (state) => state.id);

  return () => ({
    "aria-describedby": id,
    onfocus: EventHandler.make(() => schedule(true, options.showDelay ?? 0)),
    onblur: EventHandler.make(() => schedule(false, options.hideDelay ?? 0)),
    onkeydown: EventHandler.make((event: KeyboardEvent) =>
      event.key === "Escape" ? setOpen(options.state, false) : Effect.void,
    ),
    onmouseenter: EventHandler.make(() => schedule(true, options.showDelay ?? 0)),
    onmouseleave: EventHandler.make(() => schedule(false, options.hideDelay ?? 0)),
  } as const);
}

type AnchorInternalProps<Options extends AnchorOptions> = ReturnType<
  ReturnType<typeof anchorInternalProps<Options>>
>;

export function Anchor<const Options extends AnchorOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, AnchorInternalProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLSpanElement>()<
    Options,
    AnchorInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    anchorInternalProps(options),
    options.content,
    (props, content) => html`<span ...${props}>${content}</span>`,
  );
}

export interface ContentOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly content: Renderable.Any;
}

function contentInternalProps<const Options extends ContentOptions>(options: Options) {
  const id = RefSubject.map(options.state, (state) => state.id);
  return () => ({
    id,
    role: "tooltip",
    popover: "manual",
    onkeydown: EventHandler.make((event: KeyboardEvent) =>
      event.key === "Escape" ? setOpen(options.state, false) : Effect.void,
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
      const { props: attributes, ref } = Dom.splitRef(props);
      return html`<div ...${attributes} ref=${ref}>${content}</div>`;
    },
  );
}

export const Tooltip = Content;
