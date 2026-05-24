import * as Effect from "effect/Effect";
import * as Stream from "effect/Stream";
import { drain, isFx, type Fx } from "@typed/fx/Fx";
import { EventHandler, html, type Renderable } from "@typed/template";
import type { AnyEffect, AnyFx, AnyStream, Component } from "./Reactive.js";

export type EventHandlerProperty = `on${string}`;
type AnyRenderable<A> = Renderable<A, any, any>;
type AnyTemplateEventHandler<Ev extends Event = any> = EventHandler.EventHandler<Ev, any, any>;
type AnyHostRenderer<Element extends globalThis.Element> = HostRenderer<Element, any, any, any>;

export type EventOf<Handler> =
  NonNullable<Handler> extends (this: any, event: infer Event, ...args: ReadonlyArray<any>) => any
    ? Event extends globalThis.Event
      ? Event
      : globalThis.Event
    : globalThis.Event;

export type ElementEventHandlers<Element extends globalThis.Element> = {
  readonly [K in keyof Element as K extends EventHandlerProperty ? K : never]?:
    | AnyEffect
    | AnyTemplateEventHandler<EventOf<Element[K]>>
    | null;
};

export type ElementRef<Element extends globalThis.Element> = {
  readonly ref?: (
    element: Element,
  ) =>
    | void
    | AnyEffect
    | AnyStream
    | AnyFx;
};

export type IfEquals<X, Y, Output> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? Output : never;

export type WritableKeys<T> = {
  [K in keyof T]-?: IfEquals<{ [P in K]: T[P] }, { -readonly [P in K]: T[P] }, K>;
}[keyof T];

export type ElementProperties<Element extends globalThis.Element> = {
  readonly [K in WritableKeys<Element> as K extends EventHandlerProperty | "ref"
    ? never
    : K]?: AnyRenderable<Element[K] | undefined>;
};

export type ElementOptions<Element extends globalThis.Element> = ElementEventHandlers<Element> &
  ElementRef<Element> &
  ElementProperties<Element>;

type StringAttributeValue = AnyRenderable<string | null | undefined>;
type AttributeValue = AnyRenderable<string | number | boolean | null | undefined>;
type BooleanAttributeValue = AnyRenderable<boolean | null | undefined>;
type StyleValue = AnyRenderable<string | CSSStyleDeclaration | Partial<CSSStyleDeclaration> | null | undefined>;
type PopoverTargetActionValue = AnyRenderable<"toggle" | "show" | "hide" | null | undefined>;

type HostEventHandlers = {
  readonly [K in EventHandlerProperty]?:
    | AnyEffect
    | AnyTemplateEventHandler
    | null;
};

export type TemplateAttributeProps = {
  readonly id?: StringAttributeValue;
  readonly class?: StringAttributeValue;
  readonly className?: StringAttributeValue;
  readonly for?: StringAttributeValue;
  readonly tabindex?: AttributeValue;
  readonly role?: StringAttributeValue;
  readonly style?: StyleValue;
  readonly popover?: StringAttributeValue;
  readonly popovertarget?: StringAttributeValue;
  readonly popovertargetaction?: PopoverTargetActionValue;
  readonly ".data"?: Readonly<Record<string, AnyRenderable<unknown>>>;
} & {
  readonly [K in `aria-${string}`]?: AttributeValue;
} & {
  readonly [K in `data-${string}`]?: AttributeValue;
} & {
  readonly [K in `?${string}`]?: BooleanAttributeValue;
};

export type BoundElementProperties<Element extends globalThis.Element> = {
  readonly [K in keyof Element as K extends string ? `.${K}` : never]?: AnyRenderable<
    Element[K] | undefined
  >;
};

export type HostProps<Element extends globalThis.Element> = Omit<
  ElementRef<Element> & ElementProperties<Element>,
  keyof TemplateAttributeProps
> &
  HostEventHandlers &
  TemplateAttributeProps &
  BoundElementProperties<Element>;

export type HostRenderer<Element extends globalThis.Element, A = unknown, E = never, R = never> = (
  props: HostProps<Element>,
  content: Renderable<unknown, E, R>,
) => Fx<A, E, R> | Effect.Effect<A, E, R>;

export interface HostOptions<Element extends globalThis.Element> {
  readonly host?: AnyHostRenderer<Element>;
  readonly props?: HostProps<Element>;
}

export type ElementByTagName = HTMLElementTagNameMap &
  Omit<SVGElementTagNameMap, keyof HTMLElementTagNameMap> &
  Omit<MathMLElementTagNameMap, keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap>;

export type OptionsByTagName = {
  readonly [Tag in keyof ElementByTagName]: ElementOptions<ElementByTagName[Tag]>;
};

export type OptionsForTag<Tag extends keyof ElementByTagName> = OptionsByTagName[Tag];

export type HostPropsByTagName = {
  readonly [Tag in keyof ElementByTagName]: HostProps<ElementByTagName[Tag]>;
};

export type HostPropsForTag<Tag extends keyof ElementByTagName> = HostPropsByTagName[Tag];

export type HostRendererForTag<Tag extends keyof ElementByTagName, A = unknown, E = never, R = never> =
  HostRenderer<ElementByTagName[Tag], A, E, R>;

type AnyHostRendererForTag<Tag extends keyof ElementByTagName> = HostRendererForTag<Tag, any, any, any>;

export interface HostOptionsForTag<Tag extends keyof ElementByTagName> {
  readonly host?: AnyHostRendererForTag<Tag>;
  readonly props?: HostPropsForTag<Tag>;
}

export type EventHandlerInput<Ev extends Event = Event, E = never, R = never> =
  | Effect.Effect<unknown, E, R>
  | EventHandler.EventHandler<Ev, E, R>
  | null
  | undefined;

export function chainEvent<Ev extends Event, E1 = never, R1 = never, E2 = never, R2 = never>(
  user: EventHandlerInput<Ev, E1, R1>,
  internal: EventHandlerInput<Ev, E2, R2>,
): EventHandler.EventHandler<Ev, E1 | E2, R1 | R2> | undefined {
  const userHandler = toEventHandler(user);
  const internalHandler = toEventHandler(internal);
  if (!userHandler && !internalHandler) return undefined;

  return EventHandler.make((event: Ev) =>
    Effect.gen(function* () {
      if (userHandler) yield* userHandler.handler(event);
      if (!event.defaultPrevented && internalHandler) yield* internalHandler.handler(event);
    }),
  );
}

export function composeRefs<Element extends globalThis.Element, E1 = never, R1 = never>(
  user: ElementRef<Element>["ref"] | null | undefined,
  internal?: ElementRef<Element>["ref"] | null,
): ((element: Element) => Effect.Effect<void, E1, R1>) | undefined {
  if (!user && !internal) return undefined;

  return (element) =>
    Effect.gen(function* () {
      yield* runRef(user, element);
      yield* runRef(internal, element);
    });
}

export function mergeProps<Element extends globalThis.Element>(
  user: HostProps<Element> | undefined,
  internal: HostProps<Element>,
): HostProps<Element> {
  if (!user) return internal;
  const merged: Record<string, unknown> = { ...user, ...internal };

  for (const [key, value] of Object.entries(user)) {
    if (isEventKey(key)) {
      merged[key] = chainEvent(
        value as EventHandlerInput<Event, any, any>,
        internal[key] as EventHandlerInput<Event, any, any>,
      );
    }
  }

  merged.ref = composeRefs(user.ref, internal.ref);
  return merged as HostProps<Element>;
}

export function renderHost<Element extends globalThis.Element, const Opts extends HostOptions<Element>>(
  options: Opts,
  internal: HostProps<Element>,
  content: AnyRenderable<unknown>,
  fallback: (
    props: HostProps<Element>,
    content: AnyRenderable<unknown>,
  ) => Component<Opts> | AnyEffect | AnyFx,
): Component<Opts> {
  const props = mergeProps(options.props, internal);
  return (options.host ? options.host(props, content) : fallback(toTemplateSpreadProps(props), content)) as Component<Opts>;
}

export function splitRef<Element extends globalThis.Element>(
  props: HostProps<Element>,
): { readonly props: Omit<HostProps<Element>, "ref">; readonly ref: ElementRef<Element>["ref"] | undefined } {
  const { ref, ...rest } = props;
  return { props: rest, ref };
}

export function renderDivHost<const Opts extends HostOptions<HTMLDivElement>>(
  props: HostProps<HTMLDivElement>,
  content: AnyRenderable<unknown>,
): Component<Opts> {
  const split = splitRef(toTemplateSpreadProps(props));
  return html`<div ...${split.props} ref=${split.ref}>${content}</div>` as Component<Opts>;
}

export function toTemplateSpreadProps<Element extends globalThis.Element>(
  props: HostProps<Element>,
): HostProps<Element> {
  const data = props[".data"];
  if (data === undefined) return props;

  const { ".data": _data, ...rest } = props;
  const spreadProps: Record<string, unknown> = { ...rest };
  for (const [key, value] of Object.entries(data)) {
    spreadProps[`data-${key}`] = value;
  }
  return spreadProps as HostProps<Element>;
}

function toEventHandler<Ev extends Event, E, R>(
  handler: EventHandlerInput<Ev, E, R>,
): EventHandler.EventHandler<Ev, E, R> | undefined {
  return handler == null ? undefined : EventHandler.fromEffectOrEventHandler(handler);
}

function runRef<Element extends globalThis.Element>(
  ref: ElementRef<Element>["ref"] | null | undefined,
  element: Element,
): Effect.Effect<void, any, any> {
  if (!ref) return Effect.void;
  const result = ref(element);
  if (Effect.isEffect(result)) return Effect.asVoid(result);
  if (Stream.isStream(result)) return Stream.runDrain(result);
  if (isFx(result)) return drain(result);
  return Effect.void;
}

function isEventKey(key: string): key is EventHandlerProperty {
  return key.startsWith("on");
}
