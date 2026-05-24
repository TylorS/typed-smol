import {
  DomBindingResolutionSchema,
  decodeDevtoolsPayload,
  makeDomBindingId,
  type DomBindingResolution,
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

export function makeInspectedWindowDomResolver(
  inspectedWindow: ChromeInspectedWindow,
): InspectedWindowDomResolver {
  return {
    resolveSelectedElement: () => evaluateSelectedElement(inspectedWindow),
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

function exceptionMessage(exceptionInfo: ChromeEvalExceptionInfo): string {
  return exceptionInfo.description ?? exceptionInfo.value ?? exceptionInfo.code ?? "unknown error";
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) return error.message;
  if (typeof error === "string" && error.length > 0) return error;
  return "unknown error";
}

function unbound(reason: string): DomBindingResolution {
  return {
    _tag: "Unbound",
    bindingId: makeDomBindingId("selected-node"),
    reason,
  };
}
