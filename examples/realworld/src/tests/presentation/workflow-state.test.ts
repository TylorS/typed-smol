import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { createRealWorldClient } from "../../presentation/ClientApi.js";
import { createAuthStore } from "../../presentation/State.js";

const profile = {
  username: "reader",
  bio: "Reads Typed examples.",
  image: null,
  following: false,
};

const user = {
  email: "reader@example.com",
  token: "token-reader",
  username: "reader",
  bio: null,
  image: null,
};

const article = {
  slug: "typed-runtime",
  title: "Typed Runtime",
  description: "Runtime workflows",
  body: "Typed template workflows.",
  tagList: ["typed", "effect"],
  createdAt: "2026-05-17T00:00:00.000Z",
  updatedAt: "2026-05-17T00:00:00.000Z",
  favorited: false,
  favoritesCount: 0,
  author: profile,
};

const comment = {
  id: 1,
  createdAt: "2026-05-17T00:00:00.000Z",
  updatedAt: "2026-05-17T00:00:00.000Z",
  body: "Nice workflow.",
  author: profile,
};

describe("realworld browser mutation workflows", () => {
  it("updates settings through the local API client and stores the returned token", async () => {
    const win = windowWith({
      token: "old-token",
      fetch: fetchSequence([{ status: 200, body: { user: { ...user, token: "new-token" } } }]),
    });
    const store = await run(createAuthStore(win, createRealWorldClient({ fetch: win.fetch })));

    await run(store.updateSettings({
      user: {
        bio: "Updated bio",
        email: "reader@example.com",
        image: null,
        username: "reader",
      },
    }));

    expect(win.fetch.calls[0]).toMatchObject({
      input: "/api/user",
      method: "PUT",
      authorization: "Token old-token",
      body: {
        user: {
          bio: "Updated bio",
          email: "reader@example.com",
          image: null,
          username: "reader",
        },
      },
    });
    expect(win.localStorage.getItem("jwtToken")).toBe("new-token");
  });

  it("creates and updates articles with authenticated same-origin requests", async () => {
    const win = windowWith({
      token: "token-reader",
      fetch: fetchSequence([
        { status: 201, body: { article } },
        { status: 200, body: { article: { ...article, title: "Typed Runtime Updated" } } },
      ]),
    });
    const store = await run(createAuthStore(win, createRealWorldClient({ fetch: win.fetch })));

    await run(store.createArticle({
      article: {
        title: "Typed Runtime",
        description: "Runtime workflows",
        body: "Typed template workflows.",
        tagList: ["typed", "effect"],
      },
    }));
    await run(store.updateArticle("typed-runtime", {
      article: {
        title: "Typed Runtime Updated",
      },
    }));

    expect(win.fetch.calls).toMatchObject([
      {
        input: "/api/articles",
        method: "POST",
        authorization: "Token token-reader",
      },
      {
        input: "/api/articles/typed-runtime",
        method: "PUT",
        authorization: "Token token-reader",
      },
    ]);
  });

  it("favorites, follows, comments, and deletes through authenticated workflows", async () => {
    const win = windowWith({
      token: "token-reader",
      fetch: fetchSequence([
        { status: 200, body: { article: { ...article, favorited: true, favoritesCount: 1 } } },
        { status: 200, body: { profile: { ...profile, following: true } } },
        { status: 201, body: { comment } },
        { status: 204 },
        { status: 204 },
      ]),
    });
    const store = await run(createAuthStore(win, createRealWorldClient({ fetch: win.fetch })));

    await run(store.favoriteArticle("typed-runtime", false));
    await run(store.followProfile("reader", false));
    await run(store.createComment("typed-runtime", { comment: { body: "Nice workflow." } }));
    await run(store.deleteComment("typed-runtime", 1));
    await run(store.deleteArticle("typed-runtime"));

    expect(win.fetch.calls).toMatchObject([
      { input: "/api/articles/typed-runtime/favorite", method: "POST" },
      { input: "/api/profiles/reader/follow", method: "POST" },
      {
        input: "/api/articles/typed-runtime/comments",
        method: "POST",
        body: { comment: { body: "Nice workflow." } },
      },
      { input: "/api/articles/typed-runtime/comments/1", method: "DELETE" },
      { input: "/api/articles/typed-runtime", method: "DELETE" },
    ]);
  });

  it("fails protected workflows before fetch when jwtToken is absent", async () => {
    const win = windowWith({ fetch: fetchSequence([]) });
    const store = await run(createAuthStore(win, createRealWorldClient({ fetch: win.fetch })));

    const exit = await Effect.runPromiseExit(store.createArticle({
      article: {
        title: "Typed Runtime",
        description: "Runtime workflows",
        body: "Typed template workflows.",
      },
    }));

    expect(exit._tag).toBe("Failure");
    expect(win.fetch.calls).toEqual([]);
  });
});

type TestWindow = {
  readonly fetch: TestFetch;
  readonly localStorage: Storage & { jwtToken?: string };
};

type TestFetch = {
  (
    input: string,
    init?: {
      readonly body?: string;
      readonly headers?: Record<string, string>;
      readonly method?: string;
    },
  ): Promise<Response>;
  readonly calls: Array<{
    readonly input: string;
    readonly authorization?: string;
    readonly body?: unknown;
    readonly method?: string;
  }>;
};

const run = <A, E>(effect: Effect.Effect<A, E, never>): Promise<A> =>
  Effect.runPromise(effect);

const windowWith = (options: {
  readonly fetch: TestFetch;
  readonly token?: string;
}): TestWindow => {
  const storage = storageWith(options.token);
  return { fetch: options.fetch, localStorage: storage };
};

const storageWith = (token?: string): Storage => {
  const values = new Map<string, string>();
  if (token) values.set("jwtToken", token);
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
};

const fetchSequence = (
  responses: ReadonlyArray<{ readonly body?: unknown; readonly status: number }>,
): TestFetch => {
  const calls: TestFetch["calls"] = [];
  let index = 0;
  const fetch: TestFetch = async (input, init) => {
    calls.push({
      input,
      authorization: init?.headers?.authorization,
      body: init?.body ? JSON.parse(init.body) as unknown : undefined,
      method: init?.method,
    });
    const response = responses[index++];
    if (!response) throw new Error(`unexpected fetch call: ${input}`);
    return new Response(
      response.body === undefined ? undefined : JSON.stringify(response.body),
      { status: response.status, headers: { "content-type": "application/json" } },
    );
  };
  Object.defineProperty(fetch, "calls", { value: calls });
  return fetch;
};
