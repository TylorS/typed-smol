import {
  makeFxNodeId,
  serializeDevtoolsValue,
  type DevtoolsSerializationOptions,
  type FxNodeId,
  type RuntimeEventEnvelope,
} from "@typed/devtools-protocol";
import type { FxDevtoolsEvent, FxDevtoolsObserver } from "@typed/fx/Fx/devtools";
import { makeRuntimeEventBus, type RuntimeEventBus } from "./EventBus.js";
import { makeDevtoolsRuntime, type DevtoolsRuntimeService } from "./Layer.js";

export interface FxCaptureOptions {
  readonly eventBus?: RuntimeEventBus;
  readonly maxEvents?: number;
  readonly now?: () => number;
  readonly resolveId?: (event: FxDevtoolsEvent<unknown, unknown>) => FxNodeId | undefined;
  readonly runtime?: DevtoolsRuntimeService;
  readonly serialization?: DevtoolsSerializationOptions;
}

export interface FxCapture {
  readonly observer: FxDevtoolsObserver<unknown, unknown>;
  readonly runtime: DevtoolsRuntimeService;
  readonly snapshot: () => readonly RuntimeEventEnvelope[];
}

type FxRuntimeEvent = Extract<RuntimeEventEnvelope, { readonly _tag: "FxNodeEvent" }>;

export function makeFxCapture(options: FxCaptureOptions = {}): FxCapture {
  const runtime = resolveRuntime(options);
  const emit = (event: FxDevtoolsEvent<unknown, unknown>) => {
    const runtimeEvent = fxRuntimeEvent(event, options);
    if (runtimeEvent) runtime.emit(runtimeEvent);
  };

  return {
    observer: {
      onComplete: emit,
      onEmit: emit,
      onFailure: emit,
      onInterrupt: emit,
      onStart: emit,
    },
    runtime,
    snapshot: runtime.snapshot,
  };
}

export function fxRuntimeEvent(
  event: FxDevtoolsEvent<unknown, unknown>,
  options: FxCaptureOptions = {},
): RuntimeEventEnvelope | undefined {
  const fxNodeId = (options.resolveId ?? defaultFxNodeId)(event);
  if (!fxNodeId) return undefined;

  const runtimeEvent: RuntimeEventEnvelope = {
    _tag: "FxNodeEvent",
    fxNodeId,
    phase: phaseOf(event),
    timestamp: (options.now ?? Date.now)(),
    ...serializedValueOf(event, options.serialization),
  };

  return runtimeEvent;
}

export function defaultFxNodeId(event: FxDevtoolsEvent<unknown, unknown>): FxNodeId | undefined {
  const id = fxIdentity(event);
  return id ? makeFxNodeId(id) : undefined;
}

function resolveRuntime(options: FxCaptureOptions): DevtoolsRuntimeService {
  if (options.runtime) return options.runtime;

  return makeDevtoolsRuntime({
    enabled: true,
    eventBus:
      options.eventBus ?? makeRuntimeEventBus({ enabled: true, maxEvents: options.maxEvents }),
  });
}

function phaseOf(event: FxDevtoolsEvent<unknown, unknown>): FxRuntimeEvent["phase"] {
  switch (event._tag) {
    case "Started":
      return "started";
    case "Emitted":
      return "emitted";
    case "Failed":
      return "failed";
    case "Completed":
      return "completed";
    case "Interrupted":
      return "interrupted";
  }
}

function serializedValueOf(
  event: FxDevtoolsEvent<unknown, unknown>,
  options: DevtoolsSerializationOptions | undefined,
): Pick<FxRuntimeEvent, "value"> | {} {
  if (event._tag === "Emitted") return { value: serializeDevtoolsValue(event.value, options) };
  if (event._tag === "Failed" || event._tag === "Interrupted") {
    return { value: serializeDevtoolsValue(event.cause, options) };
  }

  return {};
}

function fxIdentity(event: FxDevtoolsEvent<unknown, unknown>): string | undefined {
  if (event.ownerId && event.id) return `${event.ownerId}#${event.id}`;
  if (event.refSubjectId && event.id) return `${event.refSubjectId}#${event.id}`;
  return event.id;
}
