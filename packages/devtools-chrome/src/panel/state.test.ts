import {
  DevtoolsProtocolFixtures,
  makeFxNodeId,
  makeRefSubjectId,
  type RuntimeEventStreamItem,
  serializeDevtoolsValue,
} from "@typed/devtools-protocol";
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  applyRuntimeStreamItem,
  createTypedDevtoolsPanelState,
  type TypedDevtoolsPanelState,
} from "./state.js";
import { componentRows, templateRows, type ComponentPanelRow } from "./views/components.js";
import { fxRows, type FxPanelRow } from "./views/fx.js";
import { refSubjectRows, type RefSubjectPanelRow } from "./views/refsubjects.js";

describe("Typed DevTools panel state", () => {
  it("accumulates protocol runtime facts into stable panel rows", () => {
    const state = createTypedDevtoolsPanelState();
    const events: RuntimeEventStreamItem[] = [
      ...DevtoolsProtocolFixtures.runtimeStreamItems,
      {
        _tag: "FxNodeEvent",
        fxNodeId: makeFxNodeId("component/root/load-user"),
        phase: "emitted",
        timestamp: 4,
        value: serializeDevtoolsValue({ ok: true }),
      },
      {
        _tag: "RefSubjectSnapshot",
        refSubjectId: makeRefSubjectId("component/root/user"),
        subscriberCount: 2,
        timestamp: 5,
        value: serializeDevtoolsValue({ name: "Ada" }),
        version: 2,
      },
    ];
    const updated = events.reduce(applyRuntimeStreamItem, state);

    expect(updated.replay).toEqual(DevtoolsProtocolFixtures.runtimeStreamItems[0].state);
    expect(componentRows(updated)).toEqual([
      {
        componentId: "cmp:app/root",
        deepLink: "typed://component/cmp%3Aapp%2Froot",
        displayName: "Root",
        fxCount: 1,
        hmrBoundaryId: "hmr:module:/src/App.tsx",
        refSubjectCount: 1,
        templateHash: "tpl:sha256:root-template",
      },
    ]);
    expect(templateRows(updated)).toEqual([
      {
        componentId: "cmp:app/root",
        deepLink: "typed://template/tpl%3Asha256%3Aroot-template",
        displayName: "Root",
        templateHash: "tpl:sha256:root-template",
      },
    ]);
    expect(fxRows(updated)).toEqual([
      {
        deepLink: "typed://fx/fx%3Acomponent%2Froot%2Fload-user",
        fxNodeId: "fx:component/root/load-user",
        lastPhase: "emitted",
        lastTimestamp: 4,
      },
    ]);
    expect(refSubjectRows(updated)).toEqual([
      {
        deepLink: "typed://refsubject/ref%3Acomponent%2Froot%2Fuser",
        refSubjectId: "ref:component/root/user",
        subscriberCount: 2,
        value: serializeDevtoolsValue({ name: "Ada" }),
        version: 2,
      },
    ]);
  });

  it("removes unmounted components while preserving replay state", () => {
    const state = DevtoolsProtocolFixtures.runtimeStreamItems.reduce(
      applyRuntimeStreamItem,
      createTypedDevtoolsPanelState(),
    );
    const updated = applyRuntimeStreamItem(state, {
      _tag: "ComponentUnmounted",
      componentId: DevtoolsProtocolFixtures.ids.component,
      timestamp: 6,
    });

    expect(componentRows(updated)).toEqual([]);
    expect(updated.replay?._tag).toBe("Ready");
  });

  it("clears stale rows when a non-ready replay state arrives", () => {
    const state = DevtoolsProtocolFixtures.runtimeStreamItems.reduce(
      applyRuntimeStreamItem,
      createTypedDevtoolsPanelState(),
    );
    const updated = applyRuntimeStreamItem(state, {
      _tag: "RuntimeReplayState",
      state: {
        _tag: "SessionMismatch",
        droppedEvents: 0,
        nextSequence: 4,
        reconnectable: false,
        requestedSessionId: DevtoolsProtocolFixtures.ids.session,
        retainedEvents: 3,
        sessionId: DevtoolsProtocolFixtures.ids.session,
      },
    });

    expect(componentRows(updated)).toEqual([]);
    expect(fxRows(updated)).toEqual([]);
    expect(refSubjectRows(updated)).toEqual([]);
    expect(updated.replay?._tag).toBe("SessionMismatch");
  });

  it("preserves RefSubject subscriber count across value updates", () => {
    const refSubjectId = makeRefSubjectId("component/root/user");
    const snapshot = applyRuntimeStreamItem(createTypedDevtoolsPanelState(), {
      _tag: "RefSubjectSnapshot",
      refSubjectId,
      subscriberCount: 3,
      timestamp: 1,
      value: serializeDevtoolsValue({ name: "Ada" }),
      version: 1,
    });
    const updated = applyRuntimeStreamItem(snapshot, {
      _tag: "RefSubjectUpdated",
      refSubjectId,
      timestamp: 2,
      value: serializeDevtoolsValue({ name: "Grace" }),
      version: 2,
    });

    expect(refSubjectRows(updated)).toEqual([
      {
        deepLink: "typed://refsubject/ref%3Acomponent%2Froot%2Fuser",
        refSubjectId: "ref:component/root/user",
        subscriberCount: 3,
        value: serializeDevtoolsValue({ name: "Grace" }),
        version: 2,
      },
    ]);
  });

  it("keeps public panel view models typed", () => {
    const state = createTypedDevtoolsPanelState();

    expectTypeOf(state).toExtend<TypedDevtoolsPanelState>();
    expectTypeOf(componentRows(state)).toExtend<readonly ComponentPanelRow[]>();
    expectTypeOf(fxRows(state)).toExtend<readonly FxPanelRow[]>();
    expectTypeOf(refSubjectRows(state)).toExtend<readonly RefSubjectPanelRow[]>();
  });
});
