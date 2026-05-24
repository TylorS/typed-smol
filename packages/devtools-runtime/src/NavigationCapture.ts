import {
  makeNavigationEventId,
  type NavigationEventId,
  type RuntimeEventEnvelope,
} from "@typed/devtools-protocol";
import type { NavigationEvent, NavigationHandler } from "@typed/navigation";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import { makeRuntimeEventBus, type RuntimeEventBus } from "./EventBus.js";
import { makeDevtoolsRuntime, type DevtoolsRuntimeService } from "./Layer.js";

export interface NavigationCaptureOptions {
  readonly eventBus?: RuntimeEventBus;
  readonly maxEvents?: number;
  readonly now?: () => number;
  readonly resolveId?: (event: NavigationEvent) => NavigationEventId | undefined;
  readonly runtime?: DevtoolsRuntimeService;
}

export interface NavigationCapture {
  readonly emit: (event: NavigationEvent) => void;
  readonly handler: NavigationHandler<never, never>;
  readonly runtime: DevtoolsRuntimeService;
  readonly snapshot: () => readonly RuntimeEventEnvelope[];
}

export function makeNavigationCapture(options: NavigationCaptureOptions = {}): NavigationCapture {
  const runtime = resolveRuntime(options);
  const emit = (event: NavigationEvent) => {
    try {
      const runtimeEvent = navigationRuntimeEvent(event, options);
      if (runtimeEvent) runtime.emit(runtimeEvent);
    } catch {
      // Navigation capture is diagnostic-only and must not affect navigation behavior.
    }
  };

  return {
    emit,
    handler: (event) => Effect.sync(() => emit(event)).pipe(Effect.as(Option.none())),
    runtime,
    snapshot: runtime.snapshot,
  };
}

export function navigationRuntimeEvent(
  event: NavigationEvent,
  options: NavigationCaptureOptions = {},
): RuntimeEventEnvelope | undefined {
  const navigationEventId = (options.resolveId ?? defaultNavigationEventId)(event);
  if (!navigationEventId) return undefined;

  return {
    _tag: "NavigationEvent",
    navigationEventId,
    timestamp: (options.now ?? Date.now)(),
    to: event.destination.url.href,
    type: event.type,
  };
}

export function defaultNavigationEventId(event: NavigationEvent): NavigationEventId | undefined {
  if (!event.destination.id) return undefined;
  return makeNavigationEventId(`${event.type}:${event.destination.id}`);
}

function resolveRuntime(options: NavigationCaptureOptions): DevtoolsRuntimeService {
  if (options.runtime) return options.runtime;

  return makeDevtoolsRuntime({
    enabled: true,
    eventBus:
      options.eventBus ?? makeRuntimeEventBus({ enabled: true, maxEvents: options.maxEvents }),
  });
}
