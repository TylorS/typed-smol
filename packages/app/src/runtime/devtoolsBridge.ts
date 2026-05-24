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
    resolveSelectedElement: (node: Node) => options.domRegistry?.resolveNode(node),
  };
}
