import {
  DevtoolsHandshakeResponseSchema,
  DomBindingResolutionSchema,
  RuntimeEventStreamItemSchema,
  SourceAnalyzerResponseSchema,
  decodeDevtoolsPayload,
  makeDevtoolsSessionId,
  makeDomBindingId,
  type DevtoolsCapability,
  type DevtoolsHandshakeRequest,
  type DevtoolsHandshakeResponse,
  type DevtoolsSessionId,
  type DomBindingId,
  type DomBindingRequest,
  type DomBindingResolution,
  type RuntimeEventStreamItem,
  type RuntimeEventSubscriptionRequest,
  type SourceAnalyzerRequest,
  type SourceAnalyzerResponse,
  type TypedDevtoolsRpcTag,
} from "@typed/devtools-protocol";

export const TYPED_DEVTOOLS_SELECTED_NODE_EXPRESSION = `
(() => {
  const api = globalThis.__TYPED_DEVTOOLS__;
  if (!api || typeof api.resolveSelectedElement !== "function") {
    return {
      _tag: "Unbound",
      bindingId: "dom:selected-node",
      reason: "Typed DevTools DOM bridge is not available"
    };
  }
  return api.resolveSelectedElement($0);
})()
`.trim();

export const TYPED_DEVTOOLS_INSPECT_DOM_BINDING_EXPRESSION = (bindingId: DomBindingId): string =>
  `
(() => {
  const api = globalThis.__TYPED_DEVTOOLS__;
  if (!api || typeof api.inspectDomBinding !== "function") {
    return {
      _tag: "Unavailable",
      reason: "Typed DevTools DOM bridge is not available"
    };
  }
  return api.inspectDomBinding(${JSON.stringify(bindingId)});
})()
`.trim();

export const TYPED_DEVTOOLS_RPC_EXPRESSION = (tag: TypedDevtoolsRpcTag, payload: unknown): string =>
  `
(() => {
  const api = globalThis.__TYPED_DEVTOOLS__;
  const payload = ${JSON.stringify(payload)};
  const method = ${JSON.stringify(methodForTag(tag))};
  if (!api || typeof api[method] !== "function") {
    return ${JSON.stringify(unavailableFor(tag, payload))};
  }
  return api[method](payload);
})()
`.trim();

export interface ChromeInspectedWindow {
  readonly eval: (
    expression: string,
    callback: (result: unknown, exceptionInfo?: ChromeEvalExceptionInfo) => void,
  ) => void;
}

export interface ChromeEvalExceptionInfo {
  readonly code?: string;
  readonly description?: string;
  readonly isError?: boolean;
  readonly value?: string;
}

export interface InspectedWindowDomResolver {
  readonly resolveSelectedElement: () => Promise<DomBindingResolution>;
}

export interface InspectedWindowRpcClient {
  readonly request: {
    (tag: "AnalyzeSource", payload: SourceAnalyzerRequest): Promise<SourceAnalyzerResponse>;
    (tag: "Handshake", payload: DevtoolsHandshakeRequest): Promise<DevtoolsHandshakeResponse>;
    (tag: "ResolveDomBinding", payload: DomBindingRequest): Promise<DomBindingResolution>;
    (
      tag: "SubscribeRuntimeEvents",
      payload: RuntimeEventSubscriptionRequest,
    ): Promise<RuntimeEventStreamItem>;
  };
}

export function makeInspectedWindowDomResolver(
  inspectedWindow: ChromeInspectedWindow,
): InspectedWindowDomResolver {
  return {
    resolveSelectedElement: () => evaluateSelectedElement(inspectedWindow),
  };
}

export function inspectDomBinding(
  inspectedWindow: ChromeInspectedWindow,
  bindingId: DomBindingId,
): Promise<{ readonly ok: boolean; readonly reason?: string }> {
  return new Promise((resolve) => {
    try {
      inspectedWindow.eval(
        TYPED_DEVTOOLS_INSPECT_DOM_BINDING_EXPRESSION(bindingId),
        (result, exceptionInfo) => {
          if (exceptionInfo) {
            resolve({ ok: false, reason: exceptionMessage(exceptionInfo) });
            return;
          }
          resolve(inspectSucceeded(result) ? { ok: true } : { ok: false });
        },
      );
    } catch (error) {
      resolve({ ok: false, reason: errorMessage(error) });
    }
  });
}

export function makeInspectedWindowRpcClient(
  inspectedWindow: ChromeInspectedWindow,
): InspectedWindowRpcClient {
  return {
    request: (tag, payload) => evaluateRpc(inspectedWindow, tag, payload) as Promise<never>,
  };
}

function evaluateSelectedElement(
  inspectedWindow: ChromeInspectedWindow,
): Promise<DomBindingResolution> {
  return new Promise((resolve) => {
    try {
      inspectedWindow.eval(TYPED_DEVTOOLS_SELECTED_NODE_EXPRESSION, (result, exceptionInfo) => {
        if (exceptionInfo) {
          resolve(
            unbound(`Inspected window evaluation failed: ${exceptionMessage(exceptionInfo)}`),
          );
          return;
        }

        try {
          resolve(decodeDevtoolsPayload(DomBindingResolutionSchema, result));
        } catch {
          resolve(unbound("Inspected window returned an invalid DOM binding resolution"));
        }
      });
    } catch (error) {
      resolve(unbound(`Inspected window evaluation failed: ${errorMessage(error)}`));
    }
  });
}

function evaluateRpc(
  inspectedWindow: ChromeInspectedWindow,
  tag: TypedDevtoolsRpcTag,
  payload: unknown,
): Promise<unknown> {
  return new Promise((resolve) => {
    try {
      inspectedWindow.eval(TYPED_DEVTOOLS_RPC_EXPRESSION(tag, payload), (result, exceptionInfo) => {
        const next = exceptionInfo
          ? unavailableFor(tag, payload, exceptionMessage(exceptionInfo))
          : result;
        try {
          resolve(decodeRpcSuccess(tag, next));
        } catch {
          resolve(
            unavailableFor(
              tag,
              payload,
              "Inspected window returned an invalid Typed DevTools RPC response",
            ),
          );
        }
      });
    } catch (error) {
      resolve(unavailableFor(tag, payload, errorMessage(error)));
    }
  });
}

function decodeRpcSuccess(tag: TypedDevtoolsRpcTag, result: unknown): unknown {
  switch (tag) {
    case "AnalyzeSource":
      return decodeDevtoolsPayload(SourceAnalyzerResponseSchema, result);
    case "Handshake":
      return decodeDevtoolsPayload(DevtoolsHandshakeResponseSchema, result);
    case "ResolveDomBinding":
      return decodeDevtoolsPayload(DomBindingResolutionSchema, result);
    case "SubscribeRuntimeEvents":
      return decodeDevtoolsPayload(RuntimeEventStreamItemSchema, result);
  }
}

function methodForTag(tag: TypedDevtoolsRpcTag): string {
  switch (tag) {
    case "AnalyzeSource":
      return "analyzeSource";
    case "Handshake":
      return "handshake";
    case "ResolveDomBinding":
      return "resolveDomBinding";
    case "SubscribeRuntimeEvents":
      return "subscribeRuntimeEvents";
  }
}

function unavailableFor(
  tag: TypedDevtoolsRpcTag,
  payload: unknown,
  reason = "Typed DevTools page bridge is not available",
): unknown {
  switch (tag) {
    case "AnalyzeSource":
      return {
        _tag: "Unavailable",
        reason,
        requestedAt: requestedAtOf(payload),
      };
    case "Handshake":
      return {
        acceptedCapabilities: [],
        peer: "inspected-runtime",
        sessionId: sessionIdOf(payload),
        unsupportedCapabilities: capabilitiesOf(payload),
        version: versionOf(payload),
      };
    case "ResolveDomBinding":
      return {
        _tag: "Unbound",
        bindingId: bindingIdOf(payload),
        reason,
      };
    case "SubscribeRuntimeEvents":
      return {
        _tag: "RuntimeReplayState",
        state: {
          _tag: "Disabled",
          droppedEvents: 0,
          nextSequence: 0,
          reconnectable: false,
          retainedEvents: 0,
        },
      };
  }
}

function exceptionMessage(exceptionInfo: ChromeEvalExceptionInfo): string {
  return exceptionInfo.description ?? exceptionInfo.value ?? exceptionInfo.code ?? "unknown error";
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) return error.message;
  if (typeof error === "string" && error.length > 0) return error;
  return "unknown error";
}

function inspectSucceeded(result: unknown): boolean {
  return (
    typeof result === "object" && result !== null && "_tag" in result && result._tag === "Inspected"
  );
}

function unbound(reason: string): DomBindingResolution {
  return {
    _tag: "Unbound",
    bindingId: makeDomBindingId("selected-node"),
    reason,
  };
}

function bindingIdOf(payload: unknown): DomBindingId {
  return hasProperty(payload, "bindingId") && typeof payload.bindingId === "string"
    ? makeDomBindingId(payload.bindingId)
    : makeDomBindingId("selected-node");
}

function capabilitiesOf(payload: unknown): readonly DevtoolsCapability[] {
  return hasProperty(payload, "capabilities") && Array.isArray(payload.capabilities)
    ? payload.capabilities.filter(isDevtoolsCapability)
    : [];
}

function requestedAtOf(payload: unknown): number {
  return hasProperty(payload, "requestedAt") && typeof payload.requestedAt === "number"
    ? payload.requestedAt
    : 0;
}

function sessionIdOf(payload: unknown): DevtoolsSessionId {
  return hasProperty(payload, "sessionId") && typeof payload.sessionId === "string"
    ? makeDevtoolsSessionId(payload.sessionId)
    : makeDevtoolsSessionId("unknown");
}

function versionOf(payload: unknown): string {
  return hasProperty(payload, "version") && typeof payload.version === "string"
    ? payload.version
    : "0.1.0";
}

function hasProperty<Key extends string>(value: unknown, key: Key): value is Record<Key, unknown> {
  return typeof value === "object" && value !== null && key in value;
}

function isDevtoolsCapability(value: unknown): value is DevtoolsCapability {
  return (
    value === "components" ||
    value === "dom" ||
    value === "fx" ||
    value === "hmr" ||
    value === "navigation" ||
    value === "otel" ||
    value === "refsubjects" ||
    value === "source-analyzer"
  );
}
