import type { CpsContinuation } from "../cps/planCpsCompilation.js";
import type { ComponentHmrResult, ComponentHmrServiceDescriptor } from "./analyzeComponentHmr.js";
import type { DependencyHmrRejected, DependencyHmrResult } from "./dependencies.js";

export interface ViteHmrBoundaryInput {
  readonly route: ComponentHmrResult;
  readonly continuations?: readonly CpsContinuation[];
  readonly dependencies?: DependencyHmrResult;
  readonly version?: string;
}

export interface ViteHmrBoundaryPlan {
  readonly moduleId: string;
  readonly eligible: boolean;
  readonly services: readonly ViteHmrServicePlan[];
  readonly rejected: readonly DependencyHmrRejected[];
}

export interface ViteHmrServicePlan {
  readonly moduleId: string;
  readonly serviceId: string;
  readonly shapeFingerprint: string;
  readonly continuationFingerprints: readonly string[];
  readonly dependencyFingerprints: readonly string[];
  readonly compatibilityFingerprint: string;
  readonly version: string;
}

export function planViteHmrBoundary(input: ViteHmrBoundaryInput): ViteHmrBoundaryPlan {
  const version = input.version ?? "1";
  const dependencyFingerprints = dependencyFingerprintSet(input.dependencies);
  const continuationFingerprints = routeContinuationFingerprints(input.continuations);
  const routeServices = input.route.services.map((service) =>
    routeService(input.route.moduleId, service, {
      continuationFingerprints,
      dependencyFingerprints,
      version,
    }),
  );
  const dependencyServices = dependencyServicePlans(input.dependencies, version);
  const services = input.route.eligible
    ? [...routeServices, ...dependencyServices]
    : dependencyServices;

  return {
    moduleId: input.route.moduleId,
    eligible: services.length > 0,
    rejected: input.dependencies?.rejected ?? [],
    services,
  };
}

export function emitViteHmrRuntime(plan: ViteHmrBoundaryPlan): string {
  if (!plan.eligible) return "";

  return [
    'import { getOrCreateHmrState, pruneHmrState, typedHmrRegistryKey, type HmrRegistryEntry } from "@typed/app/runtime";',
    "type __TypedHot = {",
    "  readonly data: Record<string, unknown>;",
    "  readonly accept: () => void;",
    "  readonly dispose: (callback: (data: Record<string, unknown>) => void) => void;",
    "};",
    `const __typedHmrDescriptors = ${JSON.stringify(plan.services)};`,
    "const __typedHmrModules = new Set(__typedHmrDescriptors.map((item) => item.moduleId));",
    "const __typedHot = (import.meta as ImportMeta & { readonly hot?: __TypedHot }).hot;",
    "function __typedHasDescriptor(entry: HmrRegistryEntry): boolean {",
    "  return __typedHmrDescriptors.some((item) => item.moduleId === entry.moduleId && item.serviceId === entry.serviceId);",
    "}",
    "export function __typedGetHmrState<A>(serviceId: string, create: () => A): A {",
    "  const descriptor = __typedHmrDescriptors.find((item) => item.serviceId === serviceId);",
    "  return descriptor ? getOrCreateHmrState(descriptor, create, { hotData: __typedHot?.data }) : create();",
    "}",
    "if (__typedHot) {",
    "  __typedHot.accept();",
    "  __typedHot.dispose((data) => {",
    "    data[typedHmrRegistryKey] = (globalThis as Record<string, unknown>)[typedHmrRegistryKey];",
    "    pruneHmrState((entry) => __typedHmrModules.has(entry.moduleId) && !__typedHasDescriptor(entry));",
    "  });",
    "}",
  ].join("\n");
}

function dependencyFingerprintSet(
  dependencies: DependencyHmrResult | undefined,
): readonly string[] {
  return [
    ...(dependencies?.participants ?? []).map((participant) => participant.fingerprint),
  ].sort();
}

function routeContinuationFingerprints(
  continuations: readonly CpsContinuation[] | undefined,
): readonly string[] {
  return (continuations ?? [])
    .filter((continuation) => continuation.kind === "route-closure")
    .map((continuation) => continuation.compatibilityFingerprint)
    .sort();
}

function routeService(
  moduleId: string,
  service: ComponentHmrServiceDescriptor,
  options: {
    readonly continuationFingerprints: readonly string[];
    readonly dependencyFingerprints: readonly string[];
    readonly version: string;
  },
): ViteHmrServicePlan {
  return servicePlan({
    continuationFingerprints: options.continuationFingerprints,
    dependencyFingerprints: options.dependencyFingerprints,
    moduleId,
    serviceId: service.serviceId,
    shapeFingerprint: routeShapeFingerprint(service),
    version: options.version,
  });
}

function dependencyServicePlans(
  dependencies: DependencyHmrResult | undefined,
  version: string,
): readonly ViteHmrServicePlan[] {
  return (dependencies?.participants ?? []).flatMap((participant) =>
    participant.serviceIds.map((serviceId) =>
      servicePlan({
        continuationFingerprints: [],
        dependencyFingerprints: [],
        moduleId: participant.moduleId,
        serviceId,
        shapeFingerprint: participant.fingerprint,
        version,
      }),
    ),
  );
}

function routeShapeFingerprint(service: ComponentHmrServiceDescriptor): string {
  if (service.kind === "inline-refsubject") {
    return `${service.kind}:${service.localName}:${service.initializerSource}`;
  }
  return `${service.kind}:${service.localName}:${service.serviceId}`;
}

function servicePlan(
  descriptor: Omit<ViteHmrServicePlan, "compatibilityFingerprint">,
): ViteHmrServicePlan {
  return {
    ...descriptor,
    compatibilityFingerprint: JSON.stringify({
      continuationFingerprints: [...descriptor.continuationFingerprints].sort(),
      dependencyFingerprints: [...descriptor.dependencyFingerprints].sort(),
      shapeFingerprint: descriptor.shapeFingerprint,
      version: descriptor.version,
    }),
  };
}
