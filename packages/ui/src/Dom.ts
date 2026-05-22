import type * as Effect from "effect/Effect";
import type * as Stream from "effect/Stream";
import type { Fx } from "@typed/fx/Fx";
import type { EventHandler, Renderable } from "@typed/template";

export type EventHandlerProperty = `on${string}`;

export type EventOf<Handler> = NonNullable<Handler> extends (
  this: any,
  event: infer Event,
  ...args: ReadonlyArray<any>
) => any
  ? Event extends globalThis.Event ? Event : globalThis.Event
  : globalThis.Event;

export type ElementEventHandlers<Element extends globalThis.Element> = {
  readonly [K in keyof Element as K extends EventHandlerProperty ? K : never]?:
    | Effect.Effect<unknown, any, any>
    | EventHandler.EventHandler<EventOf<Element[K]>, any, any>
    | null;
};

export type ElementRef<Element extends globalThis.Element> = {
  readonly ref?: (
    element: Element,
  ) => void | Effect.Effect<unknown, any, any> | Stream.Stream<unknown, any, any> | Fx<unknown, any, any>;
};

export type IfEquals<X, Y, Output> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? Output : never;

export type WritableKeys<T> = {
  [K in keyof T]-?: IfEquals<{ [P in K]: T[P] }, { -readonly [P in K]: T[P] }, K>;
}[keyof T];

export type ElementProperties<Element extends globalThis.Element> = {
  readonly [K in WritableKeys<Element> as K extends EventHandlerProperty | "ref"
    ? never
    : K]?: Renderable<Element[K], any, any>;
};

export type ElementOptions<Element extends globalThis.Element> =
  & ElementEventHandlers<Element>
  & ElementRef<Element>
  & ElementProperties<Element>;

export type ElementByTagName =
  & HTMLElementTagNameMap
  & SVGElementTagNameMap
  & MathMLElementTagNameMap;

export type OptionsByTagName = {
  readonly [Tag in keyof ElementByTagName]: ElementOptions<ElementByTagName[Tag]>;
};

export type OptionsForTag<Tag extends keyof ElementByTagName> = OptionsByTagName[Tag];
