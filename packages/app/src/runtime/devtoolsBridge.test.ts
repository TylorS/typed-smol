import {
  DEVTOOLS_PROTOCOL_VERSION,
  DevtoolsProtocolFixtures,
  makeDomBindingId,
} from "@typed/devtools-protocol";
import { makeDomRegistry } from "@typed/devtools-runtime";
import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";
import { installTypedDevtoolsBridge } from "./devtoolsBridge.js";

describe("installTypedDevtoolsBridge", () => {
  it("installs selected element resolution when enabled", () => {
    const document = new Window().document;
    const element = document.createElement("button");
    const root = document.createElement("main");
    const registry = makeDomRegistry();
    const globalObject: Record<PropertyKey, unknown> = {};

    root.append(element);
    registry.registerComponent(DevtoolsProtocolFixtures.componentSummary);
    registry.observer.onTemplateMounted?.({
      nodes: [element],
      root,
      templateHash: DevtoolsProtocolFixtures.ids.templateHash,
    });

    installTypedDevtoolsBridge({ enabled: true, domRegistry: registry, globalObject });

    const api = globalObject.__TYPED_DEVTOOLS__ as {
      readonly resolveSelectedElement: (node: Node) => unknown;
    };
    expect(api.resolveSelectedElement(element)).toMatchObject({ _tag: "Resolved" });
  });

  it("installs DOM binding inspection when enabled", () => {
    const document = new Window().document;
    const element = document.createElement("button");
    const root = document.createElement("main");
    const registry = makeDomRegistry();
    const inspected: Node[] = [];
    const globalObject: Record<PropertyKey, unknown> = {
      inspect: (node: Node) => inspected.push(node),
    };

    root.append(element);
    registry.registerComponent(DevtoolsProtocolFixtures.componentSummary);
    registry.observer.onTemplateMounted?.({
      nodes: [element],
      root,
      templateHash: DevtoolsProtocolFixtures.ids.templateHash,
    });

    installTypedDevtoolsBridge({ enabled: true, domRegistry: registry, globalObject });

    const api = globalObject.__TYPED_DEVTOOLS__ as {
      readonly inspectDomBinding: (bindingId: string) => unknown;
    };
    expect(api.inspectDomBinding(`${DevtoolsProtocolFixtures.ids.templateHash}#root:0`)).toEqual({
      _tag: "Inspected",
      bindingId: `${DevtoolsProtocolFixtures.ids.templateHash}#root:0`,
    });
    expect(inspected).toEqual([element]);
  });

  it("installs runtime RPC methods for the inspected page bridge", () => {
    const document = new Window().document;
    const element = document.createElement("button");
    const root = document.createElement("main");
    const registry = makeDomRegistry();
    const globalObject: Record<PropertyKey, unknown> = {};

    root.append(element);
    registry.registerComponent(DevtoolsProtocolFixtures.componentSummary);
    registry.observer.onTemplateMounted?.({
      nodes: [element],
      root,
      templateHash: DevtoolsProtocolFixtures.ids.templateHash,
    });

    installTypedDevtoolsBridge({ enabled: true, domRegistry: registry, globalObject });

    const api = globalObject.__TYPED_DEVTOOLS__ as {
      readonly analyzeSource: (request: unknown) => unknown;
      readonly handshake: (request: unknown) => unknown;
      readonly resolveDomBinding: (request: unknown) => unknown;
    };
    expect(api.handshake(DevtoolsProtocolFixtures.handshakeRequest)).toEqual({
      acceptedCapabilities: ["components", "dom"],
      peer: "inspected-runtime",
      sessionId: DevtoolsProtocolFixtures.ids.session,
      unsupportedCapabilities: ["fx", "hmr", "refsubjects", "source-analyzer"],
      version: DEVTOOLS_PROTOCOL_VERSION,
    });
    expect(
      api.resolveDomBinding({
        bindingId: makeDomBindingId(`${DevtoolsProtocolFixtures.ids.templateHash}#root:0`),
      }),
    ).toMatchObject({ _tag: "Resolved" });
    expect(api.analyzeSource(DevtoolsProtocolFixtures.sourceAnalyzerRequest)).toEqual({
      _tag: "Unavailable",
      reason: "Source analyzer bridge is not available",
      requestedAt: DevtoolsProtocolFixtures.sourceAnalyzerRequest.requestedAt,
    });
  });

  it("does not install the bridge when disabled", () => {
    const globalObject: Record<PropertyKey, unknown> = {};

    installTypedDevtoolsBridge({ enabled: false, globalObject });

    expect(globalObject.__TYPED_DEVTOOLS__).toBeUndefined();
  });
});
