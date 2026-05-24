import {
  makeRefSubjectId,
  serializeDevtoolsValue,
  type DevtoolsSerializationOptions,
  type RefSubjectId,
  type RuntimeEventEnvelope,
} from "@typed/devtools-protocol";
import type {
  RefSubjectDevtoolsEvent,
  RefSubjectDevtoolsObserver,
} from "@typed/fx/RefSubject/devtools";
import { makeRuntimeEventBus, type RuntimeEventBus } from "./EventBus.js";
import { makeDevtoolsRuntime, type DevtoolsRuntimeService } from "./Layer.js";

export interface RefSubjectCaptureOptions {
  readonly eventBus?: RuntimeEventBus;
  readonly maxEvents?: number;
  readonly now?: () => number;
  readonly resolveId?: (event: RefSubjectDevtoolsEvent<unknown>) => RefSubjectId | undefined;
  readonly runtime?: DevtoolsRuntimeService;
  readonly serialization?: DevtoolsSerializationOptions;
}

export interface RefSubjectCapture {
  readonly observer: RefSubjectDevtoolsObserver<unknown>;
  readonly runtime: DevtoolsRuntimeService;
  readonly snapshot: () => readonly RuntimeEventEnvelope[];
}

export function makeRefSubjectCapture(options: RefSubjectCaptureOptions = {}): RefSubjectCapture {
  const runtime = resolveRuntime(options);
  const emit = (event: RefSubjectDevtoolsEvent<unknown>) => {
    const runtimeEvent = refSubjectRuntimeEvent(event, options);
    if (runtimeEvent) runtime.emit(runtimeEvent);
  };

  return {
    observer: {
      onSnapshot: emit,
      onUpdate: emit,
    },
    runtime,
    snapshot: runtime.snapshot,
  };
}

export function refSubjectRuntimeEvent(
  event: RefSubjectDevtoolsEvent<unknown>,
  options: RefSubjectCaptureOptions = {},
): RuntimeEventEnvelope | undefined {
  const refSubjectId = (options.resolveId ?? defaultRefSubjectId)(event);
  if (!refSubjectId) return undefined;

  const base = {
    refSubjectId,
    timestamp: (options.now ?? Date.now)(),
    value: serializeDevtoolsValue(event.value, options.serialization),
    version: event.version,
  };

  if (event._tag === "Snapshot") {
    return {
      _tag: "RefSubjectSnapshot",
      subscriberCount: event.subscriberCount,
      ...base,
    };
  }

  return {
    _tag: "RefSubjectUpdated",
    ...base,
  };
}

export function defaultRefSubjectId(
  event: RefSubjectDevtoolsEvent<unknown>,
): RefSubjectId | undefined {
  const id = refSubjectIdentity(event);
  return id ? makeRefSubjectId(id) : undefined;
}

function resolveRuntime(options: RefSubjectCaptureOptions): DevtoolsRuntimeService {
  if (options.runtime) return options.runtime;

  return makeDevtoolsRuntime({
    enabled: true,
    eventBus:
      options.eventBus ?? makeRuntimeEventBus({ enabled: true, maxEvents: options.maxEvents }),
  });
}

function refSubjectIdentity(event: RefSubjectDevtoolsEvent<unknown>): string | undefined {
  if (event.serviceId) return event.serviceId;
  if (event.ownerId && event.id) return `${event.ownerId}#${event.id}`;
  return event.id;
}
