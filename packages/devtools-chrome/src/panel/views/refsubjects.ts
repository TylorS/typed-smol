import type { RefSubjectId, SerializedValue } from "@typed/devtools-protocol";
import { devtoolsDeepLink, type TypedDevtoolsPanelState } from "../state.js";

export interface RefSubjectPanelRow {
  readonly deepLink: string;
  readonly refSubjectId: RefSubjectId;
  readonly subscriberCount?: number;
  readonly value: SerializedValue;
  readonly version: number;
}

export function refSubjectRows(state: TypedDevtoolsPanelState): readonly RefSubjectPanelRow[] {
  return [...state.refSubjects.values()].map((refSubject) => ({
    deepLink: devtoolsDeepLink("refsubject", refSubject.refSubjectId),
    refSubjectId: refSubject.refSubjectId,
    ...(refSubject.subscriberCount !== undefined && {
      subscriberCount: refSubject.subscriberCount,
    }),
    value: refSubject.value,
    version: refSubject.version,
  }));
}
