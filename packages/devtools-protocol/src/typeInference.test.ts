import { describe, expectTypeOf, it } from "vitest";
import {
  makeDevtoolsClientId,
  makeDevtoolsSessionId,
  makeDomBindingId,
  makeRefSubjectId,
} from "./Ids.js";
import type {
  DevtoolsCapability,
  DevtoolsHandshakeRequest,
  DomBindingRequest,
  RuntimeEventEnvelope,
  SourceAnalyzerResponse,
} from "./Schemas.js";
import { serializeDevtoolsValue } from "./Serialization.js";

describe("DevTools protocol type inference", () => {
  it("preserves inferred id and payload types without manual generics", () => {
    const handshake = {
      version: "0.1.0",
      peer: "extension-panel",
      sessionId: makeDevtoolsSessionId("session-1"),
      clientId: makeDevtoolsClientId("panel-1"),
      capabilities: ["components", "dom"],
    } as const satisfies DevtoolsHandshakeRequest;

    const domRequest = {
      bindingId: makeDomBindingId("button:submit"),
      includeRelated: true,
    } as const satisfies DomBindingRequest;

    expectTypeOf<(typeof handshake.capabilities)[number]>().toExtend<DevtoolsCapability>();
    expectTypeOf(handshake.sessionId).toEqualTypeOf<ReturnType<typeof makeDevtoolsSessionId>>();
    expectTypeOf(domRequest.bindingId).toEqualTypeOf<ReturnType<typeof makeDomBindingId>>();
  });

  it("infers discriminated runtime event payloads", () => {
    const event = {
      _tag: "RefSubjectUpdated",
      refSubjectId: makeRefSubjectId("state/user"),
      value: serializeDevtoolsValue({ name: "Ada" }),
      version: 2,
      timestamp: 10,
    } as const satisfies RuntimeEventEnvelope;

    if (event._tag === "RefSubjectUpdated") {
      expectTypeOf(event.value).toEqualTypeOf<ReturnType<typeof serializeDevtoolsValue>>();
    }
  });

  it("keeps unavailable analyzer states distinct from source fact states", () => {
    const unavailable = {
      _tag: "Unavailable",
      reason: "bridge-missing",
      requestedAt: 100,
    } as const satisfies SourceAnalyzerResponse;

    expectTypeOf(unavailable._tag).toEqualTypeOf<"Unavailable">();
  });
});

// @ts-expect-error Invalid capabilities must be rejected by protocol payload types.
const invalidCapability: DevtoolsCapability = "browser-only";

// @ts-expect-error Plain strings must not satisfy protocol id-bearing requests.
const invalidDomRequest: DomBindingRequest = { bindingId: "dom:button", includeRelated: true };

void invalidCapability;
void invalidDomRequest;
