import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { dual } from "effect/Function";
import * as Ref from "effect/Ref";
import { make as makeSink } from "../Sink/Sink.js";
import { make } from "./constructors/make.js";
import type { Fx } from "./Fx.js";

export type FxDevtoolsEventTag = "Started" | "Emitted" | "Failed" | "Completed" | "Interrupted";

export interface FxDevtoolsMetadata {
  readonly id?: string;
  readonly ownerId?: string;
  readonly refSubjectId?: string;
}

interface FxDevtoolsEventBase extends FxDevtoolsMetadata {}

export type FxDevtoolsEvent<A, E> =
  | (FxDevtoolsEventBase & { readonly _tag: "Started" })
  | (FxDevtoolsEventBase & {
      readonly _tag: "Emitted";
      readonly value: A;
    })
  | (FxDevtoolsEventBase & {
      readonly _tag: "Failed";
      readonly cause: Cause.Cause<E>;
    })
  | (FxDevtoolsEventBase & { readonly _tag: "Completed" })
  | (FxDevtoolsEventBase & {
      readonly _tag: "Interrupted";
      readonly cause: Cause.Cause<E>;
    });

export interface FxDevtoolsObserver<A, E> {
  readonly onStart?: (event: Extract<FxDevtoolsEvent<A, E>, { readonly _tag: "Started" }>) => void;
  readonly onEmit?: (event: Extract<FxDevtoolsEvent<A, E>, { readonly _tag: "Emitted" }>) => void;
  readonly onFailure?: (event: Extract<FxDevtoolsEvent<A, E>, { readonly _tag: "Failed" }>) => void;
  readonly onComplete?: (
    event: Extract<FxDevtoolsEvent<A, E>, { readonly _tag: "Completed" }>,
  ) => void;
  readonly onInterrupt?: (
    event: Extract<FxDevtoolsEvent<A, E>, { readonly _tag: "Interrupted" }>,
  ) => void;
}

export interface FxDevtoolsOptions<A, E> extends FxDevtoolsMetadata {
  readonly observer?: FxDevtoolsObserver<A, E>;
}

type FxTerminalDevtoolsEvent<A, E> = Extract<
  FxDevtoolsEvent<A, E>,
  { readonly _tag: "Failed" | "Completed" | "Interrupted" }
>;

export const withFxDevtools: {
  <A = unknown, E = unknown>(
    options: FxDevtoolsOptions<A, E>,
  ): <A2 extends A, E2 extends E, R>(self: Fx<A2, E2, R>) => Fx<A2, E2, R>;

  <A, E, R>(self: Fx<A, E, R>, options: FxDevtoolsOptions<A, E>): Fx<A, E, R>;
} = dual(
  2,
  <A, E, R>(self: Fx<A, E, R>, options: FxDevtoolsOptions<A, E>): Fx<A, E, R> =>
    make<A, E, R>(
      Effect.fnUntraced(function* (sink) {
        const terminated = yield* Ref.make(false);
        const notify = (event: FxDevtoolsEvent<A, E>) =>
          Effect.sync(() => notifyFxDevtools(options, event));
        const notifyTerminal = (event: FxTerminalDevtoolsEvent<A, E>) =>
          Effect.flatMap(
            Ref.modify(terminated, (done) =>
              done ? ([false, true] as const) : ([true, true] as const),
            ),
            (shouldNotify) => (shouldNotify ? notify(event) : Effect.void),
          );

        yield* notify({ _tag: "Started", ...metadata(options) });

        return yield* self
          .run(
            makeSink(
              (cause) =>
                Effect.flatMap(notifyTerminal(failureEvent(cause, options)), () =>
                  sink.onFailure(cause),
                ),
              (value) =>
                Effect.flatMap(notify({ _tag: "Emitted", value, ...metadata(options) }), () =>
                  sink.onSuccess(value),
                ),
            ),
          )
          .pipe(
            Effect.onExit((exit) =>
              Effect.flatMap(Ref.get(terminated), (done) =>
                done ? Effect.void : notifyTerminal(exitEvent(exit, options)),
              ),
            ),
          );
      }),
    ),
);

export const withDevtools = withFxDevtools;

export function notifyFxDevtools<A, E>(
  options: FxDevtoolsOptions<A, E> | undefined,
  event: FxDevtoolsEvent<A, E>,
): void {
  try {
    const observer = options?.observer;

    switch (event._tag) {
      case "Started":
        observer?.onStart?.(event);
        break;
      case "Emitted":
        observer?.onEmit?.(event);
        break;
      case "Failed":
        observer?.onFailure?.(event);
        break;
      case "Completed":
        observer?.onComplete?.(event);
        break;
      case "Interrupted":
        observer?.onInterrupt?.(event);
        break;
    }
  } catch {
    // DevTools observers are diagnostic-only and must not affect Fx semantics.
  }
}

function failureEvent<A, E>(
  cause: Cause.Cause<E>,
  options: FxDevtoolsOptions<A, E>,
): FxTerminalDevtoolsEvent<A, E> {
  return Cause.hasInterruptsOnly(cause)
    ? { _tag: "Interrupted", cause, ...metadata(options) }
    : { _tag: "Failed", cause, ...metadata(options) };
}

function exitEvent<A, E>(
  exit: Exit.Exit<unknown, E>,
  options: FxDevtoolsOptions<A, E>,
): FxTerminalDevtoolsEvent<A, E> {
  return Exit.match(exit, {
    onFailure: (cause) => failureEvent(cause, options),
    onSuccess: () => ({ _tag: "Completed", ...metadata(options) }),
  });
}

function metadata(options: FxDevtoolsMetadata): FxDevtoolsMetadata {
  const result: {
    id?: string;
    ownerId?: string;
    refSubjectId?: string;
  } = {};

  if (options.id !== undefined) result.id = options.id;
  if (options.ownerId !== undefined) result.ownerId = options.ownerId;
  if (options.refSubjectId !== undefined) result.refSubjectId = options.refSubjectId;

  return result;
}
