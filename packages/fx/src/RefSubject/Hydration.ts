import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import type * as Scope from "effect/Scope";
import * as Stream from "effect/Stream";
import type * as Fx from "../Fx/index.js";
import { continueWith as fxContinueWith } from "../Fx/combinators/continueWith.js";
import { unwrap as fxUnwrap } from "../Fx/combinators/unwrap.js";
import { fromEffect as fxFromEffect } from "../Fx/constructors/fromEffect.js";
import { isFx } from "../Fx/TypeId.js";
import { fromStream as fxFromStream } from "../Fx/stream.js";
import {
  CurrentComputedBehavior,
  make,
  type RefSubject,
  type RefSubjectOptions,
} from "./RefSubject.js";

export const HydrationRefTypeId = Symbol.for("@typed/fx/RefSubject/HydrationRef");
export type HydrationRefTypeId = typeof HydrationRefTypeId;

export const HYDRATION_ATTRIBUTE = "data-typed-refsubject";

export interface HydrationElement {
  getAttribute(name: string): string | null;
  removeAttribute(name: string): void;
}

interface HydrationMember {
  readonly schema: Schema.Top;
  readonly server: Effect.Effect<void>;
  readonly sample: Effect.Effect<any, any, any>;
  readonly set: (value: unknown) => Effect.Effect<unknown, never, any>;
  readonly fail: (error: Schema.SchemaError) => Effect.Effect<unknown, never, any>;
}

export interface HydrationRef<E = never, R = never> {
  (element: HydrationElement): Effect.Effect<void, never, R>;
  readonly [HydrationRefTypeId]: {
    readonly members: ReadonlyArray<HydrationMember>;
    readonly server: Effect.Effect<void>;
    readonly toAttribute: Effect.Effect<string, E, R>;
  };
}

export interface HydratedRefSubject<A, E = never, R = never, RH = R> extends RefSubject<A, E, R> {
  readonly hydrateFromElement: HydrationRef<E, RH>;
}

export declare namespace HydratedRefSubject {
  export type Any = HydratedRefSubject<any, any, any, any>;
  export type HydrationError<T> = T extends {
    readonly hydrateFromElement: HydrationRef<infer E, any>;
  }
    ? E
    : never;
  export type HydrationServices<T> = T extends {
    readonly hydrateFromElement: HydrationRef<any, infer R>;
  }
    ? R
    : never;
}

export function isHydrationRef(value: unknown): value is HydrationRef<any, any> {
  return (
    typeof value === "function" &&
    HydrationRefTypeId in value &&
    typeof value[HydrationRefTypeId] === "object" &&
    value[HydrationRefTypeId] !== null
  );
}

export function hydrate<S extends Schema.Top, E = never, R = never>(
  schema: S,
  effect:
    | Schema.Schema.Type<S>
    | Effect.Effect<Schema.Schema.Type<S>, E, R>
    | Stream.Stream<Schema.Schema.Type<S>, E, R>
    | Fx.Fx<Schema.Schema.Type<S>, E, R>,
  options?: RefSubjectOptions<Schema.Schema.Type<S>>,
): Effect.Effect<
  HydratedRefSubject<
    Schema.Schema.Type<S>,
    E | Schema.SchemaError,
    never,
    Schema.Codec.DecodingServices<S> | Schema.Codec.EncodingServices<S>
  >,
  never,
  R | Scope.Scope
> {
  return Effect.gen(function* () {
    const behavior = yield* CurrentComputedBehavior;
    const initializer = yield* makeHydrationInitializer(
      normalizeHydrationInitializer<Schema.Schema.Type<S>, E, R>(effect),
    );
    if (behavior === "one") yield* initializer.server;
    const ref = yield* make<Schema.Schema.Type<S>, E | Schema.SchemaError, R>(initializer.value, {
      ...options,
      eq: options?.eq ?? Schema.toEquivalence(schema),
    });
    const member: HydrationMember = {
      schema,
      server: initializer.server,
      sample: ref,
      set: (value) => initializer.dom(Effect.succeed(value as Schema.Schema.Type<S>)),
      fail: (error) => initializer.dom(Effect.fail(error)),
    };

    return Object.assign(ref, {
      hydrateFromElement: makeHydrationRef([member]),
    }) as HydratedRefSubject<
      Schema.Schema.Type<S>,
      E | Schema.SchemaError,
      never,
      Schema.Codec.DecodingServices<S> | Schema.Codec.EncodingServices<S>
    >;
  });
}

type HydrationEnvironment = "server" | "dom";

interface HydrationInitializer<A, E, R> {
  readonly value: Effect.Effect<A, E | Schema.SchemaError, R> | Fx.Fx<A, E | Schema.SchemaError, R>;
  readonly server: Effect.Effect<void>;
  readonly dom: (value: Effect.Effect<A, Schema.SchemaError>) => Effect.Effect<void>;
}

function makeHydrationInitializer<A, E, R>(
  value: Effect.Effect<A, E, R> | Fx.Fx<A, E, R>,
): Effect.Effect<HydrationInitializer<A, E, R>> {
  return Effect.gen(function* () {
    const environment = yield* Deferred.make<HydrationEnvironment>();
    const hydrated = yield* Deferred.make<A, E | Schema.SchemaError>();
    const server = Effect.asVoid(Deferred.succeed(environment, "server"));
    const dom = (value: Effect.Effect<A, Schema.SchemaError>) =>
      Effect.asVoid(
        Effect.andThen(Deferred.complete(hydrated, value), Deferred.succeed(environment, "dom")),
      );

    if (isFx(value)) {
      const hydratedValueDeferredFx = fxFromEffect(Deferred.await(hydrated));
      return {
        value: fxUnwrap(
          Effect.map(Deferred.await(environment), (environment) =>
            environment === "server" ? value : fxContinueWith(hydratedValueDeferredFx, () => value),
          ),
        ),
        server,
        dom,
      };
    }

    let first = true;
    const hydratedValueDeferred = Effect.suspend(() => {
      if (first) {
        first = false;
        return Deferred.await(hydrated);
      }
      return value;
    });

    return {
      value: Effect.flatMap(Deferred.await(environment), (environment) =>
        environment === "server" ? value : hydratedValueDeferred,
      ),
      server,
      dom,
    };
  });
}

function normalizeHydrationInitializer<A, E, R>(
  value: A | Effect.Effect<A, E, R> | Fx.Fx<A, E, R> | Stream.Stream<A, E, R>,
): Effect.Effect<A, E, R> | Fx.Fx<A, E, R> {
  if (isFx(value) || Effect.isEffect(value)) return value;
  if (Stream.isStream(value)) return fxFromStream(value);
  return Effect.succeed(value);
}

export function hydrateAll<
  First extends HydratedRefSubject.Any,
  const Rest extends ReadonlyArray<HydratedRefSubject.Any>,
>(
  first: First,
  ...rest: Rest
): HydrationRef<
  HydratedRefSubject.HydrationError<First | Rest[number]>,
  HydratedRefSubject.HydrationServices<First | Rest[number]>
> {
  return makeHydrationRef(
    [first, ...rest].flatMap((ref) => ref.hydrateFromElement[HydrationRefTypeId].members),
  ) as HydrationRef<
    HydratedRefSubject.HydrationError<First | Rest[number]>,
    HydratedRefSubject.HydrationServices<First | Rest[number]>
  >;
}

function makeHydrationRef(members: ReadonlyArray<HydrationMember>): HydrationRef<any, any> {
  const tuple = Schema.Tuple(members.map((member) => member.schema) as any);
  const envelope = Schema.Struct({
    version: Schema.Literal(1),
    values: tuple,
  });
  const codec = Schema.fromJsonString(Schema.toCodecJson(envelope));
  const server = Effect.asVoid(
    Effect.all(
      members.map((member) => member.server),
      { concurrency: 1 },
    ),
  );
  const toAttribute = Effect.flatMap(
    Effect.andThen(
      server,
      Effect.all(
        members.map((member) => member.sample),
        { concurrency: 1 },
      ),
    ),
    (values) => Schema.encodeEffect(codec)({ version: 1, values } as any),
  );

  const hydrateFromElement = (element: HydrationElement) => {
    const encoded = element.getAttribute(HYDRATION_ATTRIBUTE);
    if (encoded === null) {
      return Effect.asVoid(
        Effect.all(
          members.map((member) => member.server),
          { concurrency: 1 },
        ),
      );
    }

    return Effect.matchEffect(Schema.decodeEffect(codec)(encoded), {
      onFailure: (error) =>
        Effect.asVoid(
          Effect.all(
            members.map((member) => member.fail(error)),
            {
              concurrency: 1,
            },
          ),
        ),
      onSuccess: ({ values }) =>
        Effect.andThen(
          Effect.all(
            members.map((member, index) => member.set(values[index])),
            { concurrency: 1 },
          ),
          Effect.sync(() => element.removeAttribute(HYDRATION_ATTRIBUTE)),
        ),
    });
  };

  return Object.assign(hydrateFromElement, {
    [HydrationRefTypeId]: { members, server, toAttribute },
  });
}
