import * as Effect from "effect/Effect";
import * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import type { Fx } from "@typed/fx/Fx";
import { RefSubject } from "@typed/fx";
import { EventHandler, html, type Renderable, type RenderEvent, type RenderTemplate } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";
import * as NativeDialog from "./NativeDialog.js";

export interface State {
  readonly open: boolean;
}

const dialogs = new WeakMap<
  RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  HTMLDialogElement
>();

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

export function close<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
): Effect.Effect<State, E, R> {
  return setOpen(state, false);
}

/** Requests the native dialog close lifecycle, including its cancel event. */
export function requestClose(
  state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  returnValue?: string,
): Effect.Effect<void> {
  return Effect.sync(() => {
    const dialog = dialogs.get(state);
    const requestClose = dialog === undefined ? undefined : Reflect.get(dialog, "requestClose");
    if (typeof requestClose === "function") requestClose.call(dialog, returnValue);
  });
}

export interface TriggerOptions extends Dom.HostOptions<HTMLButtonElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly controls?: string;
  readonly content: Renderable.Any;
}

function triggerInternalProps<const Options extends TriggerOptions>(options: Options) {
  const open = RefSubject.map(options.state, (state) => state.open);
  const show = EventHandler.make(() => setOpen(options.state, true));
  return ({ property }: Dom.InternalPropsHelpers<Options>) => ({
    type: "button",
    "aria-haspopup": "dialog",
    "aria-expanded": open,
    "aria-controls": property("controls", undefined),
    commandfor: property("controls", undefined),
    command: options.controls === undefined ? undefined : "show-modal",
    onclick: options.controls === undefined ? show : undefined,
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

interface ContentOptionsBase extends Dom.HostOptions<HTMLDialogElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly content: Renderable.Any;
  readonly id?: string;
  readonly describedBy?: Renderable.Any<string | null | undefined>;
  readonly modal?: boolean;
}

type AccessibleName =
  | {
      readonly label: Renderable.Any<string | null | undefined>;
      readonly labelledBy?: never;
    }
  | {
      readonly label?: never;
      readonly labelledBy: Renderable.Any<string | null | undefined>;
    }
  | {
      readonly label?: undefined;
      readonly labelledBy?: undefined;
    };

/** Supply either an explicit label or a labelled-by reference, never both. */
export type ContentOptions = ContentOptionsBase & AccessibleName;

function contentInternalProps<const Options extends ContentOptions>(options: Options) {
  const synchronize = NativeDialog.ref(options.state, { modal: options.modal });
  return ({ property }: Dom.InternalPropsHelpers<Options>) => ({
    id: property("id", undefined),
    "aria-labelledby": property("labelledBy", undefined),
    "aria-describedby": property("describedBy", undefined),
    "aria-label": property("label", undefined),
    oncancel: EventHandler.make(() => close(options.state)),
    onclose: EventHandler.make(() => close(options.state)),
    ontoggle: EventHandler.make((event: Event) =>
      setOpen(options.state, Dom.currentTarget<HTMLDialogElement>(event).open),
    ),
    ref: Dom.composeRefs(options.state, Dom.composeRefs(synchronize, dialogRef(options.state))),
  });
}

function dialogRef(
  state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
): (dialog: HTMLDialogElement) => Effect.Effect<void, never, Scope.Scope> {
  return (dialog) =>
    Effect.gen(function* () {
      dialogs.set(state, dialog);
      const scope = yield* Effect.scope;
      yield* Scope.addFinalizer(
        scope,
        Effect.sync(() => {
          if (dialogs.get(state) === dialog) dialogs.delete(state);
        }),
      );
    });
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
  return Dom.renderHost<HTMLDialogElement>()<
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
      return html`<dialog ...${attributes} ref=${ref}>${content}</dialog>`;
    },
  );
}

export const Dialog = Content;

export interface CloseOptions extends Dom.HostOptions<HTMLButtonElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly controls?: string;
  readonly content: Renderable.Any;
}

function closeInternalProps<const Options extends CloseOptions>(options: Options) {
  return ({ property }: Dom.InternalPropsHelpers<Options>) => ({
    type: "button",
    commandfor: property("controls", undefined),
    command: options.controls === undefined ? undefined : "request-close",
    onclick: EventHandler.make(() => close(options.state)),
  } as const);
}

type CloseInternalProps<Options extends CloseOptions> = ReturnType<
  ReturnType<typeof closeInternalProps<Options>>
>;

export function Close<const Options extends CloseOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, CloseInternalProps<Options>>,
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
    CloseInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    closeInternalProps(options),
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}

export const Dismiss = Close;
export const RequestClose = Close;

export interface HeadingOptions extends Dom.HostOptions<HTMLHeadingElement> {
  readonly content: Renderable.Any;
  readonly id?: string;
  readonly level?: 1 | 2 | 3 | 4 | 5 | 6;
}

function headingInternalProps<const Options extends HeadingOptions>() {
  return ({ property }: Dom.InternalPropsHelpers<Options>) => ({
    id: property("id", undefined),
    role: "heading",
    "aria-level": property("level", 2),
  } as const);
}

type HeadingInternalProps<Options extends HeadingOptions> = ReturnType<
  ReturnType<typeof headingInternalProps<Options>>
>;

export function Heading<const Options extends HeadingOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, HeadingInternalProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLHeadingElement>()<
    Options,
    HeadingInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    headingInternalProps(),
    options.content,
    (props, content) => html`<h2 ...${props}>${content}</h2>`,
  );
}

export interface DescriptionOptions extends Dom.HostOptions<HTMLParagraphElement> {
  readonly content: Renderable.Any;
  readonly id?: string;
}

function descriptionInternalProps<const Options extends DescriptionOptions>() {
  return ({ property }: Dom.InternalPropsHelpers<Options>) => ({ id: property("id", undefined) } as const);
}

type DescriptionInternalProps<Options extends DescriptionOptions> = ReturnType<ReturnType<typeof descriptionInternalProps<Options>>>;

export function Description<
  const Options extends DescriptionOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, DescriptionInternalProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLParagraphElement>()<
    Options,
    DescriptionInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    descriptionInternalProps<Options>(),
    options.content,
    (props, content) => html`<p ...${props}>${content}</p>`,
  );
}
