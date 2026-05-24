import type { HmrStatusFact, RuntimeEventEnvelope } from "@typed/devtools-protocol";
import { makeRuntimeEventBus, type RuntimeEventBus } from "./EventBus.js";
import { makeDevtoolsRuntime, type DevtoolsRuntimeService } from "./Layer.js";

export interface HmrCaptureOptions {
  readonly eventBus?: RuntimeEventBus;
  readonly maxEvents?: number;
  readonly runtime?: DevtoolsRuntimeService;
}

export interface HmrCapture {
  readonly emit: (fact: HmrStatusFact) => void;
  readonly emitAll: (facts: readonly HmrStatusFact[]) => void;
  readonly runtime: DevtoolsRuntimeService;
  readonly snapshot: () => readonly RuntimeEventEnvelope[];
}

export function makeHmrCapture(options: HmrCaptureOptions = {}): HmrCapture {
  const runtime = resolveRuntime(options);
  const emit = (fact: HmrStatusFact) => runtime.emit(fact);

  return {
    emit,
    emitAll(facts) {
      for (const fact of facts) emit(fact);
    },
    runtime,
    snapshot: runtime.snapshot,
  };
}

function resolveRuntime(options: HmrCaptureOptions): DevtoolsRuntimeService {
  if (options.runtime) return options.runtime;

  return makeDevtoolsRuntime({
    enabled: true,
    eventBus:
      options.eventBus ?? makeRuntimeEventBus({ enabled: true, maxEvents: options.maxEvents }),
  });
}
