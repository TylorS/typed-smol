import * as Schema from "effect/Schema";
import { describe, expect, it } from "vitest";
import {
  makeDevtoolsClientId,
  makeDevtoolsSessionId,
  makeDomBindingId,
  makeHmrBoundaryId,
  makeTemplateHash,
} from "./Ids.js";
import {
  DevtoolsHandshakeRequestSchema,
  HmrStatusFactSchema,
  RuntimeEventEnvelopeSchema,
  SourceAnalyzerResponseSchema,
  decodeDevtoolsPayload,
} from "./Schemas.js";
import {
  SerializedValueSchema,
  decodeSerializedValue,
  serializeDevtoolsError,
  serializeDevtoolsValue,
} from "./Serialization.js";

describe("DevTools protocol serialization", () => {
  it("serializes JSON-compatible values into bounded protocol summaries", () => {
    expect(
      serializeDevtoolsValue({
        user: "Ada",
        count: 2,
        tags: ["admin", "editor"],
      }),
    ).toEqual({
      _tag: "Object",
      entries: [
        { key: "user", value: { _tag: "String", truncated: false, value: "Ada" } },
        { key: "count", value: { _tag: "Number", value: 2 } },
        {
          key: "tags",
          value: {
            _tag: "Array",
            items: [
              { _tag: "String", truncated: false, value: "admin" },
              { _tag: "String", truncated: false, value: "editor" },
            ],
            truncated: false,
          },
        },
      ],
      truncated: false,
    });
  });

  it("redacts sensitive object keys before values leave the inspected page", () => {
    expect(
      serializeDevtoolsValue({
        authorization: "Bearer token",
        nested: { password: "secret", visible: true },
      }),
    ).toEqual({
      _tag: "Object",
      entries: [
        { key: "authorization", value: { _tag: "Redacted", reason: "key:authorization" } },
        {
          key: "nested",
          value: {
            _tag: "Object",
            entries: [
              { key: "password", value: { _tag: "Redacted", reason: "key:password" } },
              { key: "visible", value: { _tag: "Boolean", value: true } },
            ],
            truncated: false,
          },
        },
      ],
      truncated: false,
    });
  });

  it("redacts sensitive accessors without invoking their getter", () => {
    const value = Object.create(null) as { readonly password: string; readonly visible: string };
    Object.defineProperty(value, "password", {
      enumerable: true,
      get() {
        throw new Error("password getter should not run");
      },
    });
    Object.defineProperty(value, "visible", {
      enumerable: true,
      value: "ok",
    });

    expect(serializeDevtoolsValue(value)).toEqual({
      _tag: "Object",
      entries: [
        { key: "password", value: { _tag: "Redacted", reason: "key:password" } },
        { key: "visible", value: { _tag: "String", truncated: false, value: "ok" } },
      ],
      truncated: false,
    });
  });

  it("bounds deep, wide, large, cyclic, and unserializable values", () => {
    const cyclic: { readonly name: string; self?: unknown } = { name: "cycle" };
    cyclic.self = cyclic;

    expect(serializeDevtoolsValue("abcdef", { maxStringLength: 3 })).toEqual({
      _tag: "String",
      truncated: true,
      value: "abc",
    });
    expect(serializeDevtoolsValue({ a: 1, b: 2 }, { maxEntries: 1 })).toEqual({
      _tag: "Object",
      entries: [{ key: "a", value: { _tag: "Number", value: 1 } }],
      truncated: true,
    });
    expect(serializeDevtoolsValue({ nested: { value: 1 } }, { maxDepth: 1 })).toEqual({
      _tag: "Object",
      entries: [{ key: "nested", value: { _tag: "MaxDepth", depth: 1 } }],
      truncated: false,
    });
    expect(serializeDevtoolsValue(cyclic)).toEqual({
      _tag: "Object",
      entries: [
        { key: "name", value: { _tag: "String", truncated: false, value: "cycle" } },
        { key: "self", value: { _tag: "Circular", path: "$" } },
      ],
      truncated: false,
    });
    expect(serializeDevtoolsValue(Number.NaN)).toEqual({
      _tag: "Unserializable",
      reason: "non-finite-number",
    });
  });

  it("serializes errors without exposing arbitrary object graphs", () => {
    expect(serializeDevtoolsError(new TypeError("Boom"), { maxStringLength: 10 })).toEqual({
      _tag: "Error",
      message: "Boom",
      name: "TypeError",
      stack: expect.objectContaining({ _tag: "String" }),
    });
  });

  it("validates serialized value payloads with Effect Schema", () => {
    const encoded = serializeDevtoolsValue({ ok: true });

    expect(Schema.decodeUnknownSync(SerializedValueSchema)(encoded)).toEqual(encoded);
    expect(() => Schema.decodeUnknownSync(SerializedValueSchema)({ _tag: "String" })).toThrow();
    expect(() =>
      Schema.decodeUnknownSync(SerializedValueSchema)({ _tag: "Number", value: Number.NaN }),
    ).toThrow();
  });

  it("keeps serialized values JSON-compatible", () => {
    const encoded = serializeDevtoolsValue({
      count: 1n,
      handler: function onClick() {},
      missing: undefined,
    });

    expect(JSON.parse(JSON.stringify(encoded))).toEqual(encoded);
  });

  it("rejects excess properties at protocol decode boundaries", () => {
    expect(() =>
      decodeSerializedValue({ _tag: "String", value: "ok", truncated: false, extra: true }),
    ).toThrow();
  });

  it("validates protocol payloads and rejects invalid ids or capabilities", () => {
    const request = {
      version: "0.1.0",
      peer: "extension-panel",
      sessionId: makeDevtoolsSessionId("session-1"),
      clientId: makeDevtoolsClientId("panel-1"),
      capabilities: ["components", "dom", "source-analyzer"],
    } as const;

    expect(decodeDevtoolsPayload(DevtoolsHandshakeRequestSchema, request)).toEqual(request);
    expect(() =>
      decodeDevtoolsPayload(DevtoolsHandshakeRequestSchema, {
        ...request,
        sessionId: "session:",
      }),
    ).toThrow();
    expect(() =>
      decodeDevtoolsPayload(DevtoolsHandshakeRequestSchema, {
        ...request,
        capabilities: ["components", "browser-only"],
      }),
    ).toThrow();
    expect(() =>
      decodeDevtoolsPayload(DevtoolsHandshakeRequestSchema, {
        ...request,
        extra: true,
      }),
    ).toThrow();
    expect(() =>
      decodeDevtoolsPayload(RuntimeEventEnvelopeSchema, {
        _tag: "RefSubjectUpdated",
        refSubjectId: "ref:state/user",
        timestamp: Number.POSITIVE_INFINITY,
        value: serializeDevtoolsValue(true),
        version: 1,
      }),
    ).toThrow();
    expect(() =>
      decodeDevtoolsPayload(RuntimeEventEnvelopeSchema, {
        _tag: "OtelSpan",
        name: "render",
        spanId: "span-1",
        traceId: "trace-1",
        typedIds: ["not-an-id"],
      }),
    ).toThrow();
  });

  it("validates source analyzer unavailable results and DOM binding ids", () => {
    const result = {
      _tag: "Unavailable",
      reason: "dev-server-missing",
      requestedAt: 100,
    } as const;

    expect(decodeDevtoolsPayload(SourceAnalyzerResponseSchema, result)).toEqual(result);
    expect(() =>
      decodeDevtoolsPayload(SourceAnalyzerResponseSchema, {
        _tag: "SourceFacts",
        bindingId: makeDomBindingId("dom-1"),
        facts: [],
      }),
    ).toThrow();
  });

  it("validates HMR facts without collapsing template optimization and stateful eligibility", () => {
    const hmrFact = {
      _tag: "HmrStatus",
      boundaryId: makeHmrBoundaryId("module:counter"),
      moduleId: "/src/Counter.ts",
      stateful: {
        _tag: "Rejected",
        reasons: ["anonymous-refsubject"],
      },
      template: {
        optimized: true,
        templateHash: makeTemplateHash("counter-template"),
      },
      timestamp: 200,
    } as const;

    expect(decodeDevtoolsPayload(HmrStatusFactSchema, hmrFact)).toEqual(hmrFact);
    expect(decodeDevtoolsPayload(RuntimeEventEnvelopeSchema, hmrFact)).toEqual(hmrFact);
    expect(() =>
      decodeDevtoolsPayload(HmrStatusFactSchema, {
        ...hmrFact,
        stateful: true,
      }),
    ).toThrow();
  });
});
