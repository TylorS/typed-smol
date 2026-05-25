import { makeDomBindingId } from "@typed/devtools-protocol";
import type { DomRegistry } from "@typed/devtools-runtime";

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

  globalObject.__TYPED_DEVTOOLS__ = {
    inspectDomBinding: (bindingId: string) =>
      inspectDomBinding(globalObject, options.domRegistry, bindingId),
    resolveSelectedElement: (node: Node) => options.domRegistry?.resolveNode(node),
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
