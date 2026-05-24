import {
  RuntimeEventEnvelopeSchema,
  decodeDevtoolsPayload,
  type DevtoolsCapability,
  type DevtoolsSessionId,
  type RuntimeEventEnvelope,
  type RuntimeEventSubscriptionRequest,
  type RuntimeReplayState,
} from "@typed/devtools-protocol";

export interface RuntimeEventBusOptions {
  readonly enabled?: boolean;
  readonly maxEvents?: number;
  readonly sessionId?: DevtoolsSessionId;
}

export interface RuntimeEventReplay {
  readonly events: readonly RuntimeEventEnvelope[];
  readonly state: RuntimeReplayState;
}

export interface RuntimeEventBus {
  readonly enabled: boolean;
  readonly sessionId?: DevtoolsSessionId;
  readonly emit: (event: RuntimeEventEnvelope) => void;
  readonly replay: (request: RuntimeEventSubscriptionRequest) => RuntimeEventReplay;
  readonly snapshot: () => readonly RuntimeEventEnvelope[];
}

interface RuntimeEventRecord {
  readonly event: RuntimeEventEnvelope;
  readonly sequence: number;
}

const DEFAULT_MAX_EVENTS = 500;

export function makeRuntimeEventBus(options: RuntimeEventBusOptions = {}): RuntimeEventBus {
  const enabled = options.enabled === true;
  const maxEvents = Math.max(1, Math.trunc(options.maxEvents ?? DEFAULT_MAX_EVENTS));
  const history: RuntimeEventRecord[] = [];
  let droppedEvents = 0;
  let nextSequence = 1;

  return {
    enabled,
    emit(event) {
      if (!enabled) return;
      history.push({
        event: decodeRuntimeEvent(cloneRuntimeEvent(event)),
        sequence: nextSequence,
      });
      nextSequence += 1;
      while (history.length > maxEvents) {
        history.shift();
        droppedEvents += 1;
      }
    },
    replay(request) {
      if (!enabled) {
        return {
          events: [],
          state: {
            _tag: "Disabled",
            droppedEvents: 0,
            nextSequence,
            reconnectable: false,
            retainedEvents: 0,
          },
        };
      }
      if (isSessionMismatch(options.sessionId, request.sessionId)) {
        return {
          events: [],
          state: {
            _tag: "SessionMismatch",
            droppedEvents,
            nextSequence,
            reconnectable: false,
            requestedSessionId: request.sessionId,
            retainedEvents: history.length,
            ...(options.sessionId && { sessionId: options.sessionId }),
          },
        };
      }

      const events =
        request.replay === true
          ? history
              .filter((record) => isAfterSequence(record, request.sinceSequence))
              .filter((record) => matchesCapabilities(record.event, request.capabilities))
              .map((record) => cloneRuntimeEvent(record.event))
          : [];

      return {
        events,
        state: replayState({
          droppedEvents,
          history,
          nextSequence,
          sinceSequence: request.sinceSequence,
          sessionId: options.sessionId,
        }),
      };
    },
    sessionId: options.sessionId,
    snapshot() {
      return history.map((record) => cloneRuntimeEvent(record.event));
    },
  };
}

function replayState(input: {
  readonly droppedEvents: number;
  readonly history: readonly RuntimeEventRecord[];
  readonly nextSequence: number;
  readonly sinceSequence?: number;
  readonly sessionId?: DevtoolsSessionId;
}): Extract<RuntimeReplayState, { readonly _tag: "Partial" | "Ready" }> {
  const oldestRetainedSequence = input.history[0]?.sequence;
  const partial =
    input.droppedEvents > 0 &&
    (input.sinceSequence === undefined ||
      (oldestRetainedSequence !== undefined && input.sinceSequence < oldestRetainedSequence));
  const base = {
    droppedEvents: input.droppedEvents,
    nextSequence: input.nextSequence,
    ...(oldestRetainedSequence !== undefined && { oldestRetainedSequence }),
    reconnectable: true as const,
    retainedEvents: input.history.length,
    ...(input.sessionId && { sessionId: input.sessionId }),
  };

  if (partial) {
    return {
      _tag: "Partial",
      reason: "retention-limit-exceeded",
      ...base,
    };
  }

  return {
    _tag: "Ready",
    ...base,
  };
}

function isSessionMismatch(
  sessionId: DevtoolsSessionId | undefined,
  requestedSessionId: DevtoolsSessionId,
): boolean {
  return sessionId !== undefined && sessionId !== requestedSessionId;
}

function isAfterSequence(record: RuntimeEventRecord, sinceSequence: number | undefined): boolean {
  return sinceSequence === undefined || record.sequence > sinceSequence;
}

function matchesCapabilities(
  event: RuntimeEventEnvelope,
  capabilities: readonly DevtoolsCapability[],
): boolean {
  return capabilities.includes(capabilityOf(event));
}

function capabilityOf(event: RuntimeEventEnvelope): DevtoolsCapability {
  switch (event._tag) {
    case "ComponentMounted":
    case "ComponentUnmounted":
      return "components";
    case "FxNodeEvent":
      return "fx";
    case "HmrStatus":
      return "hmr";
    case "NavigationEvent":
      return "navigation";
    case "OtelSpan":
      return "otel";
    case "RefSubjectSnapshot":
    case "RefSubjectUpdated":
      return "refsubjects";
  }
}

function decodeRuntimeEvent(event: RuntimeEventEnvelope): RuntimeEventEnvelope {
  return decodeDevtoolsPayload(RuntimeEventEnvelopeSchema, event);
}

function cloneRuntimeEvent(event: RuntimeEventEnvelope): RuntimeEventEnvelope {
  return structuredClone(event);
}
