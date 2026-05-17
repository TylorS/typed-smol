import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { ApiHandlers } from "./Handlers.js";

describe("ApiHandlers", () => {
  it("passes raw request headers to endpoint handlers by default", () =>
    Effect.gen(function* () {
      const headers = { authorization: "Token abc" };
      const result = yield* ApiHandlers.handleRaw(
        fakeHandlers,
        "current-user",
        {
          handler: ({ headers }: { readonly headers: Record<string, string> }) =>
            Effect.succeed(headers.authorization),
        },
      );

      expect(result).toBe("Token abc");
    }).pipe(Effect.runPromise));
});

const fakeHandlers = {
  handleRaw(
    _name: string,
    handler: (ctx: {
      readonly params: Record<string, string>;
      readonly query: Record<string, string | readonly string[] | undefined>;
      readonly request: { readonly headers: Record<string, string> };
    }) => Effect.Effect<string>,
  ) {
    return handler({
      params: {},
      query: {},
      request: { headers: { authorization: "Token abc" } },
    });
  },
};
