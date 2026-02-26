/**
 * Unit tests for HttpApi endpoint contract validation.
 * @see .docs/specs/httpapi-virtual-module-plugin/testing-strategy.md (endpoint contract validation)
 */

import { describe, expect, it } from "vitest";
import {
  validateEndpointContract,
  type EndpointContractInput,
} from "./internal/httpapiEndpointContract.js";

describe("validateEndpointContract", () => {
  const validContract: EndpointContractInput = {
    route: { path: "/users", pathSchema: {}, querySchema: {} },
    method: "GET",
    handler: () => {},
  };

  it("accepts contract with all required fields and valid method", () => {
    const result = validateEndpointContract(validContract);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.method).toBe("GET");
      expect(result.value.route).toBe(validContract.route);
      expect(result.value.handler).toBe(validContract.handler);
    }
  });

  it("accepts all supported HTTP methods", () => {
    const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
    for (const method of methods) {
      const result = validateEndpointContract({
        ...validContract,
        method,
      });
      expect(result.ok, `method ${method}`).toBe(true);
      if (result.ok) expect(result.value.method).toBe(method);
    }
  });

  it("rejects non-object input", () => {
    expect(validateEndpointContract(null)).toMatchInlineSnapshot(`
      {
        "ok": false,
        "reason": "Endpoint contract must be an object",
      }
    `);
    expect(validateEndpointContract(undefined)).toMatchInlineSnapshot(`
      {
        "ok": false,
        "reason": "Endpoint contract must be an object",
      }
    `);
    expect(validateEndpointContract("string")).toMatchInlineSnapshot(`
      {
        "ok": false,
        "reason": "Endpoint contract must be an object",
      }
    `);
  });

  it("rejects missing route", () => {
    const { route: _, ...noRoute } = validContract as Record<string, unknown>;
    expect(validateEndpointContract(noRoute)).toMatchInlineSnapshot(`
      {
        "ok": false,
        "reason": "Endpoint contract missing required field: route",
      }
    `);
  });

  it("rejects missing method", () => {
    const { method: _, ...noMethod } = validContract as Record<string, unknown>;
    expect(validateEndpointContract(noMethod)).toMatchInlineSnapshot(`
      {
        "ok": false,
        "reason": "Endpoint contract method: method must be a string",
      }
    `);
  });

  it("rejects invalid method", () => {
    expect(validateEndpointContract({ ...validContract, method: "INVALID" }))
      .toMatchInlineSnapshot(`
      {
        "ok": false,
        "reason": "Endpoint contract method must be one of: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS",
      }
    `);
  });

  it("rejects empty string method", () => {
    const result = validateEndpointContract({
      ...validContract,
      method: "  ",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects route that is not an object", () => {
    expect(validateEndpointContract({ ...validContract, route: null })).toMatchInlineSnapshot(`
      {
        "ok": false,
        "reason": "Endpoint contract route must be an object (path + pathSchema + querySchema)",
      }
    `);
  });

  it("rejects route missing pathSchema", () => {
    expect(
      validateEndpointContract({
        ...validContract,
        route: { path: "/x", querySchema: {} },
      }),
    ).toMatchInlineSnapshot(`
      {
        "ok": false,
        "reason": "Endpoint contract route must include pathSchema",
      }
    `);
  });

  it("rejects route missing querySchema", () => {
    expect(
      validateEndpointContract({
        ...validContract,
        route: { path: "/x", pathSchema: {} },
      }),
    ).toMatchInlineSnapshot(`
      {
        "ok": false,
        "reason": "Endpoint contract route must include querySchema",
      }
    `);
  });

  it("rejects missing handler", () => {
    const { handler: _, ...noHandler } = validContract as Record<string, unknown>;
    expect(validateEndpointContract(noHandler)).toMatchInlineSnapshot(`
      {
        "ok": false,
        "reason": "Endpoint contract missing required field: handler",
      }
    `);
  });

  it("rejects handler that is not a function", () => {
    expect(validateEndpointContract({ ...validContract, handler: "not a function" }))
      .toMatchInlineSnapshot(`
      {
        "ok": false,
        "reason": "Endpoint contract handler must be a function",
      }
    `);
  });
});
