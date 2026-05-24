import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { isStream } from "effect/Stream";
import type { Scope } from "effect/Scope";
import { Fx, Sink } from "@typed/fx";
import { renderToString } from "../internal/encoding.js";
import { takeOneIfNotRenderEvent } from "../internal/takeOneIfNotRenderEvent.js";
import { HtmlRenderEvent, isHtmlRenderEvent } from "../RenderEvent.js";
import type { EventActionDescriptor } from "../EventHandler.js";
import type { DomTemplateDevtoolsObserver } from "./devtools.js";

export type RenderableKind =
  | "plain"
  | "effect"
  | "fx"
  | "stream"
  | "nested-template"
  | "html-render-event"
  | "dom-render-event"
  | "unknown";

export interface DomTemplateRuntime {
  readonly devtools?: DomTemplateDevtoolsObserver;
  readonly scope?: Scope;
  readonly onError?: (error: unknown) => Effect.Effect<void>;
  readonly resumeRoute?: (
    element: Element,
    payload: RouteResumePayload,
    trigger: RouteResumeTrigger,
  ) => Effect.Effect<void, Error, never>;
  readonly resumeAction?: (
    element: Element,
    descriptor: EventActionDescriptor,
    event: Event,
  ) => Effect.Effect<void, Error, never>;
}

export interface ServerTemplateRuntime {}

export type RouteResumePayload = Readonly<Record<string, string>>;

export type RouteResumeTrigger =
  | "load"
  | "idle"
  | "visible"
  | "hover"
  | "interaction"
  | "focus";

export function runDomBinding<A>(
  kind: RenderableKind,
  value: A,
  sink: (value: unknown) => void,
  runtime: DomTemplateRuntime,
): Effect.Effect<void, Error, never> {
  if (runtime.scope) return forkBindingUntilFirstValue(kind, value, sink, runtime, runtime.scope);
  return bindingEffect(kind, value, sink, runtime);
}

function bindingEffect<A>(
  kind: RenderableKind,
  value: A,
  sink: (value: unknown) => void,
  runtime: DomTemplateRuntime,
  onValue: Effect.Effect<void> = Effect.void,
) {
  return toDomFx(kind, value).run(
    Sink.make(
      (error) => runtime.onError?.(error) ?? Effect.die(error),
      (next) =>
        Effect.flatMap(
          Effect.sync(() => sink(next)),
          () => onValue,
        ),
    ),
  );
}

function forkBindingUntilFirstValue<A>(
  kind: RenderableKind,
  value: A,
  sink: (value: unknown) => void,
  runtime: DomTemplateRuntime,
  scope: Scope,
): Effect.Effect<void, Error, never> {
  return Effect.gen(function* () {
    const first = yield* Deferred.make<void, Error>();
    let pending = true;
    const markReady = Effect.suspend(() => {
      if (!pending) return Effect.void;
      pending = false;
      return Deferred.succeed(first, undefined);
    });
    const effect = bindingEffect(kind, value, sink, runtime, markReady);
    const scoped = effect.pipe(
      Effect.onExit((exit) => {
        if (!pending) return Effect.void;
        pending = false;
        return Exit.isFailure(exit)
          ? Deferred.failCause(first, exit.cause)
          : Deferred.succeed(first, undefined);
      }),
    );

    yield* Effect.forkIn(scoped, scope);
    yield* Deferred.await(first);
  });
}

export function runServerSlot<A>(
  kind: RenderableKind,
  value: A,
  _runtime: ServerTemplateRuntime,
): Fx.Fx<HtmlRenderEvent, Error, never> {
  return Fx.map(toServerFx(kind, value), (next) =>
    isHtmlRenderEvent(next) ? next : HtmlRenderEvent(renderToString(next, ""), true),
  );
}

export function resolveServerValue<A>(
  kind: RenderableKind,
  value: A,
  _runtime: ServerTemplateRuntime,
): Effect.Effect<unknown, Error, never> {
  return Effect.map(Fx.collectAll(toServerFx(kind, value)), renderServerValues);
}

function toDomFx(kind: RenderableKind, value: unknown): Fx.Fx<unknown, Error, never> {
  if (kind === "plain") return Fx.succeed(value);
  if (kind === "effect") return Fx.fromEffect(value as Effect.Effect<unknown, Error, never>);
  if (kind === "stream") return Fx.fromStream(value as never);
  if (kind === "fx" || kind === "nested-template") return value as Fx.Fx<unknown, Error, never>;
  return detectDomFx(value);
}

function detectDomFx(value: unknown): Fx.Fx<unknown, Error, never> {
  if (value === null || value === undefined) return Fx.succeed(value);
  if (Fx.isFx(value)) return value as Fx.Fx<unknown, Error, never>;
  if (isStream(value)) return Fx.fromStream(value as never);
  if (Effect.isEffect(value)) return Fx.fromEffect(value as Effect.Effect<unknown, Error, never>);
  if (Array.isArray(value)) return Fx.mergeOrdered(...value.map(detectDomFx));
  return Fx.succeed(value);
}

function toServerFx(kind: RenderableKind, value: unknown): Fx.Fx<unknown, Error, never> {
  if (kind === "plain") return Fx.succeed(value);
  if (kind === "html-render-event" || kind === "dom-render-event") return Fx.succeed(value);
  if (kind === "effect") return effectToServerFx(value as Effect.Effect<unknown, Error, never>);
  if (kind === "stream") return takeOneIfNotRenderEvent(Fx.fromStream(value as never));
  if (kind === "fx" || kind === "nested-template") {
    return takeOneIfNotRenderEvent(value as Fx.Fx<unknown, Error, never>);
  }
  return detectServerFx(value);
}

function detectServerFx(value: unknown): Fx.Fx<unknown, Error, never> {
  if (value === null || value === undefined) return Fx.succeed(value);
  if (Fx.isFx(value)) return takeOneIfNotRenderEvent(value as Fx.Fx<unknown, Error, never>);
  if (isStream(value)) return takeOneIfNotRenderEvent(Fx.fromStream(value as never));
  if (Effect.isEffect(value))
    return effectToServerFx(value as Effect.Effect<unknown, Error, never>);
  if (Array.isArray(value)) return Fx.mergeOrdered(...value.map(detectServerFx));
  return Fx.succeed(value);
}

function effectToServerFx(
  effect: Effect.Effect<unknown, Error, never>,
): Fx.Fx<unknown, Error, never> {
  return Fx.unwrap(Effect.map(effect, detectServerFx));
}

function renderServerValues(values: readonly unknown[]): unknown {
  if (values.length === 0) return "";
  if (values.length === 1 && !isHtmlRenderEvent(values[0])) return values[0];
  return values
    .map((value) => (isHtmlRenderEvent(value) ? value.html : renderToString(value, "")))
    .join("");
}
