import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";
import * as DataAttr from "./DataAttr.js";
import * as NativePopover from "./NativePopover.js";
import type { Component, Content } from "./Reactive.js";

type AnyContent = Content;
type OptionalString = string | undefined;

export interface State {
  readonly id: string;
  readonly open: boolean;
  readonly mode: "auto" | "hint" | "manual";
}

export const data = DataAttr.schema({
  open: Schema.Boolean,
  mode: Schema.Literals(["auto", "hint", "manual"]),
});

export function makeState(
  initial: State,
): Effect.Effect<RefSubject.RefSubject<State>, never, Scope.Scope> {
  return RefSubject.make(initial);
}

export function setOpen(state: RefSubject.RefSubject<State>, open: boolean): Effect.Effect<State> {
  return NativePopover.setOpen(state, open);
}

export interface TriggerOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly content: AnyContent;
}

export function Trigger<const Opts extends TriggerOptions>(options: Opts): Component<Opts> {
  const id = RefSubject.map(options.state, (current) => current.id);
  const open = dataOpen(options.state);

  return html`<button
    type="button"
    popovertarget=${id}
    popovertargetaction="toggle"
    aria-expanded=${open}
    .data=${{ open }}
  >
    ${options.content}
  </button>`;
}

export const Disclosure = Trigger;

export interface AnchorOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly content: AnyContent;
  readonly anchorName?: OptionalString;
}

export function Anchor<const Opts extends AnchorOptions>(options: Opts): Component<Opts> {
  const id = RefSubject.map(options.state, (current) => current.id);
  const style =
    options.anchorName === undefined ? undefined : `anchor-name: ${options.anchorName};`;
  return html`<span popovertarget=${id} style=${style}>${options.content}</span>`;
}

export interface ContentOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly content: AnyContent;
  readonly positionAnchor?: OptionalString;
  readonly positionArea?: OptionalString;
}

export function Content<const Opts extends ContentOptions>(options: Opts): Component<Opts> {
  const id = RefSubject.map(options.state, (current) => current.id);
  const mode = dataMode(options.state);
  const open = dataOpen(options.state);
  const style = positionStyle(options.positionAnchor, options.positionArea);
  const onToggle = EventHandler.make((event: ToggleEventLike) =>
    NativePopover.syncToggle(options.state, event),
  );

  return html`<div
    id=${id}
    popover=${mode}
    style=${style}
    .data=${{ open, mode }}
    data-position-anchor=${options.positionAnchor}
    data-position-area=${options.positionArea}
    ontoggle=${onToggle}
    ref=${NativePopover.register(options.state)}
  >
    ${options.content}
  </div>`;
}

export const Popover = Content;

export function Dismiss<
  const Opts extends { readonly state: RefSubject.RefSubject<State>; readonly content: AnyContent },
>(options: Opts): Component<Opts> {
  const id = RefSubject.map(options.state, (current) => current.id);
  const onClick = EventHandler.make((event: Event) =>
    NativePopover.hideFromEvent(options.state, event),
  );
  return html`<button
    type="button"
    popovertarget=${id}
    popovertargetaction="hide"
    onclick=${onClick}
  >
    ${options.content}
  </button>`;
}

export function Arrow<const Opts extends { readonly content?: AnyContent }>(
  options = {} as Opts,
): Component<Opts> {
  return html`<span aria-hidden="true">${options.content ?? ""}</span>`;
}

export const DisclosureArrow = Arrow;
export const PopoverDisclosureArrow = Arrow;

export function Heading<const Opts extends { readonly id?: string; readonly content: AnyContent }>(
  options: Opts,
): Component<Opts> {
  return html`<div id=${options.id} role="heading" aria-level="1">${options.content}</div>`;
}

export function Description<
  const Opts extends { readonly id?: string; readonly content: AnyContent },
>(options: Opts): Component<Opts> {
  return html`<p id=${options.id}>${options.content}</p>`;
}

interface ToggleEventLike extends Event {
  readonly newState?: "open" | "closed";
}

function dataOpen(state: RefSubject.RefSubject<State>) {
  return RefSubject.mapEffect(state, (value) =>
    DataAttr.encode(data, value).pipe(Effect.map((encoded) => encoded.open ?? "false")),
  );
}

function dataMode(state: RefSubject.RefSubject<State>) {
  return RefSubject.mapEffect(state, (value) =>
    DataAttr.encode(data, value).pipe(Effect.map((encoded) => encoded.mode ?? "auto")),
  );
}

function positionStyle(
  positionAnchor: OptionalString,
  positionArea: OptionalString,
): OptionalString | undefined {
  if (positionAnchor === undefined && positionArea === undefined) return undefined;
  const anchorStyle = positionAnchor === undefined ? "" : `position-anchor: ${positionAnchor};`;
  const areaStyle = positionArea === undefined ? "" : ` position-area: ${positionArea};`;
  return `${anchorStyle}${areaStyle}`.trim();
}
