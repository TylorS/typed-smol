import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";
import * as DataAttr from "./DataAttr.js";
import * as Dom from "./Dom.js";
import * as NativePopover from "./NativePopover.js";
import type { AnyContent, Component } from "./Reactive.js";

export interface State {
  readonly id: string;
  readonly open: boolean;
}

export interface InitialState {
  readonly id: string;
  readonly open?: boolean;
}

export const data = DataAttr.schema({
  id: Schema.String,
  open: Schema.Boolean,
});

export const component = "typed/ui/Hovercard";

export function makeState(
  initial: InitialState,
): Effect.Effect<RefSubject.RefSubject<State>, never, Scope.Scope> {
  return RefSubject.make({ id: initial.id, open: initial.open ?? false });
}

export function setOpen<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  open: boolean,
): Effect.Effect<State, E, R> {
  return NativePopover.setOpen(state, open);
}

export interface AnchorOptions<E = never, R = never> extends Dom.HostOptions<HTMLSpanElement> {
  readonly state: RefSubject.RefSubject<State, E, R>;
  readonly content: AnyContent;
}

export function Anchor<const E, const R, const Opts extends AnchorOptions<NoInfer<E>, NoInfer<R>>>(
  options: Opts & Pick<AnchorOptions<E, R>, "state">,
): Component<Opts> {
  const id = RefSubject.map(options.state, (state) => state.id);
  const open = RefSubject.map(options.state, (state) => state.open);
  const onFocus = EventHandler.make(() => setOpen(options.state, true));
  const onBlur = EventHandler.make(() => setOpen(options.state, false));
  const onMouseEnter = EventHandler.make(() => setOpen(options.state, true));
  const onMouseLeave = EventHandler.make(() => setOpen(options.state, false));

  const props = {
    "aria-controls": id,
    "aria-expanded": open,
    "data-ui": component,
    onfocus: onFocus,
    onblur: onBlur,
    onmouseenter: onMouseEnter,
    onmouseleave: onMouseLeave,
  };

  return Dom.renderHost<HTMLSpanElement, Opts>(options, props, options.content, (props, content) =>
    html`<span ...${props}>${content}</span>`,
  );
}

export interface DisclosureOptions<E = never, R = never> extends Dom.HostOptions<HTMLButtonElement> {
  readonly state: RefSubject.RefSubject<State, E, R>;
  readonly content: AnyContent;
}

export function Disclosure<const E, const R, const Opts extends DisclosureOptions<NoInfer<E>, NoInfer<R>>>(
  options: Opts & Pick<DisclosureOptions<E, R>, "state">,
): Component<Opts> {
  const id = RefSubject.map(options.state, (state) => state.id);
  const open = RefSubject.map(options.state, (state) => state.open);
  const onClick = EventHandler.make(() =>
    Effect.flatMap(options.state, (state) => setOpen(options.state, !state.open)),
  );

  const props = {
    type: "button",
    popovertarget: id,
    popovertargetaction: "toggle",
    "aria-controls": id,
    "aria-expanded": open,
    onclick: onClick,
  } as const;

  return Dom.renderHost<HTMLButtonElement, Opts>(options, props, options.content, (props, content) =>
    html`<button ...${props}>${content}</button>`,
  );
}

export interface ContentOptions<E = never, R = never> extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.RefSubject<State, E, R>;
  readonly content: AnyContent;
}

export function Content<const E, const R, const Opts extends ContentOptions<NoInfer<E>, NoInfer<R>>>(
  options: Opts & Pick<ContentOptions<E, R>, "state">,
): Component<Opts> {
  const id = RefSubject.map(options.state, (state) => state.id);
  const open = RefSubject.map(options.state, (state) => String(state.open));
  const onToggle = EventHandler.make((event: ToggleEventLike) =>
    NativePopover.syncToggle(options.state, event),
  );

  const props = {
    id,
    role: "dialog",
    popover: "auto",
    "data-ui": component,
    "data-open": open,
    ontoggle: onToggle,
    ref: NativePopover.register(options.state),
  };

  return Dom.renderHost<HTMLDivElement, Opts>(options, props, options.content, Dom.renderDivHost);
}

export const Hovercard = Content;

export interface DismissOptions<E = never, R = never> extends Dom.HostOptions<HTMLButtonElement> {
  readonly state: RefSubject.RefSubject<State, E, R>;
  readonly content: AnyContent;
}

export function Dismiss<const E, const R, const Opts extends DismissOptions<NoInfer<E>, NoInfer<R>>>(
  options: Opts & Pick<DismissOptions<E, R>, "state">,
): Component<Opts> {
  const id = RefSubject.map(options.state, (state) => state.id);
  const onClick = EventHandler.make((event: Event) =>
    NativePopover.hideFromEvent(options.state, event),
  );
  const props = {
    type: "button",
    popovertarget: id,
    popovertargetaction: "hide",
    onclick: onClick,
  } as const;

  return Dom.renderHost<HTMLButtonElement, Opts>(options, props, options.content, (props, content) =>
    html`<button ...${props}>${content}</button>`,
  );
}

export interface ArrowOptions extends Dom.HostOptions<HTMLSpanElement> {
  readonly content?: AnyContent;
}

export function Arrow<const Opts extends ArrowOptions>(
  options = {} as Opts,
): Component<Opts> {
  return Dom.renderHost<HTMLSpanElement, Opts>(
    options,
    { "aria-hidden": "true" },
    options.content ?? "",
    (props, content) => html`<span ...${props}>${content}</span>`,
  );
}

export interface HeadingOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly id?: string;
  readonly content: AnyContent;
}

export function Heading<const Opts extends HeadingOptions>(
  options: Opts,
): Component<Opts> {
  const props = {
    id: options.id,
    role: "heading",
    "aria-level": "1",
  };
  return Dom.renderHost<HTMLDivElement, Opts>(options, props, options.content, (props, content) =>
    html`<div ...${props}>${content}</div>`,
  );
}

export interface DescriptionOptions extends Dom.HostOptions<HTMLParagraphElement> {
  readonly id?: string;
  readonly content: AnyContent;
}

export function Description<const Opts extends DescriptionOptions>(
  options: Opts,
): Component<Opts> {
  return Dom.renderHost<HTMLParagraphElement, Opts>(
    options,
    { id: options.id },
    options.content,
    (props, content) => html`<p ...${props}>${content}</p>`,
  );
}

interface ToggleEventLike extends Event {
  readonly newState?: string;
}
