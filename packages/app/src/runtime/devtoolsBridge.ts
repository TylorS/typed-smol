import {
  DEVTOOLS_PROTOCOL_VERSION,
  makeDomBindingId,
  type DevtoolsCapability,
  type DevtoolsHandshakeRequest,
  type DevtoolsHandshakeResponse,
  type DomBindingRequest,
  type SourceAnalyzerRequest,
  type SourceAnalyzerResponse,
} from "@typed/devtools-protocol";
import type { DomRegistry } from "@typed/devtools-runtime";
import * as Effect from "effect/Effect";

export interface TypedDevtoolsBridgeOptions {
  readonly domRegistry?: DomRegistry;
  readonly enabled: boolean;
  readonly globalObject?: Record<PropertyKey, unknown>;
}

export function installTypedDevtoolsBridge(options: TypedDevtoolsBridgeOptions): void {
  const globalObject = options.globalObject ?? (globalThis as Record<PropertyKey, unknown>);
  if (!options.enabled || !options.domRegistry) {
    delete globalObject.__TYPED_DEVTOOLS__;
    return;
  }
  const domRegistry = options.domRegistry;

  globalObject.__TYPED_DEVTOOLS__ = {
    analyzeSource: (request: SourceAnalyzerRequest) => analyzeSource(request),
    handshake: (request: DevtoolsHandshakeRequest) => handshake(request),
    inspectDomBinding: (bindingId: string) =>
      inspectDomBinding(globalObject, domRegistry, bindingId),
    resolveDomBinding: (request: DomBindingRequest) =>
      Effect.runSync(domRegistry.resolveDomBinding(request)),
    resolveSelectedElement: (node: Node) => domRegistry.resolveNode(node),
  };
}

const supportedCapabilities = [
  "components",
  "dom",
] as const satisfies readonly DevtoolsCapability[];

function handshake(request: DevtoolsHandshakeRequest): DevtoolsHandshakeResponse {
  return {
    acceptedCapabilities: request.capabilities.filter((capability) =>
      supportedCapabilities.includes(capability as (typeof supportedCapabilities)[number]),
    ),
    peer: "inspected-runtime",
    sessionId: request.sessionId,
    unsupportedCapabilities: request.capabilities.filter(
      (capability) =>
        !supportedCapabilities.includes(capability as (typeof supportedCapabilities)[number]),
    ),
    version: DEVTOOLS_PROTOCOL_VERSION,
  };
}

function analyzeSource(request: SourceAnalyzerRequest): SourceAnalyzerResponse {
  return {
    _tag: "Unavailable",
    reason: "Source analyzer bridge is not available",
    requestedAt: request.requestedAt,
  };
}

function inspectDomBinding(
  globalObject: Record<PropertyKey, unknown>,
  domRegistry: DomRegistry,
  bindingId: string,
):
  | { readonly _tag: "Inspected"; readonly bindingId: string }
  | {
      readonly _tag: "Unavailable";
      readonly bindingId: string;
      readonly reason: string;
    } {
  const node = domRegistry.resolveBindingNode(makeDomBindingId(bindingId));
  if (!node) return { _tag: "Unavailable", bindingId, reason: "DOM binding node is not mounted" };

  const inspect = globalObject.inspect;
  if (typeof inspect !== "function") {
    return { _tag: "Unavailable", bindingId, reason: "Chrome inspect API is not available" };
  }

  inspect(node);
  return { _tag: "Inspected", bindingId };
}
