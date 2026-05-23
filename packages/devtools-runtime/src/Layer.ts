import type { DevtoolsSessionId, RuntimeEventEnvelope } from "@typed/devtools-protocol";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

export interface DevtoolsRuntimeOptions {
  readonly enabled?: boolean;
  readonly sessionId?: DevtoolsSessionId;
}

export interface DevtoolsRuntimeService {
  readonly enabled: boolean;
  readonly emit: (event: RuntimeEventEnvelope) => void;
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
  return {
    enabled: false,
    emit() {},
    snapshot() {
      return [];
    },
  };
}

export function makeDevtoolsRuntime(options: DevtoolsRuntimeOptions = {}): DevtoolsRuntimeService {
  const enabled = options.enabled === true;
  if (!enabled) return disabledDevtoolsRuntime();

  const events: RuntimeEventEnvelope[] = [];
  return {
    enabled,
    emit(event) {
      events.push(cloneRuntimeEvent(event));
    },
    sessionId: options.sessionId,
    snapshot() {
      return events.map(cloneRuntimeEvent);
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

function cloneRuntimeEvent(event: RuntimeEventEnvelope): RuntimeEventEnvelope {
  return structuredClone(event);
}
