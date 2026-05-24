import { DevtoolsProtocolFixtures } from "@typed/devtools-protocol";
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

  it("does not install the bridge when disabled", () => {
    const globalObject: Record<PropertyKey, unknown> = {};

    installTypedDevtoolsBridge({ enabled: false, globalObject });

    expect(globalObject.__TYPED_DEVTOOLS__).toBeUndefined();
  });
});
