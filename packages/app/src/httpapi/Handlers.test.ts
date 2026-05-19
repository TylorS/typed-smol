import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Stream from "effect/Stream";
import * as HttpIncomingMessage from "effect/unstable/http/HttpIncomingMessage";
import { ApiHandlers } from "./Handlers.js";

describe("ApiHandlers", () => {
  it("passes raw request headers to endpoint handlers by default", () =>
    Effect.gen(function* () {
      const result = yield* ApiHandlers.rawHandler({
        handler: ({ headers }: { readonly headers: Record<string, string> }) =>
          Effect.succeed(headers.authorization),
      })({
        params: {},
        query: {},
        request: makeRequest({ authorization: "Token abc" }),
      });

      expect(result).toBe("Token abc");
    }).pipe(Effect.runPromise));
});

function makeRequest(headers: Record<string, string>): HttpIncomingMessage.HttpIncomingMessage<never> {
  return {
    [HttpIncomingMessage.TypeId]: HttpIncomingMessage.TypeId,
    headers,
    remoteAddress: Option.none(),
    json: Effect.succeed(null),
    text: Effect.succeed(""),
    urlParamsBody: Effect.succeed({}),
    arrayBuffer: Effect.succeed(new ArrayBuffer(0)),
    stream: Stream.empty,
    toString: () => "[HttpIncomingMessage]",
    toJSON: () => ({ headers }),
  };
}
