import type { DomRegistry } from "@typed/devtools-runtime";
import type { DomTemplateRuntime } from "@typed/template/compiler-runtime/renderable";
import {
  createActionResumeRuntime,
  createRouteResumeRuntime,
  getDefaultActionResumeRegistry,
  getDefaultRouteResumeRegistry,
  type ActionResumeRegistry,
  type RouteResumeRegistry,
} from "../resumability.js";
import { installTypedDevtoolsBridge } from "./devtoolsBridge.js";

export interface AppDomTemplateRuntimeOptions {
  readonly actionRegistry?: ActionResumeRegistry;
  readonly routeRegistry?: RouteResumeRegistry;
  readonly devtools?:
    | false
    | { readonly enabled: false }
    | {
        readonly domRegistry: DomRegistry;
        readonly enabled: true;
        readonly globalObject?: Record<PropertyKey, unknown>;
      };
}

export function createAppDomTemplateRuntime(
  options: AppDomTemplateRuntimeOptions = {},
): Omit<DomTemplateRuntime, "scope"> {
  const route = createRouteResumeRuntime(options.routeRegistry ?? getDefaultRouteResumeRegistry());
  const action = createActionResumeRuntime(
    options.actionRegistry ?? getDefaultActionResumeRegistry(),
  );
  const devtools =
    options.devtools && options.devtools.enabled ? options.devtools.domRegistry.observer : undefined;
  if (options.devtools) {
    installTypedDevtoolsBridge({
      domRegistry: options.devtools.enabled ? options.devtools.domRegistry : undefined,
      enabled: options.devtools.enabled,
      globalObject: options.devtools.enabled ? options.devtools.globalObject : undefined,
    });
  }

  return {
    resumeRoute: route.resumeRoute,
    resumeAction: action.resumeAction,
    ...(devtools ? { devtools } : {}),
  };
}
