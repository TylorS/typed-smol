import * as Cause from "effect/Cause";
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
import * as Sink from "../Sink/Sink.js";
import {
  CurrentComputedBehavior,
  make,
  type RefSubject,
  type RefSubjectOptions,
} from "./RefSubject.js";

export const HydrationRefTypeId = Symbol.for("@typed/fx/RefSubject/HydrationRef");
export type HydrationRefTypeId = typeof HydrationRefTypeId;

export const HYDRATION_ATTRIBUTE = "data-typed-refsubject";

const allUnbounded = <A, E, R>(effects: Iterable<Effect.Effect<A, E, R>>) =>
  Effect.all(effects, { concurrency: "unbounded" });

export interface HydrationAttribute {
  readonly name: string;
  readonly value: string;
}

export interface HydrationElement {
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
}

type CodecEffect<A> = Effect.Effect<A, Schema.SchemaError, any>;

interface HydrationMember {
  readonly schema: Schema.Top;
  readonly attributeName: string | undefined;
  readonly ref: RefSubject<any, any, any>;
  readonly server: Effect.Effect<void>;
  readonly hydrate: (value: Effect.Effect<any, Schema.SchemaError>) => Effect.Effect<void>;
}

export interface HydrationRef<E = never, R = never> {
  (element: HydrationElement): Effect.Effect<void, never, R | Scope.Scope>;
  readonly [HydrationRefTypeId]: {
    readonly members: ReadonlyArray<HydrationMember>;
    readonly server: Effect.Effect<void>;
    readonly toAttributes: Effect.Effect<ReadonlyArray<HydrationAttribute>, E, R>;
  };
}

export interface HydratedRefSubject<A, E = never, R = never, RH = R>
  extends RefSubject<A, E, R>, HydrationRef<E, RH> {}

export declare namespace HydratedRefSubject {
  export type Any = HydratedRefSubject<any, any, any, any>;
  export type HydrationError<T> = T extends HydrationRef<infer E, any> ? E : never;
  export type HydrationServices<T> = T extends HydrationRef<any, infer R> ? R : never;
}

export function isHydrationRef(value: unknown): value is HydrationRef<any, any> {
  return (
    typeof value === "function" &&
    HydrationRefTypeId in value &&
    typeof value[HydrationRefTypeId] === "object" &&
    value[HydrationRefTypeId] !== null
  );
}

export interface HydrateOptions<A> extends RefSubjectOptions<A> {
  readonly name?: string;
}

type HydrationInput<A, E, R> = A | Effect.Effect<A, E, R> | Stream.Stream<A, E, R> | Fx.Fx<A, E, R>;

type HydrateEffect<S extends Schema.Top, E, R> = Effect.Effect<
  HydratedRefSubject<
    Schema.Schema.Type<S>,
    E | Schema.SchemaError,
    never,
    Schema.Codec.DecodingServices<S> | Schema.Codec.EncodingServices<S>
  >,
  never,
  R | Scope.Scope
>;

export function hydrate<S extends Schema.Codec<any, string, any, any>, E = never, R = never>(
  schema: S,
  effect: HydrationInput<Schema.Schema.Type<S>, E, R>,
  options: HydrateOptions<Schema.Schema.Type<S>> & { readonly name: string },
): HydrateEffect<S, E, R>;
export function hydrate<S extends Schema.Top, E = never, R = never>(
  schema: S,
  effect: HydrationInput<Schema.Schema.Type<S>, E, R>,
  options?: HydrateOptions<Schema.Schema.Type<S>> & { readonly name?: undefined },
): HydrateEffect<S, E, R>;
export function hydrate<S extends Schema.Top, E = never, R = never>(
  schema: S,
  effect: HydrationInput<Schema.Schema.Type<S>, E, R>,
  options?: HydrateOptions<Schema.Schema.Type<S>>,
): HydrateEffect<S, E, R> {
  const attributeName =
    options?.name === undefined ? undefined : toHydrationAttributeName(options.name);
  return Effect.gen(function* () {
    const initializer = yield* makeHydrationInitializer(
      normalizeHydrationInitializer<Schema.Schema.Type<S>, E, R>(effect),
    );
    const ref = yield* make<Schema.Schema.Type<S>, E | Schema.SchemaError, R>(initializer.value, {
      ...options,
      eq: options?.eq ?? Schema.toEquivalence(schema),
    });
    const member: HydrationMember = {
      schema,
      attributeName,
      ref,
      server: initializer.server,
      hydrate: initializer.dom,
    };

    const initializeForCurrentBehavior = Effect.flatMap(CurrentComputedBehavior, (behavior) =>
      behavior === "one" ? initializer.server : Effect.void,
    );
    const hydrationRef = Object.assign(makeHydrationRef([member]), {
      run: <RSink>(sink: Sink.Sink<Schema.Schema.Type<S>, E | Schema.SchemaError, RSink>) =>
        Effect.andThen(initializeForCurrentBehavior, ref.run(sink)),
      toEffect: () => Effect.andThen(initializeForCurrentBehavior, ref),
    });

    return Object.setPrototypeOf(hydrationRef, ref) as HydratedRefSubject<
      Schema.Schema.Type<S>,
      E | Schema.SchemaError,
      never,
      Schema.Codec.DecodingServices<S> | Schema.Codec.EncodingServices<S>
    >;
  });
}

function toHydrationAttributeName(name: string): string {
  const attributeName = `data-${name}`.toLowerCase();
  if (
    name.length === 0 ||
    attributeName === HYDRATION_ATTRIBUTE ||
    !isValidAttributeName(attributeName)
  ) {
    throw new TypeError(`Invalid hydration attribute name: ${name}`);
  }
  return attributeName;
}

const forbiddenAttributeNameCharacters = new Set(['"', "'", "/", ">", "=", "<"]);

function isValidAttributeName(name: string): boolean {
  for (const character of name) {
    const codePoint = character.codePointAt(0)!;
    if (
      codePoint <= 0x20 ||
      (codePoint >= 0x7f && codePoint <= 0x9f) ||
      forbiddenAttributeNameCharacters.has(character)
    ) {
      return false;
    }
  }
  return true;
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
  const Refs extends readonly [HydratedRefSubject.Any, ...HydratedRefSubject.Any[]],
>(
  ...refs: Refs
): HydrationRef<
  HydratedRefSubject.HydrationError<Refs[number]>,
  HydratedRefSubject.HydrationServices<Refs[number]>
> {
  return makeHydrationRef(refs.flatMap((ref) => ref[HydrationRefTypeId].members));
}

function makeHydrationRef(members: ReadonlyArray<HydrationMember>): HydrationRef<any, any> {
  const unnamed = members.filter((member) => member.attributeName === undefined);
  const named = members.filter((member) => member.attributeName !== undefined);
  const names = new Set<string>();
  for (const member of named) {
    const attributeName = member.attributeName!;
    if (names.has(attributeName)) {
      throw new TypeError(`Duplicate hydration attribute: ${attributeName}`);
    }
    names.add(attributeName);
  }

  const tuple = Schema.Tuple(unnamed.map((member) => member.schema) as any);
  const envelope = Schema.Struct({
    version: Schema.Literal(1),
    values: tuple,
  });
  const codec = Schema.fromJsonString(Schema.toCodecJson(envelope));
  const server = Effect.asVoid(allUnbounded(members.map((member) => member.server)));
  const attributeEffects = [
    ...(unnamed.length === 0
      ? []
      : [
          Effect.flatMap(allUnbounded(unnamed.map((member) => member.ref)), (values) =>
            Effect.map(Schema.encodeEffect(codec)({ version: 1, values } as any), (value) => ({
              name: HYDRATION_ATTRIBUTE,
              value,
            })),
          ),
        ]),
    ...named.map((member) =>
      Effect.flatMap(member.ref, (value) =>
        Effect.map(encodeMember(member, value), (value) => ({
          name: member.attributeName!,
          value,
        })),
      ),
    ),
  ];
  const toAttributes = Effect.andThen(server, allUnbounded(attributeEffects));

  const hydrateUnnamed = (element: HydrationElement) => {
    if (unnamed.length === 0) return Effect.void;
    const encoded = element.getAttribute(HYDRATION_ATTRIBUTE);
    if (encoded === null) {
      return Effect.asVoid(allUnbounded(unnamed.map((member) => member.server)));
    }

    return Effect.matchEffect(Schema.decodeEffect(codec)(encoded), {
      onFailure: (error) =>
        Effect.asVoid(allUnbounded(unnamed.map((member) => member.hydrate(Effect.fail(error))))),
      onSuccess: ({ values }) =>
        Effect.andThen(
          allUnbounded(
            unnamed.map((member, index) => member.hydrate(Effect.succeed(values[index]))),
          ),
          Effect.sync(() => element.removeAttribute(HYDRATION_ATTRIBUTE)),
        ),
    });
  };

  const hydrateNamed = (member: HydrationMember, element: HydrationElement) => {
    const attributeName = member.attributeName!;
    const encoded = element.getAttribute(attributeName);
    if (encoded !== null) {
      return Effect.matchEffect(decodeMember(member, encoded), {
        onFailure: (error) => member.hydrate(Effect.fail(error)),
        onSuccess: (value) => member.hydrate(Effect.succeed(value)),
      });
    }

    return Effect.andThen(
      member.server,
      Effect.matchCauseEffect(member.ref, {
        onFailure: () => Effect.void,
        onSuccess: (value) => writeNamed(member, element, value),
      }),
    );
  };

  const hydrateElement = (element: HydrationElement) =>
    Effect.andThen(
      allUnbounded([
        hydrateUnnamed(element),
        ...named.map((member) => hydrateNamed(member, element)),
      ]),
      Effect.asVoid(
        allUnbounded(named.map((member) => Effect.forkScoped(synchronizeNamed(member, element)))),
      ),
    );

  return Object.assign(hydrateElement, {
    [HydrationRefTypeId]: { members, server, toAttributes },
  });
}

function encodeMember(member: HydrationMember, value: unknown): CodecEffect<string> {
  return Schema.encodeEffect(member.schema)(value as any) as any;
}

function decodeMember(member: HydrationMember, value: string): CodecEffect<unknown> {
  return Schema.decodeEffect(member.schema)(value as any) as any;
}

function writeAttribute(element: HydrationElement, name: string, value: string) {
  return Effect.sync(() => {
    if (element.getAttribute(name) !== value) element.setAttribute(name, value);
  });
}

function writeNamed(member: HydrationMember, element: HydrationElement, value: unknown) {
  return Effect.matchEffect(encodeMember(member, value), {
    onFailure: (error) => member.ref.onFailure(Cause.fail(error)),
    onSuccess: (encoded) => writeAttribute(element, member.attributeName!, encoded),
  });
}

function synchronizeNamed(member: HydrationMember, element: HydrationElement) {
  return member.ref.run(
    Sink.make(
      () => Effect.void,
      (value) => writeNamed(member, element, value),
    ),
  );
}
