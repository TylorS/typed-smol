import {
  makeComponentId,
  makeDomBindingId,
  makeFxNodeId,
  makeRefSubjectId,
  makeTemplateHash,
  makeTemplatePartId,
  type ComponentSummary,
} from "@typed/devtools-protocol";
import * as Effect from "effect/Effect";
import { describe, expect, expectTypeOf, it } from "vitest";
import { makeDevtoolsBridge } from "./Bridge.js";
import { makeDomRegistry, type DomRegistry } from "./DomRegistry.js";

describe("DOM DevTools registry", () => {
  it("resolves template comment anchors through protocol DOM binding ids", async () => {
    const registry = makeDomRegistry();
    const component = componentSummary("outer-template", "Outer");
    const root = element();
    const main = element(root);
    const anchor = node(main);
    const bindingId = makeDomBindingId("outer-template#node:0.1:0");
    const templatePartId = makeTemplatePartId("outer-template#0.1#0");

    registry.registerComponent(component);
    registry.observer.onTemplateBinding?.({
      bindingId: "outer-template#node:0.1:0",
      kind: "node",
      node: anchor,
      path: [0, 1],
      templateHash: "outer-template",
      valueIndex: 0,
    });

    expect(registry.resolveNode(anchor)).toEqual({
      _tag: "Resolved",
      bindingId,
      component,
      templatePartId,
    });
    await expect(
      Effect.runPromise(registry.resolveDomBinding({ bindingId, includeRelated: true })),
    ).resolves.toEqual({
      _tag: "Resolved",
      bindingId,
      component,
      templatePartId,
    });
    expect(registry.resolveBindingNode(bindingId)).toBe(anchor);
  });

  it("resolves fragment roots and nearest nested ownership for selected nodes", () => {
    const registry = makeDomRegistry();
    const outer = componentSummary("outer-template", "Outer");
    const inner = componentSummary("inner-template", "Inner");
    const host = element();
    const outerRoot = element(host);
    const outerSibling = element(host);
    const outerChild = element(outerRoot);
    const innerRoot = element(outerChild);
    const innerChild = node(innerRoot);

    registry.registerComponent(outer);
    registry.registerComponent(inner);
    registry.observer.onTemplateMounted?.({
      nodes: [outerRoot, outerSibling],
      root: host,
      templateHash: "outer-template",
    });

    expect(registry.resolveNode(outerChild)).toEqual({
      _tag: "Resolved",
      bindingId: makeDomBindingId("outer-template#root:0"),
      component: outer,
    });
    expect(registry.resolveNode(outerSibling)).toEqual({
      _tag: "Resolved",
      bindingId: makeDomBindingId("outer-template#root:1"),
      component: outer,
    });

    registry.observer.onTemplateMounted?.({
      nodes: [innerRoot],
      root: innerRoot as HTMLElement,
      templateHash: "inner-template",
    });

    expect(registry.resolveNode(innerChild)).toEqual({
      _tag: "Resolved",
      bindingId: makeDomBindingId("inner-template#root:0"),
      component: inner,
    });
  });

  it("returns explicit unbound results for missing nodes and missing binding ids", async () => {
    const registry = makeDomRegistry();
    const missingBindingId = makeDomBindingId("missing-binding");

    expect(registry.resolveNode(node())).toEqual({
      _tag: "Unbound",
      bindingId: makeDomBindingId("unbound-node"),
      reason: "DOM node is not registered",
    });
    await expect(
      Effect.runPromise(registry.resolveDomBinding({ bindingId: missingBindingId })),
    ).resolves.toEqual({
      _tag: "Unbound",
      bindingId: missingBindingId,
      reason: "DOM binding is not registered",
    });
  });

  it("keeps same-template pending bindings owned by their mounted root", async () => {
    const registry = makeDomRegistry();
    const component = componentSummary("shared-template", "Shared");
    const hostA = element();
    const hostB = element();
    const rootA = element(hostA);
    const rootB = element(hostB);
    const anchorA = node(rootA);
    const anchorB = node(rootB);
    const bindingA = makeDomBindingId("shared-template#node:0:0");
    const bindingB = makeDomBindingId("shared-template#node:0:1");

    registry.registerComponent(component);
    registry.observer.onTemplateBinding?.({
      bindingId: "shared-template#node:0:0",
      kind: "node",
      node: anchorA,
      path: [0],
      templateHash: "shared-template",
      valueIndex: 0,
    });
    registry.observer.onTemplateBinding?.({
      bindingId: "shared-template#node:0:1",
      kind: "node",
      node: anchorB,
      path: [0],
      templateHash: "shared-template",
      valueIndex: 1,
    });
    registry.observer.onTemplateMounted?.({
      nodes: [rootA],
      root: hostA,
      templateHash: "shared-template",
    });
    registry.observer.onTemplateMounted?.({
      nodes: [rootB],
      root: hostB,
      templateHash: "shared-template",
    });
    registry.observer.onTemplateUnmounted?.({
      root: hostA,
      templateHash: "shared-template",
    });

    expect(registry.resolveBindingNode(bindingA)).toBeUndefined();
    expect(registry.resolveBindingNode(bindingB)).toBe(anchorB);
    await expect(
      Effect.runPromise(registry.resolveDomBinding({ bindingId: bindingA })),
    ).resolves.toMatchObject({ _tag: "Unbound" });
    await expect(
      Effect.runPromise(registry.resolveDomBinding({ bindingId: bindingB })),
    ).resolves.toMatchObject({
      _tag: "Resolved",
      bindingId: bindingB,
      component,
      templatePartId: makeTemplatePartId("shared-template#0#1"),
    });
  });

  it("installs as the host resolver for the runtime bridge", async () => {
    const registry = makeDomRegistry();
    const component = componentSummary("bridge-template", "BridgeRoot");
    const bindingId = makeDomBindingId("bridge-template#root:0");
    const root = element();
    const view = element(root);
    const bridge = makeDevtoolsBridge({ resolveDomBinding: registry.resolveDomBinding });

    registry.registerComponent(component);
    registry.observer.onTemplateMounted?.({
      nodes: [view],
      root,
      templateHash: "bridge-template",
    });

    await expect(Effect.runPromise(bridge.resolveDomBinding({ bindingId }))).resolves.toEqual({
      _tag: "Resolved",
      bindingId,
      component,
    });
  });

  it("preserves registry type inference", () => {
    expectTypeOf(makeDomRegistry()).toExtend<DomRegistry>();
  });
});

function componentSummary(templateHash: string, displayName: string): ComponentSummary {
  return {
    componentId: makeComponentId(displayName),
    displayName,
    fxNodeIds: [makeFxNodeId(`${displayName}:fx`)],
    refSubjectIds: [makeRefSubjectId(`${displayName}:state`)],
    templateHash: makeTemplateHash(templateHash),
  };
}

function element(parentNode: Node | null = null): HTMLElement {
  return node(parentNode) as HTMLElement;
}

function node(parentNode: Node | null = null): Node {
  return { parentNode } as Node;
}
