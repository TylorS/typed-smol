import * as Effect from "effect/Effect";
import * as Stream from "effect/Stream";
import { RpcTest } from "effect/unstable/rpc";
import { describe, expect, expectTypeOf, it } from "vitest";
import { DevtoolsProtocolFixtures, makeDevtoolsProtocolFixtureHandlers } from "./Fixtures.js";
import { TypedDevtoolsRpcGroup, type TypedDevtoolsRpcTag } from "./Rpc.js";
import type { RuntimeEventEnvelope } from "./Schemas.js";

describe("Typed DevTools RPC protocol", () => {
  it("defines the required protocol RPC tags in one group", () => {
    expect([...TypedDevtoolsRpcGroup.requests.keys()]).toEqual([
      "Handshake",
      "SubscribeRuntimeEvents",
      "ResolveDomBinding",
      "AnalyzeSource",
    ]);

    expectTypeOf<TypedDevtoolsRpcTag>().toEqualTypeOf<
      "Handshake" | "SubscribeRuntimeEvents" | "ResolveDomBinding" | "AnalyzeSource"
    >();
  });

  it("runs the shared protocol through the in-process RPC test transport", async () => {
    const result = await Effect.gen(function* () {
      const client = yield* RpcTest.makeClient(TypedDevtoolsRpcGroup);
      const handshake = yield* client.Handshake(DevtoolsProtocolFixtures.handshakeRequest);
      const dom = yield* client.ResolveDomBinding(DevtoolsProtocolFixtures.domBindingRequest);
      const analyzer = yield* client.AnalyzeSource(DevtoolsProtocolFixtures.sourceAnalyzerRequest);
      const events = yield* client
        .SubscribeRuntimeEvents(DevtoolsProtocolFixtures.runtimeSubscriptionRequest)
        .pipe(Stream.runCollect);

      return { analyzer, dom, events, handshake };
    }).pipe(
      Effect.provide(TypedDevtoolsRpcGroup.toLayer(makeDevtoolsProtocolFixtureHandlers())),
      Effect.scoped,
      Effect.runPromise,
    );

    expect(result.handshake).toEqual(DevtoolsProtocolFixtures.handshakeResponse);
    expect(result.dom).toEqual(DevtoolsProtocolFixtures.domBindingResolution);
    expect(result.analyzer).toEqual(DevtoolsProtocolFixtures.sourceAnalyzerResponse);
    expect(result.events).toEqual(DevtoolsProtocolFixtures.runtimeEvents);
  });

  it("keeps streamed runtime events typed as protocol envelopes", () => {
    expectTypeOf<
      (typeof DevtoolsProtocolFixtures.runtimeEvents)[number]
    >().toExtend<RuntimeEventEnvelope>();
  });
});
