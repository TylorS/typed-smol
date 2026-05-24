import { DevtoolsProtocolFixtures } from "@typed/devtools-protocol";
import { describe, expect, expectTypeOf, it } from "vitest";
import { makeStorybookDevtoolsFixture as makePublicStorybookDevtoolsFixture } from "./index.js";
import {
  makeStorybookDevtoolsFixture,
  storybookDevtoolsRuntimeModel,
  type StorybookDevtoolsFixture,
} from "./devtoolsFixtures.js";

describe("Storybook DevTools fixtures", () => {
  it("renders protocol runtime facts without Chrome APIs", () => {
    const fixture = makeStorybookDevtoolsFixture();

    expectTypeOf(fixture).toExtend<StorybookDevtoolsFixture>();
    expect(fixture.peer).toBe("storybook-fixture");
    expect(fixture.components).toEqual([
      {
        componentId: "cmp:app/root",
        displayName: "Root",
        fxCount: 1,
        refSubjectCount: 1,
        templateHash: "tpl:sha256:root-template",
      },
    ]);
    expect(fixture.fx).toEqual([
      {
        fxNodeId: "fx:component/root/load-user",
        lastPhase: "emitted",
        lastTimestamp: 3,
        value: expect.objectContaining({ _tag: "Object" }),
      },
    ]);
    expect(fixture.refSubjects).toEqual([
      {
        refSubjectId: "ref:component/root/user",
        subscriberCount: 1,
        value: expect.objectContaining({ _tag: "Object" }),
        version: 1,
      },
    ]);
    expect(fixture.hmr).toEqual([
      {
        boundaryId: "hmr:module:/src/App.tsx",
        moduleId: "/src/App.tsx",
        optimized: true,
        stateful: "Eligible",
        templateHash: "tpl:sha256:root-template",
      },
    ]);
    expect(JSON.stringify(fixture)).not.toMatch(/chrome|devtools_page|runtime\.connect/);
  });

  it("uses protocol-owned Storybook runtime stream fixtures", () => {
    const model = storybookDevtoolsRuntimeModel(
      DevtoolsProtocolFixtures.storybook.runtimeStreamItems,
    );

    expect(model.replay).toMatchObject({
      _tag: "Ready",
      reconnectable: true,
      retainedEvents: 4,
    });
    expect(model.components[0]?.componentId).toBe(DevtoolsProtocolFixtures.ids.component);
    expect(model.fx[0]?.fxNodeId).toBe(DevtoolsProtocolFixtures.ids.fxNode);
    expect(model.refSubjects[0]?.refSubjectId).toBe(DevtoolsProtocolFixtures.ids.refSubject);
  });

  it("exports the host-neutral fixture from the Storybook public surface", () => {
    expect(makePublicStorybookDevtoolsFixture().peer).toBe("storybook-fixture");
  });
});
