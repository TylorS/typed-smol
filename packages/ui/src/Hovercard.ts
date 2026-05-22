import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import { RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";
import type { Component, Content } from "./Reactive.js";

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
  const open = RefSubject.map(options.state, (state) => state.open);
  const onFocus = EventHandler.make(() => setOpen(options.state, true));
  const onMouseEnter = EventHandler.make(() => setOpen(options.state, true));

  return html`<span
    aria-controls=${id}
    aria-expanded=${open}
    onfocus=${onFocus}
    onmouseenter=${onMouseEnter}
  >
    ${options.content}
  </span>`;
}

export interface DisclosureOptions extends AnchorOptions {}

export function Disclosure<const Opts extends DisclosureOptions>(options: Opts): Component<Opts> {
  const id = RefSubject.map(options.state, (state) => state.id);
  const open = RefSubject.map(options.state, (state) => state.open);
  const onClick = EventHandler.make(() =>
    Effect.flatMap(options.state, (state) => setOpen(options.state, !state.open)),
  );

  return html`<button type="button" aria-controls=${id} aria-expanded=${open} onclick=${onClick}>
    ${options.content}
  </button>`;
}

export interface ContentOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly content: Content;
}

export function Content<const Opts extends ContentOptions>(options: Opts): Component<Opts> {
  const id = RefSubject.map(options.state, (state) => state.id);
  const hidden = RefSubject.map(options.state, (state) => !state.open);

  return html`<div id=${id} role="dialog" ?hidden=${hidden}>${options.content}</div>`;
}

export interface DismissOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly content: Content;
}

export function Dismiss<const Opts extends DismissOptions>(options: Opts): Component<Opts> {
  const onClick = EventHandler.make(() => setOpen(options.state, false));
  return html`<button type="button" onclick=${onClick}>${options.content}</button>`;
}

export function Arrow<const Opts extends { readonly content?: Content }>(
  options = {} as Opts,
): Component<Opts> {
  return html`<span aria-hidden="true">${options.content ?? ""}</span>`;
}

export function Heading<const Opts extends { readonly id?: string; readonly content: Content }>(
  options: Opts,
): Component<Opts> {
  return html`<div id=${options.id} role="heading" aria-level="1">${options.content}</div>`;
}

export function Description<const Opts extends { readonly id?: string; readonly content: Content }>(
  options: Opts,
): Component<Opts> {
  return html`<p id=${options.id}>${options.content}</p>`;
}
