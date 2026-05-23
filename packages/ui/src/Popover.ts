import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import * as Stream from "effect/Stream";
import { RefSubject } from "@typed/fx";
import * as FxRuntime from "@typed/fx/Fx";
import { EventHandler, html } from "@typed/template";
import * as DataAttr from "./DataAttr.js";
import * as Dom from "./Dom.js";
import * as NativePopover from "./NativePopover.js";
import type { Component, Content, Value as ReactiveValue } from "./Reactive.js";

type AnyContent = Content;
type OptionalString = ReactiveValue<string | undefined, any, any>;

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

export function setOpen<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  open: boolean,
): Effect.Effect<State, E, R> {
  return NativePopover.setOpen(state, open);
}

export interface TriggerOptions<E = never, R = never> extends Dom.HostOptions<HTMLButtonElement> {
  readonly state: RefSubject.RefSubject<State, E, R>;
  readonly content: AnyContent;
}

export function Trigger<const E, const R, const Opts extends TriggerOptions<NoInfer<E>, NoInfer<R>>>(
  options: Opts & Pick<TriggerOptions<E, R>, "state">,
): Component<Opts> {
  const id = RefSubject.map(options.state, (current) => current.id);
  const open = dataOpen(options.state);
  const props = {
    type: "button",
    popovertarget: id,
    popovertargetaction: "toggle",
    "aria-expanded": open,
    ".data": { open },
  } as const;

  if (options.host) {
    return options.host(Dom.mergeProps(options.props, props), options.content) as Component<Opts>;
  }

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

export interface AnchorOptions<E = never, R = never> extends Dom.HostOptions<HTMLSpanElement> {
  readonly state: RefSubject.RefSubject<State, E, R>;
  readonly content: AnyContent;
  readonly anchorName?: OptionalString;
}

export function Anchor<const E, const R, const Opts extends AnchorOptions<NoInfer<E>, NoInfer<R>>>(
  options: Opts & Pick<AnchorOptions<E, R>, "state">,
): Component<Opts> {
  const id = RefSubject.map(options.state, (current) => current.id);
  const style = anchorStyleValue(options.anchorName);
  const props = { popovertarget: id, style } as const;
  if (options.host) {
    return options.host(Dom.mergeProps(options.props, props), options.content) as Component<Opts>;
  }

  return html`<span popovertarget=${id} style=${style}>${options.content}</span>`;
}

export interface ContentOptions<E = never, R = never> extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.RefSubject<State, E, R>;
  readonly content: AnyContent;
  readonly positionAnchor?: OptionalString;
  readonly positionArea?: OptionalString;
}

export function Content<const E, const R, const Opts extends ContentOptions<NoInfer<E>, NoInfer<R>>>(
  options: Opts & Pick<ContentOptions<E, R>, "state">,
): Component<Opts> {
  const id = RefSubject.map(options.state, (current) => current.id);
  const mode = dataMode(options.state);
  const open = dataOpen(options.state);
  const style = positionStyleValue(options.positionAnchor, options.positionArea);
  const onToggle = EventHandler.make((event: ToggleEventLike) =>
    NativePopover.syncToggle(options.state, event),
  );
  const props = {
    id,
    popover: mode,
    style,
    ".data": { open, mode },
    "data-position-anchor": firstOptionalString(options.positionAnchor),
    "data-position-area": firstOptionalString(options.positionArea),
    ontoggle: onToggle,
    ref: NativePopover.register(options.state),
  } as const;

  if (options.host) {
    return options.host(Dom.mergeProps(options.props, props), options.content) as Component<Opts>;
  }

  const fallback = html`<div
    id=${id as any}
    popover=${mode as any}
    style=${style as any}
    .data=${{ open, mode } as any}
    data-position-anchor=${firstOptionalString(options.positionAnchor) as any}
    data-position-area=${firstOptionalString(options.positionArea) as any}
    ontoggle=${onToggle as any}
    ref=${NativePopover.register(options.state) as any}
  >
    ${options.content}
  </div>`;
  return fallback as unknown as Component<Opts>;
}

export const Popover = Content;

export function Dismiss<
  const E,
  const R,
  const Opts extends {
    readonly state: RefSubject.RefSubject<State, NoInfer<E>, NoInfer<R>>;
    readonly content: AnyContent;
  } & Dom.HostOptions<HTMLButtonElement>,
>(options: Opts & { readonly state: RefSubject.RefSubject<State, E, R> }): Component<Opts> {
  const id = RefSubject.map(options.state, (current) => current.id);
  const onClick = EventHandler.make((event: Event) =>
    NativePopover.hideFromEvent(options.state, event),
  );
  const props = {
    type: "button",
    popovertarget: id,
    popovertargetaction: "hide",
    onclick: onClick,
  } as const;

  if (options.host) {
    return options.host(Dom.mergeProps(options.props, props), options.content) as Component<Opts>;
  }

  return html`<button
    type="button"
    popovertarget=${id}
    popovertargetaction="hide"
    onclick=${onClick}
  >
    ${options.content}
  </button>`;
}

export function Arrow<
  const Opts extends { readonly content?: AnyContent } & Dom.HostOptions<HTMLSpanElement>,
>(
  options = {} as Opts,
): Component<Opts> {
  return Dom.renderHost<HTMLSpanElement, Opts>(
    options,
    { "aria-hidden": "true" },
    options.content ?? "",
    (props, content) => html`<span ...${props}>${content}</span>`,
  );
}

export const DisclosureArrow = Arrow;
export const PopoverDisclosureArrow = Arrow;

export function Heading<
  const Opts extends {
    readonly id?: string;
    readonly content: AnyContent;
  } & Dom.HostOptions<HTMLDivElement>,
>(
  options: Opts,
): Component<Opts> {
  return Dom.renderHost<HTMLDivElement, Opts>(
    options,
    { id: options.id, role: "heading", "aria-level": "1" },
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}

export function Description<
  const Opts extends {
    readonly id?: string;
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

interface ToggleEventLike extends Event {
  readonly newState?: string;
}

function dataOpen<E, R>(state: RefSubject.RefSubject<State, E, R>) {
  return RefSubject.mapEffect(state, (value) =>
    DataAttr.encode(data, value).pipe(Effect.map((encoded) => encoded.open ?? "false")),
  );
}

function dataMode<E, R>(state: RefSubject.RefSubject<State, E, R>) {
  return RefSubject.mapEffect(state, (value) =>
    DataAttr.encode(data, value).pipe(Effect.map((encoded) => encoded.mode ?? "auto")),
  );
}

function anchorStyle(anchorName: string | undefined): string | undefined {
  return anchorName === undefined ? undefined : `anchor-name: ${anchorName};`;
}

function anchorStyleValue(value: OptionalString | undefined): OptionalString | undefined {
  if (value === undefined) return undefined;
  if (Effect.isEffect(value)) return Effect.map(value, anchorStyle);
  if (Stream.isStream(value)) return Stream.map(value, anchorStyle);
  if (FxRuntime.isFx(value)) return FxRuntime.map(value, anchorStyle);
  return anchorStyle(value);
}

function positionStyleValue(
  positionAnchor: OptionalString | undefined,
  positionArea: OptionalString | undefined,
): OptionalString | undefined {
  if (positionAnchor === undefined && positionArea === undefined) return undefined;

  return Effect.all([firstOptionalString(positionAnchor), firstOptionalString(positionArea)]).pipe(
    Effect.map(([anchor, area]) => positionStyle(anchor, area)),
  );
}

function firstOptionalString(
  value: OptionalString | undefined,
): Effect.Effect<string | undefined, any, any> {
  if (value === undefined) return Effect.succeed(undefined);
  if (Effect.isEffect(value)) return value;
  if (Stream.isStream(value)) return Stream.runHead(value).pipe(Effect.map(Option.getOrUndefined));
  if (FxRuntime.isFx(value)) {
    return value.pipe(
      FxRuntime.collectUpTo(1),
      Effect.map((values) => values[0]),
    );
  }

  return Effect.succeed(value);
}

function positionStyle(
  positionAnchor: string | undefined,
  positionArea: string | undefined,
): string | undefined {
  if (positionAnchor === undefined && positionArea === undefined) return undefined;
  const anchorStyle = positionAnchor === undefined ? "" : `position-anchor: ${positionAnchor};`;
  const areaStyle = positionArea === undefined ? "" : ` position-area: ${positionArea};`;
  return `${anchorStyle}${areaStyle}`.trim();
}
