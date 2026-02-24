import type { TypeTargetSpec } from "@typed/virtual-modules";

/**
 * Type target specs for router virtual module structural validation.
 * Pass to createTypeInfoApiSession typeTargetSpecs option.
 */
export const ROUTER_TYPE_TARGET_SPECS: readonly TypeTargetSpec[] = [
  { id: "Fx", module: "@typed/fx", exportName: "Fx" },
  { id: "Effect", module: "effect", exportName: "Effect" },
  { id: "Stream", module: "effect", exportName: "Stream" },
  { id: "Route", module: "@typed/router", exportName: "Route" },
  { id: "RefSubject", module: "@typed/fx", exportName: "RefSubject" },
  { id: "Option", module: "effect", exportName: "Option" },
  { id: "Layer", module: "effect/Layer", exportName: "Layer" },
  { id: "ServiceMap", module: "effect/ServiceMap", exportName: "ServiceMap" },
];

/**
 * Type target specs for HttpApi virtual module structural validation.
 * Pass to createTypeInfoApiSession typeTargetSpecs option.
 */
export const HTTPAPI_TYPE_TARGET_SPECS: readonly TypeTargetSpec[] = [
  { id: "HttpApi", module: "effect", exportName: "HttpApi" },
  { id: "HttpApiGroup", module: "effect", exportName: "HttpApiGroup" },
  { id: "HttpApiEndpoint", module: "effect", exportName: "HttpApiEndpoint" },
  { id: "HttpApiBuilder", module: "effect", exportName: "HttpApiBuilder" },
  { id: "Schema", module: "effect/Schema", exportName: "Schema" },
  { id: "Effect", module: "effect", exportName: "Effect" },
  { id: "Route", module: "@typed/router", exportName: "Route" },
];
