import type { DevtoolsSessionId, RuntimeEventEnvelope } from "@typed/devtools-protocol";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { makeRuntimeEventBus, type RuntimeEventBus } from "./EventBus.js";

export interface DevtoolsRuntimeOptions {
  readonly enabled?: boolean;
  readonly eventBus?: RuntimeEventBus;
  readonly maxEvents?: number;
  readonly sessionId?: DevtoolsSessionId;
}

export interface DevtoolsRuntimeService {
  readonly enabled: boolean;
  readonly emit: (event: RuntimeEventEnvelope) => void;
  readonly eventBus: RuntimeEventBus;
  readonly sessionId?: DevtoolsSessionId;
  readonly snapshot: () => readonly RuntimeEventEnvelope[];
}

export class DevtoolsRuntime extends Context.Service<DevtoolsRuntime, DevtoolsRuntimeService>()(
  "@typed/devtools-runtime/DevtoolsRuntime",
) {}

export function DevtoolsRuntimeLayer(
  options: DevtoolsRuntimeOptions = {},
): Layer.Layer<DevtoolsRuntime> {
  return Layer.succeed(DevtoolsRuntime, makeDevtoolsRuntime(options));
}

export function disabledDevtoolsRuntime(): DevtoolsRuntimeService {
  const eventBus = makeRuntimeEventBus();
  return {
    enabled: false,
    eventBus,
    emit() {},
    snapshot() {
      return [];
    },
  };
}

export function makeDevtoolsRuntime(options: DevtoolsRuntimeOptions = {}): DevtoolsRuntimeService {
  const enabled = options.enabled === true;
  if (!enabled) return disabledDevtoolsRuntime();

  const eventBus =
    options.eventBus ??
    makeRuntimeEventBus({
      enabled,
      maxEvents: options.maxEvents,
      sessionId: options.sessionId,
    });
  const sessionId = options.sessionId ?? eventBus.sessionId;
  assertSessionAgreement(sessionId, eventBus.sessionId);
  return {
    enabled,
    eventBus,
    emit(event) {
      eventBus.emit(event);
    },
    sessionId,
    snapshot() {
      return eventBus.snapshot();
    },
  };
}

export const DevtoolsRuntimeLive = DevtoolsRuntimeLayer();

export function getDevtoolsRuntime(): Effect.Effect<
  DevtoolsRuntimeService,
  never,
  DevtoolsRuntime
> {
  return DevtoolsRuntime;
}

function assertSessionAgreement(
  sessionId: DevtoolsSessionId | undefined,
  eventBusSessionId: DevtoolsSessionId | undefined,
): void {
  if (
    sessionId !== undefined &&
    eventBusSessionId !== undefined &&
    sessionId !== eventBusSessionId
  ) {
    throw new Error("DevTools runtime session must match the runtime event bus session");
  }
}
