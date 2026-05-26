import {
  DEVTOOLS_PROTOCOL_VERSION,
  DevtoolsProtocolFixtures,
  makeDomBindingId,
} from "@typed/devtools-protocol";
import { makeDevtoolsRuntime, makeDomRegistry } from "@typed/devtools-runtime";
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
      acceptedCapabilities: ["dom"],
      peer: "inspected-runtime",
      sessionId: DevtoolsProtocolFixtures.ids.session,
      unsupportedCapabilities: ["components", "fx", "hmr", "refsubjects", "source-analyzer"],
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

  it("advertises and replays live runtime events only when a runtime is wired", () => {
    const registry = makeDomRegistry();
    const runtime = makeDevtoolsRuntime({
      enabled: true,
      sessionId: DevtoolsProtocolFixtures.ids.session,
    });
    const globalObject: Record<PropertyKey, unknown> = {};
    runtime.emit(DevtoolsProtocolFixtures.runtimeEvents[0]);

    installTypedDevtoolsBridge({
      enabled: true,
      domRegistry: registry,
      globalObject,
      runtime,
    });

    const api = globalObject.__TYPED_DEVTOOLS__ as {
      readonly handshake: (request: unknown) => unknown;
      readonly subscribeRuntimeEvents: (request: unknown) => unknown;
    };
    expect(api.handshake(DevtoolsProtocolFixtures.handshakeRequest)).toMatchObject({
      acceptedCapabilities: ["components", "dom"],
      unsupportedCapabilities: ["fx", "hmr", "refsubjects", "source-analyzer"],
    });
    expect(api.subscribeRuntimeEvents(DevtoolsProtocolFixtures.runtimeSubscriptionRequest)).toEqual([
      {
        _tag: "RuntimeReplayState",
        state: {
          _tag: "Ready",
          droppedEvents: 0,
          nextSequence: 2,
          oldestRetainedSequence: 1,
          reconnectable: true,
          retainedEvents: 1,
          sessionId: DevtoolsProtocolFixtures.ids.session,
        },
      },
      DevtoolsProtocolFixtures.runtimeEvents[0],
    ]);
  });

  it("does not install the bridge when disabled", () => {
    const globalObject: Record<PropertyKey, unknown> = {};

    installTypedDevtoolsBridge({ enabled: false, globalObject });

    expect(globalObject.__TYPED_DEVTOOLS__).toBeUndefined();
  });
});
