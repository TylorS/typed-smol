import * as Effect from "effect/Effect";
import * as Stream from "effect/Stream";
import {
  makeComponentId,
  makeDevtoolsClientId,
  makeDevtoolsSessionId,
  makeDomBindingId,
  makeFxNodeId,
  makeHmrBoundaryId,
  makeRefSubjectId,
  makeSourceLocationId,
  makeTemplateHash,
  makeTemplatePartId,
} from "./Ids.js";
import { TypedDevtoolsRpcGroup } from "./Rpc.js";
import type {
  ComponentSummary,
  DevtoolsHandshakeRequest,
  DevtoolsHandshakeResponse,
  DomBindingRequest,
  DomBindingResolution,
  RuntimeEventEnvelope,
  RuntimeEventStreamItem,
  RuntimeEventSubscriptionRequest,
  SourceAnalyzerRequest,
  SourceAnalyzerResponse,
} from "./Schemas.js";
import { serializeDevtoolsValue } from "./Serialization.js";

const ids = {
  client: makeDevtoolsClientId("panel-1"),
  component: makeComponentId("app/root"),
  domBinding: makeDomBindingId("button:submit"),
  fxNode: makeFxNodeId("component/root/load-user"),
  hmrBoundary: makeHmrBoundaryId("module:/src/App.tsx"),
  refSubject: makeRefSubjectId("component/root/user"),
  session: makeDevtoolsSessionId("session-1"),
  sourceLocation: makeSourceLocationId("src/App.tsx:12:3"),
  templateHash: makeTemplateHash("sha256:root-template"),
  templatePart: makeTemplatePartId("sha256:root-template#0.1"),
} as const;

const componentSummary = {
  componentId: ids.component,
  displayName: "Root",
  fxNodeIds: [ids.fxNode],
  hmrBoundaryId: ids.hmrBoundary,
  refSubjectIds: [ids.refSubject],
  sourceLocationId: ids.sourceLocation,
  templateHash: ids.templateHash,
} as const satisfies ComponentSummary;

const handshakeRequest = {
  capabilities: ["components", "dom", "fx", "hmr", "refsubjects", "source-analyzer"],
  clientId: ids.client,
  peer: "extension-panel",
  sessionId: ids.session,
  version: "0.1.0",
} as const satisfies DevtoolsHandshakeRequest;

const handshakeResponse = {
  acceptedCapabilities: handshakeRequest.capabilities,
  peer: "inspected-runtime",
  sessionId: ids.session,
  unsupportedCapabilities: [],
  version: "0.1.0",
} as const satisfies DevtoolsHandshakeResponse;

const runtimeSubscriptionRequest = {
  capabilities: ["components", "fx", "hmr", "refsubjects"],
  replay: true,
  sessionId: ids.session,
  sinceSequence: 0,
} as const satisfies RuntimeEventSubscriptionRequest;

const runtimeEvents = [
  {
    _tag: "ComponentMounted",
    component: componentSummary,
    timestamp: 1,
  },
  {
    _tag: "RefSubjectUpdated",
    refSubjectId: ids.refSubject,
    timestamp: 2,
    value: serializeDevtoolsValue({ name: "Ada" }),
    version: 1,
  },
  {
    _tag: "HmrStatus",
    boundaryId: ids.hmrBoundary,
    moduleId: "/src/App.tsx",
    stateful: { _tag: "Eligible", serviceIds: ["UserSession"] },
    template: { optimized: true, templateHash: ids.templateHash },
    timestamp: 3,
  },
] as const satisfies readonly RuntimeEventEnvelope[];

const runtimeStreamItems = [
  {
    _tag: "RuntimeReplayState",
    state: {
      _tag: "Ready",
      droppedEvents: 0,
      nextSequence: 4,
      oldestRetainedSequence: 1,
      reconnectable: true,
      retainedEvents: 3,
      sessionId: ids.session,
    },
  },
  ...runtimeEvents,
] as const satisfies readonly RuntimeEventStreamItem[];

const domBindingRequest = {
  bindingId: ids.domBinding,
  includeRelated: true,
} as const satisfies DomBindingRequest;

const domBindingResolution = {
  _tag: "Resolved",
  bindingId: ids.domBinding,
  component: componentSummary,
  templatePartId: ids.templatePart,
} as const satisfies DomBindingResolution;

const sourceAnalyzerRequest = {
  column: 3,
  line: 12,
  requestedAt: 4,
  resource: "file:///workspace/src/App.tsx",
} as const satisfies SourceAnalyzerRequest;

const sourceAnalyzerResponse = {
  _tag: "SourceFacts",
  facts: [
    {
      _tag: "ComponentDefinition",
      componentId: ids.component,
      displayName: "Root",
      sourceLocationId: ids.sourceLocation,
    },
  ],
  requestedAt: 4,
  resource: "file:///workspace/src/App.tsx",
} as const satisfies SourceAnalyzerResponse;

export const DevtoolsProtocolFixtures = {
  ids,
  componentSummary,
  domBindingRequest,
  domBindingResolution,
  handshakeRequest,
  handshakeResponse,
  runtimeEvents,
  runtimeStreamItems,
  runtimeSubscriptionRequest,
  sourceAnalyzerRequest,
  sourceAnalyzerResponse,
} as const;

export function makeDevtoolsProtocolFixtureHandlers() {
  return TypedDevtoolsRpcGroup.of({
    AnalyzeSource: () => Effect.succeed(sourceAnalyzerResponse),
    Handshake: () => Effect.succeed(handshakeResponse),
    ResolveDomBinding: () => Effect.succeed(domBindingResolution),
    SubscribeRuntimeEvents: () => Stream.fromIterable(runtimeStreamItems),
  });
}
