import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { gen } from "@typed/fx/Fx";
import { EventHandler, html } from "@typed/template";
import * as DataAttr from "./DataAttr.js";
import * as Dom from "./Dom.js";
import * as NativeDialog from "./NativeDialog.js";
import { makeRef, type AnyContent, type Component, type AnyValue } from "./Reactive.js";

type OptionalString = AnyValue<string | undefined>;
type RequiredString = AnyValue<string>;
type OptionalBoolean = AnyValue<boolean | undefined>;
type OptionalFocusTarget = AnyValue<NativeDialog.FocusTarget | undefined>;

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

export function setOpen<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  open: boolean,
): Effect.Effect<State, E, R> {
  return open ? NativeDialog.showModal(state) : NativeDialog.close(state);
}

export function close<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
): Effect.Effect<State, E, R> {
  return NativeDialog.close(state);
}

export interface TriggerOptions<E = never, R = never> extends Dom.HostOptions<HTMLButtonElement> {
  readonly state: RefSubject.RefSubject<State, E, R>;
  readonly controls?: OptionalString;
  readonly content: AnyContent;
}

export function Trigger<const E, const R, const Opts extends TriggerOptions<NoInfer<E>, NoInfer<R>>>(
  options: Opts & Pick<TriggerOptions<E, R>, "state">,
): Component<Opts> {
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

  return Dom.renderHost<HTMLButtonElement, Opts>(options, props, options.content, (props, content) =>
    html`<button ...${props}>${content}</button>`,
  );
}

export interface CloseOptions<E = never, R = never> extends Dom.HostOptions<HTMLButtonElement> {
  readonly state: RefSubject.RefSubject<State, E, R>;
  readonly content: AnyContent;
}

export function Close<const E, const R, const Opts extends CloseOptions<NoInfer<E>, NoInfer<R>>>(
  options: Opts & Pick<CloseOptions<E, R>, "state">,
): Component<Opts> {
  const onClick = EventHandler.make(() => close(options.state));
  const props = { type: "button", onclick: onClick } as const;

  return Dom.renderHost<HTMLButtonElement, Opts>(options, props, options.content, (props, content) =>
    html`<button ...${props}>${content}</button>`,
  );
}

export const Dismiss = Close;
export const Disclosure = Trigger;

export interface ContentOptions<E = never, R = never> extends Dom.HostOptions<HTMLDialogElement> {
  readonly state: RefSubject.RefSubject<State, E, R>;
  readonly id?: OptionalString;
  readonly label: RequiredString;
  readonly content: AnyContent;
  readonly modal?: OptionalBoolean;
  readonly initialFocus?: OptionalFocusTarget;
  readonly finalFocus?: OptionalFocusTarget;
  readonly closeOnEscape?: OptionalBoolean;
  readonly closeOnOutsideInteraction?: OptionalBoolean;
}

export function Content<const E, const R, const Opts extends ContentOptions<NoInfer<E>, NoInfer<R>>>(
  options: Opts & Pick<ContentOptions<E, R>, "state">,
): Component<Opts> {
  return gen(function* () {
    const modal = yield* makeRef(options.modal ?? true);
    const initialFocus = yield* makeRef(options.initialFocus);
    const finalFocus = yield* makeRef(options.finalFocus);
    const closeOnEscape = yield* makeRef(options.closeOnEscape ?? true);
    const closeOnOutsideInteraction = yield* makeRef(options.closeOnOutsideInteraction ?? false);
    const open = dataOpen(options.state);
    const onClose = EventHandler.make(() => NativeDialog.syncClosed(options.state));
    const onCancel = EventHandler.make((event: Event) =>
      Effect.gen(function* () {
        if ((yield* closeOnEscape) === false) {
          event.preventDefault();
          return;
        }
        yield* NativeDialog.close(options.state);
      }),
    );
    const onClick = EventHandler.make((event: MouseEvent) =>
      Effect.gen(function* () {
        if ((yield* closeOnOutsideInteraction) !== true) return;
        if (event.target !== event.currentTarget) return;
        yield* NativeDialog.close(options.state);
      }),
    );
    const props = {
      id: options.id,
      "aria-label": options.label,
      ".data": { open },
      onclose: onClose,
      oncancel: onCancel,
      onclick: onClick,
      ref: NativeDialog.register(options.state, {
        modal: yield* modal,
        initialFocus: yield* initialFocus,
        finalFocus: yield* finalFocus,
      }),
    } as const;

    return Dom.renderHost<HTMLDialogElement, Opts>(
      options,
      props,
      options.content,
      (props, content) => {
        const split = Dom.splitRef(props);
        return html`<dialog ...${split.props} ref=${split.ref}>${content}</dialog>`;
      },
    );
  });
}

export const Dialog = Content;

export function Heading<
  const Opts extends {
    readonly id?: OptionalString;
    readonly content: AnyContent;
  } & Dom.HostOptions<HTMLDivElement>,
>(options: Opts): Component<Opts> {
  return Dom.renderHost<HTMLDivElement, Opts>(
    options,
    { id: options.id, role: "heading", "aria-level": "1" },
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}

export function Description<
  const Opts extends {
    readonly id?: OptionalString;
    readonly content: AnyContent;
  } & Dom.HostOptions<HTMLParagraphElement>,
>(options: Opts): Component<Opts> {
  return Dom.renderHost<HTMLParagraphElement, Opts>(
    options,
    { id: options.id },
    options.content,
    (props, content) => html`<p ...${props}>${content}</p>`,
  );
}

function dataOpen<E, R>(state: RefSubject.RefSubject<State, E, R>) {
  return RefSubject.mapEffect(state, (value) =>
    DataAttr.encode(data, value).pipe(Effect.map((encoded) => encoded.open ?? "false")),
  );
}
