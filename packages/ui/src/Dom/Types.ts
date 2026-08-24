import type * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import type * as Stream from "effect/Stream";
import type { RefSubject } from "@typed/fx";
import type { Fx } from "@typed/fx/Fx";
import type { EventHandler, Renderable, RenderEvent, RenderTemplate } from "@typed/template";

export type RenderableInput<A = any> = Renderable.Any<A>;
export type EffectInput<A = any> =
  | Effect.Effect<A, any, any>
  | Effect.Effect<A, never, never>
  | Effect.Effect<never, any, any>
  | Effect.Effect<never, never, any>;
export type FxInput<A = any> =
  | Fx<A, any, any>
  | Fx<A, never, never>
  | Fx<never, any, any>
  | Fx<never, never, any>;
export type HostResult = FxInput<RenderEvent> | EffectInput<RenderEvent>;

export type EventHandlerProperty = `on${string}` | `@${string}`;

export type EventOf<Handler> =
  NonNullable<Handler> extends (...args: infer Args) => any
    ? Args[0] extends globalThis.Event
      ? Args[0]
      : globalThis.Event
    : globalThis.Event;

export type ElementEventHandlers<Element extends globalThis.Element> = {
  readonly [K in keyof Element as K extends `on${string}` ? K : never]?:
    | EffectInput
    | EventHandler.EventHandler<EventOf<Element[K]>, any, any>
    | null;
};

export type TemplateEventHandlers = {
  readonly [K in `@${string}`]?: EffectInput | EventHandler.EventHandler<Event, any, any> | null;
};

export type ElementRefCallback<Element extends globalThis.Element> = (
  element: Element,
) =>
  | void
  | EffectInput
  | Stream.Stream<any, any, any>
  | Stream.Stream<any, never, never>
  | Fx<any, any, any>
  | Fx<any, never, never>;

export type ElementRef<Element extends globalThis.Element> = {
  readonly ref?: ElementRefCallback<Element> | RefSubject.HydrationRef<any, any>;
};

export type IfEquals<X, Y, Output> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? Output : never;

export type WritableKeys<T> = {
  [K in keyof T]-?: IfEquals<{ [P in K]: T[P] }, { -readonly [P in K]: T[P] }, K>;
}[keyof T];

export type ElementProperties<Element extends globalThis.Element> = {
  readonly [
    K in WritableKeys<Element> as K extends string
      ? K extends `on${string}` | "ref"
        ? never
        : K
      : never
  ]?: RenderableInput<Element[K] | null | undefined>;
};

export type ElementOptions<Element extends globalThis.Element> = ElementEventHandlers<Element> &
  TemplateEventHandlers &
  ElementRef<Element> &
  ElementProperties<Element>;

type StringAttributeValue = RenderableInput<string | null | undefined>;
type AttributeValue = RenderableInput<string | number | boolean | null | undefined>;
type BooleanAttributeValue = RenderableInput<boolean | null | undefined>;
type DataAttributeValue = RenderableInput;
type StyleValue = RenderableInput<
  string | CSSStyleDeclaration | Partial<CSSStyleDeclaration> | null | undefined
>;
type PopoverTargetActionValue = RenderableInput<"toggle" | "show" | "hide" | null | undefined>;
type CommandValue = RenderableInput<
  | "show-modal"
  | "close"
  | "request-close"
  | "show-popover"
  | "hide-popover"
  | "toggle-popover"
  | `--${string}`
  | null
  | undefined
>;

export type TemplateAttributeProps = {
  readonly id?: StringAttributeValue;
  readonly class?: StringAttributeValue;
  readonly className?: StringAttributeValue;
  readonly for?: StringAttributeValue;
  readonly tabindex?: AttributeValue;
  readonly value?: AttributeValue;
  readonly min?: AttributeValue;
  readonly max?: AttributeValue;
  readonly low?: AttributeValue;
  readonly high?: AttributeValue;
  readonly optimum?: AttributeValue;
  readonly step?: AttributeValue;
  readonly role?: StringAttributeValue;
  readonly style?: StyleValue;
  readonly popover?: StringAttributeValue;
  readonly popovertarget?: StringAttributeValue;
  readonly popovertargetaction?: PopoverTargetActionValue;
  readonly command?: CommandValue;
  readonly commandfor?: StringAttributeValue;
  readonly ".data"?: Readonly<Record<string, RenderableInput>>;
} & {
  readonly [K in `aria-${string}`]?: AttributeValue;
} & {
  readonly [K in `data-${string}`]?: DataAttributeValue;
} & {
  readonly [K in `?${string}`]?: BooleanAttributeValue;
};

export type BoundElementProperties<Element extends globalThis.Element> = {
  readonly [K in keyof Element as K extends string ? `.${K}` : never]?: RenderableInput<
    Element[K] | null | undefined
  >;
};

export type HostProps<Element extends globalThis.Element> = Omit<
  ElementOptions<Element>,
  keyof TemplateAttributeProps
> &
  TemplateAttributeProps &
  BoundElementProperties<Element>;

export type HostRenderer<
  Element extends globalThis.Element,
  A = RenderEvent,
  E = never,
  R = never,
  Props extends HostProps<Element> = HostProps<Element>,
  Content extends RenderableInput = RenderableInput,
> = (props: Props, content: Content) => Fx<A, E, R> | Effect.Effect<A, E, R>;

export type HostOverride<
  Props,
  Content extends RenderableInput,
  Result extends HostResult = HostResult,
> = (props: Props, content: Content) => Result;

export interface HostOptions<Element extends globalThis.Element> extends ElementRef<Element> {
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

export type HostRendererForTag<
  Tag extends keyof ElementByTagName,
  A = RenderEvent,
  E = never,
  R = never,
  Props extends HostPropsForTag<Tag> = HostPropsForTag<Tag>,
  Content extends RenderableInput = RenderableInput,
> = (props: Props, content: Content) => Fx<A, E, R> | Effect.Effect<A, E, R>;

export interface HostOptionsForTag<Tag extends keyof ElementByTagName> {
  readonly props?: HostPropsForTag<Tag>;
}

export type EventHandlerInput<Ev extends Event = Event, E = any, R = any> =
  | Effect.Effect<unknown, E, R>
  | EventHandler.EventHandler<Ev, E, R>
  | null
  | undefined;

export type Nullish = null | undefined;
export type NonNullish<Value> = Exclude<Value, Nullish>;

export type Property<Value, Key extends PropertyKey> = Value extends object
  ? Key extends keyof Value
    ? Value[Key]
    : undefined
  : undefined;

export interface InternalPropsHelpers<Options> {
  readonly property: <const Key extends PropertyKey, const Fallback>(
    key: Key,
    fallback: Fallback,
  ) => NonNullish<Property<Options, Key>> | Fallback;
}

export type HostComponent<Inputs> = Fx<
  RenderEvent,
  Renderable.Error<Inputs>,
  Renderable.Services<Inputs> | Scope.Scope | RenderTemplate
>;
