import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Schema from "effect/Schema";
import type * as EventHandler from "@typed/template/EventHandler";
import { Serializable } from "./serialization/Serializable.js";

const RESUME_ID_KEY = "typed-route-resume-id";
const RESUME_FINGERPRINT_KEY = "typed-route-resume-fingerprint";
const RESUME_VALUE_KEY_PREFIX = "typed-route-resume-value";
const DEFAULT_ROUTE_RESUME_REGISTRY_KEY = "__typed_route_resume_registry__";
const DEFAULT_ACTION_RESUME_REGISTRY_KEY = "__typed_action_resume_registry__";

export interface RouteServiceDescriptor {
  readonly id: string;
  readonly name: string;
  readonly kind: RouteServiceKind;
  readonly typeText: string;
  readonly descriptor?: Serializable.Descriptor;
}

export type RouteServiceKind =
  | "parameter"
  | "effect-service"
  | "context-service"
  | "refsubject-service"
  | "inline-refsubject-service"
  | "serializable-value"
  | "template-value";

export interface RouteContinuationDescriptor extends Serializable.ContinuationDescriptor {
  readonly moduleId: string;
  readonly symbolId: string;
  readonly services: readonly RouteServiceDescriptor[];
  readonly compatibilityFingerprint: string;
}

export interface RouteResumeDataAttrKeys {
  readonly id: typeof RESUME_ID_KEY;
  readonly fingerprint: typeof RESUME_FINGERPRINT_KEY;
  readonly values: readonly string[];
}

export interface RouteResumeServiceProvider {
  readonly tag: unknown;
  readonly valueIndex: number;
}

export interface RouteContinuationRegistration<A = unknown, E extends Error = Error, R = never> {
  readonly descriptor: RouteContinuationDescriptor;
  readonly continuation: Effect.Effect<A, E, R>;
  readonly providers: readonly RouteResumeServiceProvider[];
}

export interface RouteResumeRegistry {
  readonly continuations: Map<string, RouteContinuationRegistration<unknown, Error, unknown>>;
}

export interface RouteResumeRuntime {
  readonly resumeRoute: (
    element: Element,
    payload: Serializable.DataAttrValue,
    trigger: "load" | "idle" | "visible" | "hover" | "interaction" | "focus",
  ) => Effect.Effect<void, Error, never>;
}

export interface ActionResumeRegistration {
  readonly descriptor: EventHandler.EventActionDescriptor;
  readonly handler: EventHandler.EventHandler<Event, Error, never>;
}

export interface ActionResumeRegistry {
  readonly actions: Map<string, ActionResumeRegistration>;
}

export interface ActionResumeRuntime {
  readonly resumeAction: (
    element: Element,
    descriptor: EventHandler.EventActionDescriptor,
    event: Event,
  ) => Effect.Effect<void, Error, never>;
}

export function createRouteResumeRegistry(): RouteResumeRegistry {
  return { continuations: new Map() };
}

export function createActionResumeRegistry(): ActionResumeRegistry {
  return { actions: new Map() };
}

export function getDefaultRouteResumeRegistry(
  globalObject: Record<PropertyKey, unknown> = globalThis as unknown as Record<
    PropertyKey,
    unknown
  >,
): RouteResumeRegistry {
  const existing = globalObject[DEFAULT_ROUTE_RESUME_REGISTRY_KEY];
  if (isRouteResumeRegistry(existing)) return existing;
  const registry = createRouteResumeRegistry();
  globalObject[DEFAULT_ROUTE_RESUME_REGISTRY_KEY] = registry;
  return registry;
}

export function getDefaultActionResumeRegistry(
  globalObject: Record<PropertyKey, unknown> = globalThis as unknown as Record<
    PropertyKey,
    unknown
  >,
): ActionResumeRegistry {
  const existing = globalObject[DEFAULT_ACTION_RESUME_REGISTRY_KEY];
  if (isActionResumeRegistry(existing)) return existing;
  const registry = createActionResumeRegistry();
  globalObject[DEFAULT_ACTION_RESUME_REGISTRY_KEY] = registry;
  return registry;
}

export function createRouteResumeRuntime(registry: RouteResumeRegistry): RouteResumeRuntime {
  return {
    resumeRoute: (_element, payload) => Effect.asVoid(resumeRouteFromPayload(registry, payload)),
  };
}

export function createActionResumeRuntime(registry: ActionResumeRegistry): ActionResumeRuntime {
  return {
    resumeAction: (_element, descriptor, event) =>
      Effect.asVoid(dispatchAction(registry, descriptor, event)),
  };
}

export function registerRouteContinuation<A, E extends Error, R>(
  registry: RouteResumeRegistry,
  registration: RouteContinuationRegistration<A, E, R>,
): RouteContinuationRegistration<A, E, R> {
  registry.continuations.set(registration.descriptor.id, registration);
  return registration;
}

export function registerActionHandler(
  registry: ActionResumeRegistry,
  registration: ActionResumeRegistration,
): ActionResumeRegistration {
  registry.actions.set(actionRegistrationKey(registration.descriptor), registration);
  return registration;
}

export function dispatchAction(
  registry: ActionResumeRegistry,
  descriptor: EventHandler.EventActionDescriptor,
  event: Event,
): Effect.Effect<unknown, Error, never> {
  const registration = registry.actions.get(actionRegistrationKey(descriptor));
  if (!registration)
    return Effect.fail(actionResumeError(`action-not-registered:${descriptor.id}`));
  return registration.handler.handler(event);
}

export function resumeRouteFromPayload(
  registry: RouteResumeRegistry,
  payload: Serializable.DataAttrValue,
): Effect.Effect<unknown, Error, never> {
  return Effect.gen(function* () {
    const object = yield* decodePayloadObject(payload);
    const id = object[RESUME_ID_KEY];
    const registration = registry.continuations.get(id);
    if (!registration) {
      return yield* Effect.fail(routeResumeError(`continuation-not-registered:${id}`));
    }

    const values = yield* decodeRouteResumePayload(registration.descriptor, object);
    return yield* provideRouteResumeServices(
      registration.continuation,
      values,
      registration.providers,
    );
  });
}

export function provideRouteResumeServices<A, E, R>(
  effect: Effect.Effect<A, E, R>,
  values: readonly unknown[],
  providers: readonly RouteResumeServiceProvider[],
): Effect.Effect<A, E, never> {
  return providers.reduce(
    (current, provider) =>
      current.pipe(
        Effect.provideService(provider.tag as never, values[provider.valueIndex] as never),
      ),
    effect as Effect.Effect<A, E, never>,
  );
}

export function encodeRouteResumePayload(
  descriptor: RouteContinuationDescriptor,
  values: readonly unknown[],
): Serializable.DataAttrValue {
  return {
    [RESUME_ID_KEY]: descriptor.id,
    [RESUME_FINGERPRINT_KEY]: descriptor.compatibilityFingerprint,
    ...encodeServiceValues(descriptor.services, values),
  };
}

export function decodeRouteResumePayload(
  descriptor: RouteContinuationDescriptor,
  value: Serializable.DataAttrValue,
): Effect.Effect<readonly unknown[], Error, never> {
  return Effect.gen(function* () {
    const payload = yield* decodePayloadObject(value);
    const id = payload[RESUME_ID_KEY];
    const fingerprint = payload[RESUME_FINGERPRINT_KEY];

    if (id !== descriptor.id) return yield* Effect.fail(routeResumeError("descriptor-id-mismatch"));
    if (fingerprint !== descriptor.compatibilityFingerprint) {
      return yield* Effect.fail(routeResumeError("compatibility-fingerprint-mismatch"));
    }

    return yield* decodeServiceValues(descriptor.services, payload);
  });
}

export function routeResumeDataAttrKeys(
  descriptor: RouteContinuationDescriptor,
): RouteResumeDataAttrKeys {
  return {
    id: RESUME_ID_KEY,
    fingerprint: RESUME_FINGERPRINT_KEY,
    values: descriptor.services.map(routeResumeServiceDataAttrKey),
  };
}

export function routeResumeServiceDataAttrKey(
  service: RouteServiceDescriptor,
  index: number,
): string {
  return `${RESUME_VALUE_KEY_PREFIX}-${index}-${toDataAttrToken(service.name || service.id)}`;
}

function decodePayloadObject(
  value: unknown,
): Effect.Effect<Serializable.DataAttrValue, Error, never> {
  if (!isRecord(value)) return Effect.fail(routeResumeError("payload-not-object"));

  const id = value[RESUME_ID_KEY];
  const fingerprint = value[RESUME_FINGERPRINT_KEY];

  if (typeof id !== "string") return Effect.fail(routeResumeError("descriptor-id-missing"));
  if (typeof fingerprint !== "string") {
    return Effect.fail(routeResumeError("compatibility-fingerprint-missing"));
  }

  return Effect.succeed({
    [RESUME_ID_KEY]: id,
    [RESUME_FINGERPRINT_KEY]: fingerprint,
    ...copyStringFields(value),
  });
}

function encodeServiceValues(
  services: readonly RouteServiceDescriptor[],
  values: readonly unknown[],
): Serializable.DataAttrValue {
  return Object.fromEntries(
    services.map((service, index) => [
      routeResumeServiceDataAttrKey(service, index),
      JSON.stringify(values[index]) ?? "null",
    ]),
  );
}

function decodeServiceValues(
  services: readonly RouteServiceDescriptor[],
  payload: Serializable.DataAttrValue,
): Effect.Effect<readonly unknown[], Error, never> {
  if (countServiceValueKeys(payload) !== services.length) {
    return Effect.fail(routeResumeError("ordered-values-length-mismatch"));
  }
  return Effect.all(services.map((service, index) => parseServiceValue(payload, service, index)));
}

function countServiceValueKeys(payload: Serializable.DataAttrValue): number {
  return Object.keys(payload).filter((key) => key.startsWith(`${RESUME_VALUE_KEY_PREFIX}-`)).length;
}

function parseServiceValue(
  payload: Serializable.DataAttrValue,
  service: RouteServiceDescriptor,
  index: number,
): Effect.Effect<unknown, Error, never> {
  const value = payload[routeResumeServiceDataAttrKey(service, index)];
  if (value === undefined) return Effect.fail(routeResumeError("ordered-values-length-mismatch"));
  return Effect.flatMap(parseJsonValue(value), (parsed) => decodeServiceValue(service, parsed));
}

function parseJsonValue(value: string): Effect.Effect<unknown, Error, never> {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Effect.succeed(parsed);
  } catch {
    return Effect.fail(routeResumeError("ordered-values-invalid-json"));
  }
}

function decodeServiceValue(
  service: RouteServiceDescriptor,
  value: unknown,
): Effect.Effect<unknown, Error, never> {
  const descriptor = service.descriptor;
  if (!descriptor) return Effect.succeed(value);
  if (descriptor._tag === "Schema")
    return decodeSchemaServiceValue(service, descriptor.schema, value);
  return decodeGeneratedServiceValue(service, descriptor.plan, value);
}

function decodeSchemaServiceValue(
  service: RouteServiceDescriptor,
  schema: Serializable.AnySchema,
  value: unknown,
): Effect.Effect<unknown, Error, never> {
  return pipe(
    Schema.decodeUnknownEffect(schema)(value),
    Effect.mapError(() => routeResumeError(`service-value-schema-decode-failed:${service.name}`)),
  ) as Effect.Effect<unknown, Error, never>;
}

function decodeGeneratedServiceValue(
  service: RouteServiceDescriptor,
  plan: Serializable.GeneratedSchemaPlan,
  value: unknown,
): Effect.Effect<unknown, Error, never> {
  if (!plan.root) return Effect.succeed(value);
  return validateGeneratedNode(plan.root, value)
    ? Effect.succeed(value)
    : Effect.fail(routeResumeError(`service-value-schema-decode-failed:${service.name}`));
}

function validateGeneratedNode(node: unknown, value: unknown): boolean {
  if (!isRecord(node)) return true;
  if (node.kind === "primitive") return validateGeneratedPrimitive(String(node.name), value);
  if (node.kind === "literal") return Object.is(node.value, value);
  if (node.kind === "array") {
    return Array.isArray(value) && value.every((item) => validateGeneratedNode(node.element, item));
  }
  if (node.kind === "tuple") {
    const elements = Array.isArray(node.elements) ? node.elements : [];
    return (
      Array.isArray(value) &&
      value.length === elements.length &&
      elements.every((element, index) => validateGeneratedNode(element, value[index]))
    );
  }
  if (node.kind === "union") {
    const elements = Array.isArray(node.elements) ? node.elements : [];
    return elements.some((element) => validateGeneratedNode(element, value));
  }
  if (node.kind === "object") return validateGeneratedObject(node, value);
  return true;
}

function validateGeneratedObject(node: Readonly<Record<string, unknown>>, value: unknown): boolean {
  if (!isRecord(value)) return false;
  const properties = Array.isArray(node.properties) ? node.properties : [];
  return properties.every((property) => validateGeneratedProperty(property, value));
}

function validateGeneratedProperty(
  property: unknown,
  value: Readonly<Record<string, unknown>>,
): boolean {
  if (!isRecord(property) || typeof property.name !== "string") return true;
  const child = value[property.name];
  if (child === undefined) return property.optional === true;
  return validateGeneratedNode(property.node, child);
}

function validateGeneratedPrimitive(name: string, value: unknown): boolean {
  if (name === "null") return value === null;
  if (name === "undefined") return value === undefined;
  return typeof value === name;
}

function copyStringFields(value: Readonly<Record<string, unknown>>): Serializable.DataAttrValue {
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRouteResumeRegistry(value: unknown): value is RouteResumeRegistry {
  return isRecord(value) && value.continuations instanceof Map;
}

function isActionResumeRegistry(value: unknown): value is ActionResumeRegistry {
  return isRecord(value) && value.actions instanceof Map;
}

function actionRegistrationKey(descriptor: EventHandler.EventActionDescriptor): string {
  return `${descriptor.event}:${descriptor.id}`;
}

function toDataAttrToken(value: string): string {
  const token = value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return token.length === 0 ? "service" : token;
}

function routeResumeError(reason: string): Error {
  return new Error(`Invalid route resume payload: ${reason}`);
}

function actionResumeError(reason: string): Error {
  return new Error(`Invalid action resume payload: ${reason}`);
}
