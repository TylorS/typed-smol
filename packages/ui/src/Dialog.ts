import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";
import * as DataAttr from "./DataAttr.js";
import * as Dom from "./Dom.js";
import * as NativeDialog from "./NativeDialog.js";
import type { Component, Content, Value as ReactiveValue } from "./Reactive.js";

type AnyContent = Content;
type OptionalString = ReactiveValue<string | undefined, any, any>;
type RequiredString = ReactiveValue<string, any, any>;

export interface State {
  readonly open: boolean;
}

export const data = DataAttr.schema({
  open: Schema.Boolean,
});

export function makeState(
  initial: State,
): Effect.Effect<RefSubject.RefSubject<State>, never, Scope.Scope> {
  return RefSubject.make(initial);
}

export function setOpen(state: RefSubject.RefSubject<State>, open: boolean): Effect.Effect<State> {
  return open ? NativeDialog.showModal(state) : NativeDialog.close(state);
}

export function close(state: RefSubject.RefSubject<State>): Effect.Effect<State> {
  return NativeDialog.close(state);
}

export interface TriggerOptions extends Dom.HostOptions<HTMLButtonElement> {
  readonly state: RefSubject.RefSubject<State>;
  readonly controls?: OptionalString;
  readonly content: AnyContent;
}

export function Trigger<const Opts extends TriggerOptions>(options: Opts): Component<Opts> {
  const open = dataOpen(options.state);
  const onClick = EventHandler.make((event: MouseEvent) =>
    NativeDialog.showModal(
      options.state,
      (event.currentTarget ?? event.target) as HTMLButtonElement,
    ),
  );
  const props = {
    type: "button",
    "aria-haspopup": "dialog",
    "aria-expanded": open,
    "aria-controls": options.controls,
    ".data": { open },
    onclick: onClick,
  } as const;

  if (options.host) return options.host(props, options.content) as Component<Opts>;
  return html`<button
    type="button"
    aria-haspopup="dialog"
    aria-expanded=${open}
    aria-controls=${options.controls}
    .data=${{ open }}
    onclick=${onClick}
  >
    ${options.content}
  </button>`;
}

export interface CloseOptions extends Dom.HostOptions<HTMLButtonElement> {
  readonly state: RefSubject.RefSubject<State>;
  readonly content: AnyContent;
}

export function Close<const Opts extends CloseOptions>(options: Opts): Component<Opts> {
  const onClick = EventHandler.make(() => close(options.state));
  const props = { type: "button", onclick: onClick } as const;

  if (options.host) return options.host(props, options.content) as Component<Opts>;
  return html`<button type="button" onclick=${onClick}>${options.content}</button>`;
}

export const Dismiss = Close;
export const Disclosure = Trigger;

export interface ContentOptions extends Dom.HostOptions<HTMLDialogElement> {
  readonly state: RefSubject.RefSubject<State>;
  readonly id?: OptionalString;
  readonly label: RequiredString;
  readonly content: AnyContent;
}

export function Content<const Opts extends ContentOptions>(options: Opts): Component<Opts> {
  const open = dataOpen(options.state);
  const onClose = EventHandler.make(() => NativeDialog.syncClosed(options.state));
  const props = {
    id: options.id,
    "aria-label": options.label,
    ".data": { open },
    onclose: onClose,
    oncancel: onClose,
    ref: NativeDialog.register(options.state),
  } as const;

  if (options.host) return options.host(props, options.content) as Component<Opts>;
  return html`<dialog
    id=${options.id}
    aria-label=${options.label}
    .data=${{ open }}
    onclose=${onClose}
    oncancel=${onClose}
    ref=${NativeDialog.register(options.state)}
  >
    ${options.content}
  </dialog>`;
}

export const Dialog = Content;

export function Heading<
  const Opts extends { readonly id?: OptionalString; readonly content: AnyContent },
>(options: Opts): Component<Opts> {
  return html`<div id=${options.id} role="heading" aria-level="1">${options.content}</div>`;
}

export function Description<
  const Opts extends { readonly id?: OptionalString; readonly content: AnyContent },
>(options: Opts): Component<Opts> {
  return html`<p id=${options.id}>${options.content}</p>`;
}

function dataOpen(state: RefSubject.RefSubject<State>) {
  return RefSubject.mapEffect(state, (value) =>
    DataAttr.encode(data, value).pipe(Effect.map((encoded) => encoded.open ?? "false")),
  );
}
