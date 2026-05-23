import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import { RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";
import * as Dom from "./Dom.js";
import * as NativePopover from "./NativePopover.js";
import type { Component, Content, Value as ReactiveValue } from "./Reactive.js";

export interface State {
  readonly id: string;
  readonly open: boolean;
}

export interface InitialState {
  readonly id: string;
  readonly open?: boolean;
}

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
  readonly content: Content;
}

export function Anchor<const E, const R, const Opts extends AnchorOptions<NoInfer<E>, NoInfer<R>>>(
  options: Opts & Pick<AnchorOptions<E, R>, "state">,
): Component<Opts> {
  const id = RefSubject.map(options.state, (state) => state.id);
  const onFocus = EventHandler.make(() => setOpen(options.state, true));
  const onBlur = EventHandler.make(() => setOpen(options.state, false));
  const onMouseEnter = EventHandler.make(() => setOpen(options.state, true));
  const onMouseLeave = EventHandler.make(() => setOpen(options.state, false));

  const props = Dom.mergeProps(options.props, {
    "aria-describedby": id,
    onfocus: onFocus,
    onblur: onBlur,
    onmouseenter: onMouseEnter,
    onmouseleave: onMouseLeave,
  });

  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<span
    aria-describedby=${id}
    onfocus=${onFocus}
    onblur=${onBlur}
    onmouseenter=${onMouseEnter}
    onmouseleave=${onMouseLeave}
  >
    ${options.content}
  </span>`;
}

export interface ContentOptions<E = never, R = never> extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.RefSubject<State, E, R>;
  readonly content: Content;
  readonly placement?: ReactiveValue<string | undefined, any, any>;
}

export function Content<const E, const R, const Opts extends ContentOptions<NoInfer<E>, NoInfer<R>>>(
  options: Opts & Pick<ContentOptions<E, R>, "state">,
): Component<Opts> {
  const id = RefSubject.map(options.state, (state) => state.id);
  const open = RefSubject.map(options.state, (state) => String(state.open));
  const hidden = RefSubject.map(options.state, (state) => !state.open);
  const onToggle = EventHandler.make((event: ToggleEventLike) =>
    NativePopover.syncToggle(options.state, event),
  );

  const props = Dom.mergeProps(options.props, {
    id,
    role: "tooltip",
    popover: "hint",
    "data-placement": options.placement,
    "data-open": open,
    "?hidden": hidden,
    ontoggle: onToggle,
    ref: NativePopover.register(options.state),
  });

  if (options.host) return options.host(props, options.content) as Component<Opts>;

  const split = Dom.splitRef(props);
  const fallback = html`<div ...${split.props as any} ref=${split.ref as any}>${options.content}</div>`;
  return fallback as unknown as Component<Opts>;
}

export const Tooltip = Content;

export function Arrow<const Opts extends { readonly content?: Content } & Dom.HostOptions<HTMLSpanElement>>(
  options = {} as Opts,
): Component<Opts> {
  const props = Dom.mergeProps(options.props, { "aria-hidden": "true" });
  if (options.host) return options.host(props, options.content ?? "") as Component<Opts>;

  return html`<span ...${props}>${options.content ?? ""}</span>`;
}

interface ToggleEventLike extends Event {
  readonly newState?: string;
}
