import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import { makeBrowserClient } from "../../common/BrowserApiClient.js";
import { BrowserAuthState, createAuthStore, type AuthStore } from "../../common/State.js";
import {
  email as emailValue,
  tagName,
  username as usernameValue,
} from "../helpers/domain.js";

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
      fetch: fetchSequence([
        { status: 200, body: { user: { ...user, token: "old-token" } } },
        { status: 200, body: { user: { ...user, token: "new-token" } } },
      ]),
    });
    const token = await withAuthStore(win, (store) =>
      Effect.gen(function* () {
        yield* store.updateSettings({
          user: {
            bio: "Updated bio",
            email: emailValue("reader@example.com"),
            image: null,
            username: usernameValue("reader"),
          },
        });
        return yield* store.getToken;
      }),
    );

    expect(win.fetch.calls[1]).toMatchObject({
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
    expect(token).toBe("new-token");
  });

  it("creates and updates articles with authenticated same-origin requests", async () => {
    const win = windowWith({
      token: "token-reader",
      fetch: fetchSequence([
        { status: 200, body: { user } },
        { status: 201, body: { article } },
        { status: 200, body: { article: { ...article, title: "Typed Runtime Updated" } } },
      ]),
    });
    await withAuthStore(win, (store) =>
      Effect.gen(function* () {
        yield* store.createArticle({
          article: {
            title: "Typed Runtime",
            description: "Runtime workflows",
            body: "Typed template workflows.",
            tagList: [tagName("typed"), tagName("effect")],
          },
        });
        yield* store.updateArticle("typed-runtime", {
          article: {
            title: "Typed Runtime Updated",
          },
        });
      }),
    );

    expect(win.fetch.calls.slice(1)).toMatchObject([
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
        { status: 200, body: { user } },
        { status: 200, body: { article: { ...article, favorited: true, favoritesCount: 1 } } },
        { status: 200, body: { profile: { ...profile, following: true } } },
        { status: 201, body: { comment } },
        { status: 204 },
        { status: 204 },
      ]),
    });
    await withAuthStore(win, (store) =>
      Effect.gen(function* () {
        yield* store.favoriteArticle("typed-runtime", false);
        yield* store.followProfile("reader", false);
        yield* store.createComment("typed-runtime", { comment: { body: "Nice workflow." } });
        yield* store.deleteComment("typed-runtime", 1);
        yield* store.deleteArticle("typed-runtime");
      }),
    );

    expect(win.fetch.calls.slice(1)).toMatchObject([
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
    const exit = await Effect.runPromiseExit(
      withAuthStoreEffect(win, (store) =>
        store.createArticle({
          article: {
            title: "Typed Runtime",
            description: "Runtime workflows",
            body: "Typed template workflows.",
          },
        }),
      ),
    );

    expect(exit._tag).toBe("Failure");
    expect(win.fetch.calls).toEqual([]);
  });
});

type TestWindow = {
  readonly fetch: TestFetch;
  readonly localStorage: Storage & { jwtToken?: string };
};

type TestFetch = typeof globalThis.fetch & {
  readonly calls: Array<{
    readonly input: string;
    readonly authorization?: string;
    readonly body?: unknown;
    readonly method?: string;
  }>;
};

let currentFetch: typeof globalThis.fetch = globalThis.fetch;

const run = <A, E>(effect: Effect.Effect<A, E, never>): Promise<A> =>
  Effect.runPromise(Effect.provideService(effect, FetchHttpClient.Fetch, currentFetch));

const withAuthStore = <A, E>(
  win: TestWindow,
  useStore: (store: AuthStore) => Effect.Effect<A, E>,
) => {
  currentFetch = win.fetch;
  return run(withAuthStoreEffect(win, useStore));
};

const withAuthStoreEffect = <A, E>(
  win: TestWindow,
  useStore: (store: AuthStore) => Effect.Effect<A, E>,
) =>
  Effect.gen(function* () {
    const client = yield* makeBrowserClient({ baseUrl: "http://typed.test" });
    const store = yield* createAuthStore(client);
    return yield* useStore(store);
  }).pipe(
    Effect.provide(BrowserAuthState.make(Effect.succeed(authSnapshotFor(win)))),
    Effect.provide(FetchHttpClient.layer),
  );

const windowWith = (options: {
  readonly fetch: TestFetch;
  readonly token?: string;
}): TestWindow => {
  const storage = storageWith(options.token);
  return { fetch: options.fetch, localStorage: storage };
};

const authSnapshotFor = (win: TestWindow) => ({
  state: "loading" as const,
  token: win.localStorage.getItem("jwtToken") ?? win.localStorage.jwtToken ?? null,
  currentUser: null,
});

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
  const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      input: urlPath(input),
      authorization: authorization(init?.headers),
      body: jsonBody(init?.body),
      method: init?.method,
    });
    const response = responses[index++];
    if (!response) throw new Error(`unexpected fetch call: ${input}`);
    return new Response(response.body === undefined ? undefined : JSON.stringify(response.body), {
      status: response.status,
      headers: { "content-type": "application/json" },
    });
  };
  return Object.assign(fetch, { calls });
};

const authorization = (headers: HeadersInit | undefined): string | undefined =>
  headers === undefined ? undefined : (new Headers(headers).get("authorization") ?? undefined);

const urlPath = (input: RequestInfo | URL): string => {
  const url = input instanceof Request ? input.url : String(input);
  return new URL(url).pathname;
};

const jsonBody = (body: BodyInit | null | undefined): unknown =>
  body === undefined || body === null ? undefined : JSON.parse(bodyText(body));

const bodyText = (body: BodyInit): string =>
  typeof body === "string"
    ? body
    : body instanceof Uint8Array
      ? new TextDecoder().decode(body)
      : "";
