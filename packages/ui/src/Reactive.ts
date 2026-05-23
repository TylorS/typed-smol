import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import type * as Stream from "effect/Stream";
import { RefSubject } from "@typed/fx";
import type { Fx } from "@typed/fx/Fx";
import type { Renderable, RenderEvent, RenderTemplate } from "@typed/template";

export type Ref<A, E = never, R = never> =
  | RefSubject.RefSubject<A, E, R>
  | RefSubject.Computed<A, E, R>;

export type Value<A, E = never, R = never> =
  | Ref<A, E, R>
  | Fx<A, E, R>
  | Stream.Stream<A, E, R>
  | Effect.Effect<A, E, R>
  | A;

export type AnyValue<A> = Value<A, any, any>;

export type AnyContent<A = unknown> = Renderable<A, any, any>;

export type Content<A = unknown> = AnyContent<A>;

export type ErrorOf<T> = Renderable.Error<T>;

export type ServicesOf<T> = Renderable.Services<T>;

export type ErrorFromOptions<Opts> = ErrorFromTopLevelOptions<Opts> | ErrorFromOptionProps<Opts>;

export type ServicesFromOptions<Opts> =
  | ServicesFromTopLevelOptions<Opts>
  | ServicesFromOptionProps<Opts>;

export type Component<Opts extends {}, A = RenderEvent> = Fx<
  A,
  KnownChannel<ErrorFromOptions<Opts>>,
  KnownChannel<ServicesFromOptions<Opts>> | Scope.Scope | RenderTemplate
>;

export function makeRef<A, E, R>(
  value: Value<A, E, R>,
): Effect.Effect<RefSubject.Computed<A, E, R>, never, R | Scope.Scope>;
export function makeRef<A, E, R>(
  value: Value<A, E, R>,
): Effect.Effect<RefSubject.Computed<A, E, R>, never, R | Scope.Scope> {
  return RefSubject.isComputed(value) ? Effect.succeed(value) : RefSubject.make(value);
}

type ErrorFromOptionProps<Opts> = Opts extends { readonly props?: infer Props }
  ? ErrorFromPropObject<NonNullable<Props>>
  : never;

type ServicesFromOptionProps<Opts> = Opts extends { readonly props?: infer Props }
  ? ServicesFromPropObject<NonNullable<Props>>
  : never;

type ErrorFromTopLevelOptions<Opts> = {
  readonly [K in keyof Opts]: Opts[K] extends (...args: ReadonlyArray<any>) => infer Return
    ? KnownChannel<ErrorOf<Return>>
    : KnownChannel<ErrorOf<Opts[K]>>;
}[keyof Opts];

type ServicesFromTopLevelOptions<Opts> = {
  readonly [K in keyof Opts]: Opts[K] extends (...args: ReadonlyArray<any>) => infer Return
    ? KnownChannel<ServicesOf<Return>>
    : KnownChannel<ServicesOf<Opts[K]>>;
}[keyof Opts];

type ErrorFromPropObject<Props> = Props extends object
  ? { readonly [K in keyof Props]: ErrorFromPropValue<Props[K]> }[keyof Props]
  : never;

type ServicesFromPropObject<Props> = Props extends object
  ? { readonly [K in keyof Props]: ServicesFromPropValue<Props[K]> }[keyof Props]
  : never;

type ErrorFromPropValue<T> = [ErrorOf<T>] extends [never]
  ? T extends (...args: ReadonlyArray<any>) => infer Return
    ? KnownChannel<ErrorOf<Return>>
    : T extends { readonly handler: (...args: ReadonlyArray<any>) => infer Return }
      ? KnownChannel<ErrorOf<Return>>
      : T extends readonly (infer Item)[]
        ? ErrorFromPropValue<Item>
        : T extends AtomicPropObject
          ? never
          : T extends object
            ? ErrorFromPropObject<T>
            : never
  : KnownChannel<ErrorOf<T>>;

type ServicesFromPropValue<T> = [ServicesOf<T>] extends [never]
  ? T extends (...args: ReadonlyArray<any>) => infer Return
    ? KnownChannel<ServicesOf<Return>>
    : T extends { readonly handler: (...args: ReadonlyArray<any>) => infer Return }
      ? KnownChannel<ServicesOf<Return>>
      : T extends readonly (infer Item)[]
        ? ServicesFromPropValue<Item>
        : T extends AtomicPropObject
          ? never
          : T extends object
            ? ServicesFromPropObject<T>
            : never
  : KnownChannel<ServicesOf<T>>;

type AtomicPropObject = globalThis.Element | globalThis.Event | Date | RegExp;

type KnownChannel<T> = unknown extends T ? never : Exclude<T, null | undefined>;
