import * as Effect from "effect/Effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import { describe, expect, it } from "vitest";
import { makeBrowserClient } from "../../common/BrowserApiClient.js";
import { decodedRouteApiClient, home } from "../../common/routeData.js";
import { BrowserAuthState } from "../../common/State.js";

describe("browser route data", () => {
  it("loads the home feed through the generated browser API client", async () => {
    const calls: string[] = [];
    const fetch = async (input: RequestInfo | URL) => {
      const url = input instanceof Request ? new URL(input.url) : new URL(String(input));
      calls.push(`${url.pathname}${url.search}`);

      if (url.pathname === "/api/articles") {
        return jsonResponse({
          articles: [
            {
              slug: "typed",
              title: "Typed",
              description: "Declarative apps",
              body: "Hello",
              tagList: ["typed"],
              createdAt: "2026-05-18T00:00:00.000Z",
              updatedAt: "2026-05-18T00:00:00.000Z",
              favorited: false,
              favoritesCount: 0,
              author: {
                username: "reader",
                bio: null,
                image: null,
                following: false,
              },
            },
          ],
          articlesCount: 1,
        });
      }

      if (url.pathname === "/api/tags") return jsonResponse({ tags: ["typed"] });

      return jsonResponse({ errors: { body: [`unexpected request ${url.pathname}`] } }, 404);
    };

    const data = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* makeBrowserClient({ baseUrl: "http://typed.test" });
        return yield* home(decodedRouteApiClient(client), { page: 1 });
      }).pipe(
        Effect.provide(BrowserAuthState.make(Effect.succeed(unauthenticatedSnapshot))),
        Effect.provide(FetchHttpClient.layer),
        Effect.provideService(FetchHttpClient.Fetch, fetch),
      ),
    );

    expect(calls).toEqual(["/api/articles?limit=10&offset=0", "/api/tags"]);
    expect(data.articles).toHaveLength(1);
    expect(data.tags).toEqual(["typed"]);
  });
});

const unauthenticatedSnapshot = {
  state: "unauthenticated" as const,
  token: null,
  currentUser: null,
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
