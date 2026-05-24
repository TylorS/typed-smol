import {
  DevtoolsProtocolFixtures,
  type ComponentId,
  type FxNodeId,
  type HmrBoundaryId,
  type RefSubjectId,
  type RuntimeEventEnvelope,
  type RuntimeEventStreamItem,
  type RuntimeReplayState,
  type SerializedValue,
  type TemplateHash,
} from "@typed/devtools-protocol";

export interface StorybookDevtoolsFixture {
  readonly components: readonly StorybookDevtoolsComponentRow[];
  readonly fx: readonly StorybookDevtoolsFxRow[];
  readonly hmr: readonly StorybookDevtoolsHmrRow[];
  readonly peer: "storybook-fixture";
  readonly refSubjects: readonly StorybookDevtoolsRefSubjectRow[];
  readonly replay?: RuntimeReplayState;
}

export interface StorybookDevtoolsComponentRow {
  readonly componentId: ComponentId;
  readonly displayName: string;
  readonly fxCount: number;
  readonly refSubjectCount: number;
  readonly templateHash?: TemplateHash;
}

export interface StorybookDevtoolsFxRow {
  readonly fxNodeId: FxNodeId;
  readonly lastPhase: Extract<RuntimeEventEnvelope, { readonly _tag: "FxNodeEvent" }>["phase"];
  readonly lastTimestamp: number;
  readonly value?: SerializedValue;
}

export interface StorybookDevtoolsRefSubjectRow {
  readonly refSubjectId: RefSubjectId;
  readonly subscriberCount?: number;
  readonly value: SerializedValue;
  readonly version: number;
}

export interface StorybookDevtoolsHmrRow {
  readonly boundaryId: HmrBoundaryId;
  readonly moduleId: string;
  readonly optimized: boolean;
  readonly stateful: Extract<
    RuntimeEventEnvelope,
    { readonly _tag: "HmrStatus" }
  >["stateful"]["_tag"];
  readonly templateHash?: TemplateHash;
}

export function makeStorybookDevtoolsFixture(): StorybookDevtoolsFixture {
  return storybookDevtoolsRuntimeModel(DevtoolsProtocolFixtures.storybook.runtimeStreamItems);
}

export function storybookDevtoolsRuntimeModel(
  items: readonly RuntimeEventStreamItem[],
): StorybookDevtoolsFixture {
  const components = new Map<ComponentId, StorybookDevtoolsComponentRow>();
  const fx = new Map<FxNodeId, StorybookDevtoolsFxRow>();
  const hmr = new Map<HmrBoundaryId, StorybookDevtoolsHmrRow>();
  const refSubjects = new Map<RefSubjectId, StorybookDevtoolsRefSubjectRow>();
  let replay: RuntimeReplayState | undefined;

  for (const item of items) {
    if (item._tag === "RuntimeReplayState") replay = item.state;
    else applyRuntimeEvent({ components, fx, hmr, refSubjects }, item);
  }

  return {
    components: [...components.values()],
    fx: [...fx.values()],
    hmr: [...hmr.values()],
    peer: "storybook-fixture",
    refSubjects: [...refSubjects.values()],
    ...(replay && { replay }),
  };
}

interface StorybookDevtoolsModelMaps {
  readonly components: Map<ComponentId, StorybookDevtoolsComponentRow>;
  readonly fx: Map<FxNodeId, StorybookDevtoolsFxRow>;
  readonly hmr: Map<HmrBoundaryId, StorybookDevtoolsHmrRow>;
  readonly refSubjects: Map<RefSubjectId, StorybookDevtoolsRefSubjectRow>;
}

function applyRuntimeEvent(maps: StorybookDevtoolsModelMaps, event: RuntimeEventEnvelope): void {
  switch (event._tag) {
    case "ComponentMounted":
      maps.components.set(event.component.componentId, {
        componentId: event.component.componentId,
        displayName: event.component.displayName,
        fxCount: event.component.fxNodeIds.length,
        refSubjectCount: event.component.refSubjectIds.length,
        ...(event.component.templateHash && { templateHash: event.component.templateHash }),
      });
      return;
    case "ComponentUnmounted":
      maps.components.delete(event.componentId);
      return;
    case "FxNodeEvent":
      maps.fx.set(event.fxNodeId, {
        fxNodeId: event.fxNodeId,
        lastPhase: event.phase,
        lastTimestamp: event.timestamp,
        ...(event.value && { value: event.value }),
      });
      return;
    case "HmrStatus":
      maps.hmr.set(event.boundaryId, {
        boundaryId: event.boundaryId,
        moduleId: event.moduleId,
        optimized: event.template.optimized,
        stateful: event.stateful._tag,
        ...(event.template.templateHash && { templateHash: event.template.templateHash }),
      });
      return;
    case "RefSubjectSnapshot":
    case "RefSubjectUpdated":
      putRefSubject(maps.refSubjects, event);
      return;
    case "NavigationEvent":
    case "OtelSpan":
      return;
  }
}

function putRefSubject(
  refSubjects: Map<RefSubjectId, StorybookDevtoolsRefSubjectRow>,
  event: Extract<
    RuntimeEventEnvelope,
    { readonly _tag: "RefSubjectSnapshot" | "RefSubjectUpdated" }
  >,
): void {
  const previous = refSubjects.get(event.refSubjectId);
  refSubjects.set(event.refSubjectId, {
    ...previous,
    refSubjectId: event.refSubjectId,
    ...("subscriberCount" in event && { subscriberCount: event.subscriberCount }),
    value: event.value,
    version: event.version,
  });
}
