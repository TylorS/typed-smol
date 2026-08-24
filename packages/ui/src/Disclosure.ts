import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import type { Fx } from "@typed/fx/Fx";
import { RefSubject } from "@typed/fx";
import { EventHandler, html, type Renderable, type RenderEvent, type RenderTemplate } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";
import * as NativeDetails from "./NativeDetails.js";

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

export interface ButtonOptions extends Dom.HostOptions<HTMLElement> {
  readonly content: Renderable.Any;
}

function buttonInternalProps() {
  return () => ({} as const);
}

type ButtonInternalProps = ReturnType<ReturnType<typeof buttonInternalProps>>;

export function Button<const Options extends ButtonOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, ButtonInternalProps>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLElement>()<
    Options,
    ButtonInternalProps,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    buttonInternalProps(),
    options.content,
    (props, content) => html`<summary ...${props}>${content}</summary>`,
  );
}

export interface ContentOptions extends Dom.HostOptions<HTMLDetailsElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly content: Renderable.Any;
}

function contentInternalProps<const Options extends ContentOptions>(options: Options) {
  return () => ({
    ontoggle: EventHandler.make((event: Event) =>
      setOpen(options.state, Dom.currentTarget<HTMLDetailsElement>(event).open),
    ),
    ref: Dom.composeRefs(options.state, NativeDetails.ref(options.state)),
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
  return Dom.renderHost<HTMLDetailsElement>()<
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
      return html`<details ...${attributes} ref=${ref}>${content}</details>`;
    },
  );
}

export const Disclosure = Content;
