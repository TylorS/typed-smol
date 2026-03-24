/**
 * Endpoint contract validation for HttpApi virtual module.
 * Validates required fields (route, method, handler). Optional: headers, body, error, success.
 * Route covers path + query; headers/body mirror decoders from HttpServerRequest;
 * error/success encode response payloads with annotated status codes.
 * Handler returns require structural type checking (assignable to success/error schemas)
 * and coercion into HttpServerResponse via Effect's HttpApi layer.
 *
 * @see .docs/specs/httpapi-virtual-module-plugin/spec.md (Endpoint contract, Endpoint Contract Validator)
 */

import type { ValidationResult } from "./validation.js";
import { validateNonEmptyString } from "./validation.js";

/** Supported HTTP method literals for endpoint contract */
const HTTP_METHODS = new Set<string>(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);

/** Minimal endpoint contract shape (runtime check) */
export interface EndpointContractInput {
  readonly route?: unknown;
  readonly method?: unknown;
  readonly handler?: unknown;
  readonly headers?: unknown;
  readonly body?: unknown;
  readonly error?: unknown;
  readonly success?: unknown;
}

/** Validated endpoint contract */
export interface ValidatedEndpointContract {
  readonly route: unknown;
  readonly method: string;
  readonly handler: unknown;
}

/**
 * Checks that value is a non-null object (route/schema-like values are objects).
 */
function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

/**
 * Validates endpoint contract: required route, method, handler; optional headers, body, error, success.
 */
export function validateEndpointContract(
  input: unknown,
): ValidationResult<ValidatedEndpointContract> {
  if (!isObject(input)) {
    return { ok: false, reason: "Endpoint contract must be an object" };
  }

  const contract = input as Record<string, unknown>;

  if (contract.route === undefined) {
    return { ok: false, reason: "Endpoint contract missing required field: route" };
  }
  if (!isObject(contract.route)) {
    return {
      ok: false,
      reason: "Endpoint contract route must be an object (path + pathSchema + querySchema)",
    };
  }

  const route = contract.route as Record<string, unknown>;
  if (route.pathSchema === undefined) {
    return { ok: false, reason: "Endpoint contract route must include pathSchema" };
  }
  if (route.querySchema === undefined) {
    return { ok: false, reason: "Endpoint contract route must include querySchema" };
  }

  const methodResult = validateNonEmptyString(contract.method, "method");
  if (!methodResult.ok) {
    return {
      ok: false,
      reason: `Endpoint contract method: ${methodResult.reason}`,
    };
  }
  if (!HTTP_METHODS.has(methodResult.value)) {
    return {
      ok: false,
      reason: `Endpoint contract method must be one of: ${[...HTTP_METHODS].join(", ")}`,
    };
  }

  if (contract.handler === undefined) {
    return { ok: false, reason: "Endpoint contract missing required field: handler" };
  }
  if (typeof contract.handler !== "function") {
    return {
      ok: false,
      reason: "Endpoint contract handler must be a function",
    };
  }

  return {
    ok: true,
    value: {
      route: contract.route,
      method: methodResult.value,
      handler: contract.handler,
    },
  };
}
