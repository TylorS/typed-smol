import type {
  ComponentId,
  ComponentSummary,
  FxNodeId,
  RefSubjectId,
  RuntimeEventEnvelope,
  RuntimeEventStreamItem,
  RuntimeReplayState,
  SerializedValue,
} from "@typed/devtools-protocol";

export interface TypedDevtoolsPanelState {
  readonly components: ReadonlyMap<ComponentId, ComponentSummary>;
  readonly fxNodes: ReadonlyMap<FxNodeId, FxNodePanelState>;
  readonly refSubjects: ReadonlyMap<RefSubjectId, RefSubjectPanelState>;
  readonly replay?: RuntimeReplayState;
}

export interface FxNodePanelState {
  readonly fxNodeId: FxNodeId;
  readonly lastPhase: Extract<RuntimeEventEnvelope, { readonly _tag: "FxNodeEvent" }>["phase"];
  readonly lastTimestamp: number;
  readonly value?: SerializedValue;
}

export interface RefSubjectPanelState {
  readonly refSubjectId: RefSubjectId;
  readonly subscriberCount?: number;
  readonly value: SerializedValue;
  readonly version: number;
}

export function createTypedDevtoolsPanelState(): TypedDevtoolsPanelState {
  return {
    components: new Map(),
    fxNodes: new Map(),
    refSubjects: new Map(),
  };
}

export function applyRuntimeStreamItem(
  state: TypedDevtoolsPanelState,
  item: RuntimeEventStreamItem,
): TypedDevtoolsPanelState {
  if (item._tag === "RuntimeReplayState") return applyReplayState(item.state);
  return applyRuntimeEvent(state, item);
}

function applyReplayState(replay: RuntimeReplayState): TypedDevtoolsPanelState {
  return { ...createTypedDevtoolsPanelState(), replay };
}

function applyRuntimeEvent(
  state: TypedDevtoolsPanelState,
  event: RuntimeEventEnvelope,
): TypedDevtoolsPanelState {
  switch (event._tag) {
    case "ComponentMounted":
      return putComponent(state, event.component);
    case "ComponentUnmounted":
      return deleteComponent(state, event.componentId);
    case "FxNodeEvent":
      return putFxNode(state, {
        fxNodeId: event.fxNodeId,
        lastPhase: event.phase,
        lastTimestamp: event.timestamp,
        ...(event.value && { value: event.value }),
      });
    case "RefSubjectSnapshot":
      return putRefSubject(state, {
        refSubjectId: event.refSubjectId,
        subscriberCount: event.subscriberCount,
        value: event.value,
        version: event.version,
      });
    case "RefSubjectUpdated":
      return putRefSubject(state, {
        refSubjectId: event.refSubjectId,
        value: event.value,
        version: event.version,
      });
    case "HmrStatus":
    case "NavigationEvent":
    case "OtelSpan":
      return state;
  }
}

function putComponent(
  state: TypedDevtoolsPanelState,
  component: ComponentSummary,
): TypedDevtoolsPanelState {
  return { ...state, components: new Map(state.components).set(component.componentId, component) };
}

function deleteComponent(
  state: TypedDevtoolsPanelState,
  componentId: ComponentId,
): TypedDevtoolsPanelState {
  const components = new Map(state.components);
  components.delete(componentId);
  return { ...state, components };
}

function putFxNode(
  state: TypedDevtoolsPanelState,
  fxNode: FxNodePanelState,
): TypedDevtoolsPanelState {
  return { ...state, fxNodes: new Map(state.fxNodes).set(fxNode.fxNodeId, fxNode) };
}

function putRefSubject(
  state: TypedDevtoolsPanelState,
  refSubject: RefSubjectPanelState,
): TypedDevtoolsPanelState {
  const previous = state.refSubjects.get(refSubject.refSubjectId);
  const next = {
    ...previous,
    ...refSubject,
  };
  return { ...state, refSubjects: new Map(state.refSubjects).set(next.refSubjectId, next) };
}

export function devtoolsDeepLink(kind: string, id: string): string {
  return `typed://${kind}/${encodeURIComponent(id)}`;
}
