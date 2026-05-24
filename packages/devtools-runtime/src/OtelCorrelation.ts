import type { RuntimeEventEnvelope, TypedCorrelationId } from "@typed/devtools-protocol";
import { makeRuntimeEventBus, type RuntimeEventBus } from "./EventBus.js";
import { makeDevtoolsRuntime, type DevtoolsRuntimeService } from "./Layer.js";

export interface OtelSpanCorrelation {
  readonly name: string;
  readonly spanId: string;
  readonly traceId: string;
  readonly typedIds?: readonly TypedCorrelationId[];
}

export interface OtelCorrelationOptions {
  readonly eventBus?: RuntimeEventBus;
  readonly maxEvents?: number;
  readonly runtime?: DevtoolsRuntimeService;
}

export interface OtelCorrelation {
  readonly emit: (span: OtelSpanCorrelation) => void;
  readonly emitAll: (spans: readonly OtelSpanCorrelation[]) => void;
  readonly runtime: DevtoolsRuntimeService;
  readonly snapshot: () => readonly RuntimeEventEnvelope[];
}

export function makeOtelCorrelation(options: OtelCorrelationOptions = {}): OtelCorrelation {
  const runtime = resolveRuntime(options);
  const emit = (span: OtelSpanCorrelation) => runtime.emit(otelRuntimeEvent(span));

  return {
    emit,
    emitAll(spans) {
      for (const span of spans) emit(span);
    },
    runtime,
    snapshot: runtime.snapshot,
  };
}

export function otelRuntimeEvent(span: OtelSpanCorrelation): RuntimeEventEnvelope {
  return {
    _tag: "OtelSpan",
    name: span.name,
    spanId: span.spanId,
    traceId: span.traceId,
    typedIds: [...(span.typedIds ?? [])],
  };
}

function resolveRuntime(options: OtelCorrelationOptions): DevtoolsRuntimeService {
  if (options.runtime) return options.runtime;

  return makeDevtoolsRuntime({
    enabled: true,
    eventBus:
      options.eventBus ?? makeRuntimeEventBus({ enabled: true, maxEvents: options.maxEvents }),
  });
}
