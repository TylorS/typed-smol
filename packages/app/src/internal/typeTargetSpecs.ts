import type { TypeTargetSpec } from "@typed/virtual-modules";

/**
 * Type target specs for router virtual module structural validation.
 * Pass to createTypeInfoApiSession typeTargetSpecs option.
 *
 * IMPORTANT: Each spec's `module` must exactly match the import string in user source.
 * Specs are canonical-only (no fallbacks or alternate import paths).
 */
export const ROUTER_TYPE_TARGET_SPECS: readonly TypeTargetSpec[] = [
  { id: "Fx", module: "@typed/fx/Fx", exportName: "Fx" },
  { id: "Effect", module: "effect/Effect", exportName: "Effect" },
  { id: "Stream", module: "effect/Stream", exportName: "Stream" },
  { id: "RefSubject", module: "@typed/fx/RefSubject", exportName: "RefSubject" },
  { id: "Cause", module: "effect/Cause", exportName: "Cause" },
  { id: "Option", module: "effect/Option", exportName: "Option" },
  { id: "Layer", module: "effect/Layer", exportName: "Layer" },
  { id: "ServiceMap", module: "effect/ServiceMap", exportName: "ServiceMap" },
  { id: "Route", module: "@typed/router", exportName: "Route" },
];

/**
 * Type target specs for HttpApi virtual module structural validation.
 * Pass to createTypeInfoApiSession typeTargetSpecs option.
 */
export const HTTPAPI_TYPE_TARGET_SPECS: readonly TypeTargetSpec[] = [
  { id: "HttpApi", module: "effect/unstable/httpapi/HttpApi", exportName: "HttpApi" },
  {
    id: "HttpApiGroup",
    module: "effect/unstable/httpapi/HttpApiGroup",
    exportName: "HttpApiGroup",
  },
  {
    id: "HttpApiEndpoint",
    module: "effect/unstable/httpapi/HttpApiEndpoint",
    exportName: "HttpApiEndpoint",
  },
  {
    id: "HttpApiBuilder",
    module: "effect/unstable/httpapi/HttpApiBuilder",
    exportName: "HttpApiBuilder",
  },
  { id: "Schema", module: "effect/Schema", exportName: "Top" },
  { id: "Effect", module: "effect/Effect", exportName: "Effect" },
  { id: "Route", module: "@typed/router", exportName: "Route" },
  {
    id: "HttpServerResponse",
    module: "effect/unstable/http/HttpServerResponse",
    exportName: "HttpServerResponse",
  },
];
