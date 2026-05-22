import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import { RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";
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

export function setOpen(state: RefSubject.RefSubject<State>, open: boolean): Effect.Effect<State> {
  return RefSubject.update(state, (current) => ({ ...current, open }));
}

export interface AnchorOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly content: Content;
}

export function Anchor<const Opts extends AnchorOptions>(options: Opts): Component<Opts> {
  const id = RefSubject.map(options.state, (state) => state.id);
  const onFocus = EventHandler.make(() => setOpen(options.state, true));
  const onBlur = EventHandler.make(() => setOpen(options.state, false));
  const onMouseEnter = EventHandler.make(() => setOpen(options.state, true));
  const onMouseLeave = EventHandler.make(() => setOpen(options.state, false));

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

export interface ContentOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly content: Content;
  readonly placement?: ReactiveValue<string | undefined, any, any>;
}

export function Content<const Opts extends ContentOptions>(options: Opts): Component<Opts> {
  const id = RefSubject.map(options.state, (state) => state.id);
  const hidden = RefSubject.map(options.state, (state) => !state.open);

  return html`<div id=${id} role="tooltip" data-placement=${options.placement} ?hidden=${hidden}>
    ${options.content}
  </div>`;
}

export function Arrow<const Opts extends { readonly content?: Content }>(
  options = {} as Opts,
): Component<Opts> {
  return html`<span aria-hidden="true">${options.content ?? ""}</span>`;
}
