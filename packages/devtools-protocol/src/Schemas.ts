import * as Schema from "effect/Schema";
import {
  DEVTOOLS_PROTOCOL_VERSION,
  type ComponentId,
  type DevtoolsClientId,
  type DevtoolsSessionId,
  type DomBindingId,
  type FxNodeId,
  type HmrBoundaryId,
  type NavigationEventId,
  type RefSubjectId,
  type SourceLocationId,
  type TemplateHash,
  type TemplatePartId,
  parseComponentId,
  parseDevtoolsClientId,
  parseDevtoolsSessionId,
  parseDomBindingId,
  parseFxNodeId,
  parseHmrBoundaryId,
  parseNavigationEventId,
  parseRefSubjectId,
  parseSourceLocationId,
  parseTemplateHash,
  parseTemplatePartId,
} from "./Ids.js";
import { SerializedValueSchema } from "./Serialization.js";

const FiniteNumberSchema = Schema.Number.check(Schema.isFinite());

export const ComponentIdSchema = idSchema<ComponentId>(parseComponentId);
export const TemplateHashSchema = idSchema<TemplateHash>(parseTemplateHash);
export const TemplatePartIdSchema = idSchema<TemplatePartId>(parseTemplatePartId);
export const DomBindingIdSchema = idSchema<DomBindingId>(parseDomBindingId);
export const FxNodeIdSchema = idSchema<FxNodeId>(parseFxNodeId);
export const RefSubjectIdSchema = idSchema<RefSubjectId>(parseRefSubjectId);
export const HmrBoundaryIdSchema = idSchema<HmrBoundaryId>(parseHmrBoundaryId);
export const NavigationEventIdSchema = idSchema<NavigationEventId>(parseNavigationEventId);
export const SourceLocationIdSchema = idSchema<SourceLocationId>(parseSourceLocationId);
export const DevtoolsSessionIdSchema = idSchema<DevtoolsSessionId>(parseDevtoolsSessionId);
export const DevtoolsClientIdSchema = idSchema<DevtoolsClientId>(parseDevtoolsClientId);

export const DevtoolsCapabilitySchema = Schema.Union([
  Schema.Literal("components"),
  Schema.Literal("dom"),
  Schema.Literal("fx"),
  Schema.Literal("hmr"),
  Schema.Literal("navigation"),
  Schema.Literal("otel"),
  Schema.Literal("refsubjects"),
  Schema.Literal("source-analyzer"),
]);
export type DevtoolsCapability = typeof DevtoolsCapabilitySchema.Type;

export const DevtoolsPeerSchema = Schema.Union([
  Schema.Literal("extension-panel"),
  Schema.Literal("inspected-runtime"),
  Schema.Literal("dev-server"),
  Schema.Literal("storybook-fixture"),
]);
export type DevtoolsPeer = typeof DevtoolsPeerSchema.Type;

export const SourcePositionSchema = Schema.Struct({
  column: FiniteNumberSchema,
  line: FiniteNumberSchema,
});
export type SourcePosition = typeof SourcePositionSchema.Type;

export const SourceLocationSchema = Schema.Struct({
  id: SourceLocationIdSchema,
  column: FiniteNumberSchema,
  fileName: Schema.String,
  line: FiniteNumberSchema,
});
export type SourceLocation = typeof SourceLocationSchema.Type;

export const DevtoolsHandshakeRequestSchema = Schema.Struct({
  capabilities: Schema.Array(DevtoolsCapabilitySchema),
  clientId: DevtoolsClientIdSchema,
  peer: DevtoolsPeerSchema,
  sessionId: DevtoolsSessionIdSchema,
  version: Schema.Literal(DEVTOOLS_PROTOCOL_VERSION),
});
export type DevtoolsHandshakeRequest = typeof DevtoolsHandshakeRequestSchema.Type;

export const DevtoolsHandshakeResponseSchema = Schema.Struct({
  acceptedCapabilities: Schema.Array(DevtoolsCapabilitySchema),
  peer: DevtoolsPeerSchema,
  sessionId: DevtoolsSessionIdSchema,
  unsupportedCapabilities: Schema.Array(DevtoolsCapabilitySchema),
  version: Schema.Literal(DEVTOOLS_PROTOCOL_VERSION),
});
export type DevtoolsHandshakeResponse = typeof DevtoolsHandshakeResponseSchema.Type;

export const ComponentSummarySchema = Schema.Struct({
  componentId: ComponentIdSchema,
  displayName: Schema.String,
  fxNodeIds: Schema.Array(FxNodeIdSchema),
  hmrBoundaryId: Schema.optional(HmrBoundaryIdSchema),
  refSubjectIds: Schema.Array(RefSubjectIdSchema),
  sourceLocationId: Schema.optional(SourceLocationIdSchema),
  templateHash: Schema.optional(TemplateHashSchema),
});
export type ComponentSummary = typeof ComponentSummarySchema.Type;

export const HmrRejectionReasonSchema = Schema.Union([
  Schema.Literal("anonymous-refsubject"),
  Schema.Literal("dependency-cycle"),
  Schema.Literal("explicit-opt-out"),
  Schema.Literal("incompatible-boundary"),
  Schema.Literal("missing-service-identity"),
  Schema.Literal("unsupported-compiler-shape"),
]);
export type HmrRejectionReason = typeof HmrRejectionReasonSchema.Type;

export const HmrStatefulStatusSchema = Schema.Union([
  Schema.Struct({
    _tag: Schema.Literal("Eligible"),
    serviceIds: Schema.Array(Schema.String),
  }),
  Schema.Struct({
    _tag: Schema.Literal("Rejected"),
    reasons: Schema.Array(HmrRejectionReasonSchema),
  }),
  Schema.Struct({
    _tag: Schema.Literal("Unknown"),
    reason: Schema.String,
  }),
]);
export type HmrStatefulStatus = typeof HmrStatefulStatusSchema.Type;

export const HmrStatusFactSchema = Schema.Struct({
  _tag: Schema.Literal("HmrStatus"),
  boundaryId: HmrBoundaryIdSchema,
  moduleId: Schema.String,
  stateful: HmrStatefulStatusSchema,
  template: Schema.Struct({
    optimized: Schema.Boolean,
    templateHash: Schema.optional(TemplateHashSchema),
  }),
  timestamp: FiniteNumberSchema,
});
export type HmrStatusFact = typeof HmrStatusFactSchema.Type;

export const TypedCorrelationIdSchema = Schema.Union([
  ComponentIdSchema,
  DomBindingIdSchema,
  FxNodeIdSchema,
  HmrBoundaryIdSchema,
  NavigationEventIdSchema,
  RefSubjectIdSchema,
  SourceLocationIdSchema,
  TemplateHashSchema,
  TemplatePartIdSchema,
]);
export type TypedCorrelationId = typeof TypedCorrelationIdSchema.Type;

export const DomBindingRequestSchema = Schema.Struct({
  bindingId: DomBindingIdSchema,
  includeRelated: Schema.optional(Schema.Boolean),
});
export type DomBindingRequest = typeof DomBindingRequestSchema.Type;

export const DomBindingResolutionSchema = Schema.Union([
  Schema.Struct({
    _tag: Schema.Literal("Resolved"),
    bindingId: DomBindingIdSchema,
    component: ComponentSummarySchema,
    templatePartId: Schema.optional(TemplatePartIdSchema),
  }),
  Schema.Struct({
    _tag: Schema.Literal("Unbound"),
    bindingId: DomBindingIdSchema,
    reason: Schema.String,
  }),
]);
export type DomBindingResolution = typeof DomBindingResolutionSchema.Type;

export const RuntimeEventSubscriptionRequestSchema = Schema.Struct({
  capabilities: Schema.Array(DevtoolsCapabilitySchema),
  replay: Schema.optional(Schema.Boolean),
  sessionId: DevtoolsSessionIdSchema,
  sinceSequence: Schema.optional(FiniteNumberSchema),
});
export type RuntimeEventSubscriptionRequest = typeof RuntimeEventSubscriptionRequestSchema.Type;

export const RuntimeReplayStateSchema = Schema.Union([
  Schema.Struct({
    _tag: Schema.Literal("Disabled"),
    droppedEvents: Schema.Literal(0),
    nextSequence: FiniteNumberSchema,
    reconnectable: Schema.Literal(false),
    retainedEvents: Schema.Literal(0),
  }),
  Schema.Struct({
    _tag: Schema.Literal("Ready"),
    droppedEvents: FiniteNumberSchema,
    nextSequence: FiniteNumberSchema,
    oldestRetainedSequence: Schema.optional(FiniteNumberSchema),
    reconnectable: Schema.Literal(true),
    retainedEvents: FiniteNumberSchema,
    sessionId: Schema.optional(DevtoolsSessionIdSchema),
  }),
  Schema.Struct({
    _tag: Schema.Literal("Partial"),
    droppedEvents: FiniteNumberSchema,
    nextSequence: FiniteNumberSchema,
    oldestRetainedSequence: Schema.optional(FiniteNumberSchema),
    reason: Schema.Literal("retention-limit-exceeded"),
    reconnectable: Schema.Literal(true),
    retainedEvents: FiniteNumberSchema,
    sessionId: Schema.optional(DevtoolsSessionIdSchema),
  }),
  Schema.Struct({
    _tag: Schema.Literal("SessionMismatch"),
    droppedEvents: FiniteNumberSchema,
    nextSequence: FiniteNumberSchema,
    reconnectable: Schema.Literal(false),
    requestedSessionId: DevtoolsSessionIdSchema,
    retainedEvents: FiniteNumberSchema,
    sessionId: Schema.optional(DevtoolsSessionIdSchema),
  }),
]);
export type RuntimeReplayState = typeof RuntimeReplayStateSchema.Type;

export const RuntimeEventEnvelopeSchema = Schema.Union([
  Schema.Struct({
    _tag: Schema.Literal("ComponentMounted"),
    component: ComponentSummarySchema,
    timestamp: FiniteNumberSchema,
  }),
  Schema.Struct({
    _tag: Schema.Literal("ComponentUnmounted"),
    componentId: ComponentIdSchema,
    timestamp: FiniteNumberSchema,
  }),
  Schema.Struct({
    _tag: Schema.Literal("RefSubjectSnapshot"),
    refSubjectId: RefSubjectIdSchema,
    subscriberCount: FiniteNumberSchema,
    timestamp: FiniteNumberSchema,
    value: SerializedValueSchema,
    version: FiniteNumberSchema,
  }),
  Schema.Struct({
    _tag: Schema.Literal("RefSubjectUpdated"),
    refSubjectId: RefSubjectIdSchema,
    timestamp: FiniteNumberSchema,
    value: SerializedValueSchema,
    version: FiniteNumberSchema,
  }),
  Schema.Struct({
    _tag: Schema.Literal("FxNodeEvent"),
    fxNodeId: FxNodeIdSchema,
    phase: Schema.Union([
      Schema.Literal("started"),
      Schema.Literal("emitted"),
      Schema.Literal("failed"),
      Schema.Literal("completed"),
      Schema.Literal("interrupted"),
    ]),
    timestamp: FiniteNumberSchema,
    value: Schema.optional(SerializedValueSchema),
  }),
  Schema.Struct({
    _tag: Schema.Literal("NavigationEvent"),
    navigationEventId: NavigationEventIdSchema,
    timestamp: FiniteNumberSchema,
    to: Schema.String,
    type: Schema.String,
  }),
  Schema.Struct({
    _tag: Schema.Literal("OtelSpan"),
    name: Schema.String,
    spanId: Schema.String,
    traceId: Schema.String,
    typedIds: Schema.Array(TypedCorrelationIdSchema),
  }),
  HmrStatusFactSchema,
]);
export type RuntimeEventEnvelope = typeof RuntimeEventEnvelopeSchema.Type;

export const RuntimeReplayStateEnvelopeSchema = Schema.Struct({
  _tag: Schema.Literal("RuntimeReplayState"),
  state: RuntimeReplayStateSchema,
});
export type RuntimeReplayStateEnvelope = typeof RuntimeReplayStateEnvelopeSchema.Type;

export const RuntimeEventStreamItemSchema = Schema.Union([
  RuntimeReplayStateEnvelopeSchema,
  RuntimeEventEnvelopeSchema,
]);
export type RuntimeEventStreamItem = typeof RuntimeEventStreamItemSchema.Type;

export const SourceAnalyzerRequestSchema = Schema.Struct({
  column: Schema.optional(FiniteNumberSchema),
  line: Schema.optional(FiniteNumberSchema),
  requestedAt: FiniteNumberSchema,
  resource: Schema.String,
});
export type SourceAnalyzerRequest = typeof SourceAnalyzerRequestSchema.Type;

export const SourceAnalyzerFactSchema = Schema.Union([
  Schema.Struct({
    _tag: Schema.Literal("ComponentDefinition"),
    componentId: ComponentIdSchema,
    displayName: Schema.String,
    sourceLocationId: SourceLocationIdSchema,
  }),
  Schema.Struct({
    _tag: Schema.Literal("RefSubjectDefinition"),
    refSubjectId: RefSubjectIdSchema,
    sourceLocationId: SourceLocationIdSchema,
  }),
  Schema.Struct({
    _tag: Schema.Literal("FxDefinition"),
    fxNodeId: FxNodeIdSchema,
    sourceLocationId: SourceLocationIdSchema,
  }),
]);
export type SourceAnalyzerFact = typeof SourceAnalyzerFactSchema.Type;

export const SourceAnalyzerResponseSchema = Schema.Union([
  Schema.Struct({
    _tag: Schema.Literal("SourceFacts"),
    facts: Schema.Array(SourceAnalyzerFactSchema),
    requestedAt: FiniteNumberSchema,
    resource: Schema.String,
  }),
  Schema.Struct({
    _tag: Schema.Literal("Unavailable"),
    reason: Schema.String,
    requestedAt: FiniteNumberSchema,
  }),
]);
export type SourceAnalyzerResponse = typeof SourceAnalyzerResponseSchema.Type;

export function decodeDevtoolsPayload<T>(schema: Schema.Decoder<T, never>, payload: unknown): T {
  return Schema.decodeUnknownSync(schema)(payload, { onExcessProperty: "error" });
}

export function encodeDevtoolsPayload<T, E>(
  schema: Schema.Codec<T, E, never, never>,
  payload: T,
): E {
  return Schema.encodeUnknownSync(schema)(payload);
}

function idSchema<Id extends string>(parse: (value: string) => Id): Schema.Codec<Id, string> {
  return Schema.String.pipe(
    Schema.refine((value): value is Id => {
      try {
        parse(value);
        return true;
      } catch {
        return false;
      }
    }),
  );
}
