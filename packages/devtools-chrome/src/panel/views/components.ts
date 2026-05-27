import type {
  ComponentId,
  DomBindingId,
  HmrBoundaryId,
  TemplateHash,
} from "@typed/devtools-protocol";
import { devtoolsDeepLink, type TypedDevtoolsPanelState } from "../state.js";

export interface ComponentPanelRow {
  readonly componentId: ComponentId;
  readonly deepLink: string;
  readonly displayName: string;
  readonly domBindingIds: readonly DomBindingId[];
  readonly fxCount: number;
  readonly hmrBoundaryId?: HmrBoundaryId;
  readonly refSubjectCount: number;
  readonly templateHash?: TemplateHash;
}

export interface TemplatePanelRow {
  readonly componentId: ComponentId;
  readonly deepLink: string;
  readonly displayName: string;
  readonly templateHash: TemplateHash;
}

export function componentRows(state: TypedDevtoolsPanelState): readonly ComponentPanelRow[] {
  return [...state.components.values()].map((component) => ({
    componentId: component.componentId,
    deepLink: devtoolsDeepLink("component", component.componentId),
    displayName: component.displayName,
    domBindingIds: component.domBindingIds ?? [],
    fxCount: component.fxNodeIds.length,
    ...(component.hmrBoundaryId && { hmrBoundaryId: component.hmrBoundaryId }),
    refSubjectCount: component.refSubjectIds.length,
    ...(component.templateHash && { templateHash: component.templateHash }),
  }));
}

export function templateRows(state: TypedDevtoolsPanelState): readonly TemplatePanelRow[] {
  return [...state.components.values()].flatMap((component) => {
    if (!component.templateHash) return [];
    return {
      componentId: component.componentId,
      deepLink: devtoolsDeepLink("template", component.templateHash),
      displayName: component.displayName,
      templateHash: component.templateHash,
    };
  });
}
