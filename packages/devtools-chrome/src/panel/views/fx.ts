import type { FxNodeId } from "@typed/devtools-protocol";
import { devtoolsDeepLink, type TypedDevtoolsPanelState } from "../state.js";

export interface FxPanelRow {
  readonly deepLink: string;
  readonly fxNodeId: FxNodeId;
  readonly lastPhase: string;
  readonly lastTimestamp: number;
}

export function fxRows(state: TypedDevtoolsPanelState): readonly FxPanelRow[] {
  return [...state.fxNodes.values()].map((fxNode) => ({
    deepLink: devtoolsDeepLink("fx", fxNode.fxNodeId),
    fxNodeId: fxNode.fxNodeId,
    lastPhase: fxNode.lastPhase,
    lastTimestamp: fxNode.lastTimestamp,
  }));
}
