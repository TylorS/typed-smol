import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import * as Logger from "effect/Logger";
import { makeBrowserClient } from "../../common/BrowserApiClient.js";
import { BrowserAuth } from "../../common/BrowserAuth.js";
import { AuthSessionStorage } from "../../common/AuthSessionStorage.js";
import { BrowserAuthState, createAuthStore, type AuthStore } from "../../common/State.js";
import { Email, Username } from "../../domain/Ids.js";
import { Password } from "../../domain/RealWorldApi.js";

const user = {
  email: "reader@example.com",
  token: "token-reader",
  username: "reader",
  bio: null,
  image: null,
};

describe("realworld browser auth state", () => {
  it("starts unauthenticated when localStorage.jwtToken is absent", async () => {
    const win = windowWith({ fetch: fetchJson({ user }, 200) });
    const state = await withAuthStore(win, (store) =>
      Effect.gen(function* () {
        return {
          token: yield* store.getToken,
          authState: yield* store.getAuthState,
          currentUser: yield* store.getCurrentUser,
        };
      }));

    expect(state).toEqual({
      token: null,
      authState: "unauthenticated",
      currentUser: null,
    });
  });

  it("keeps jwtToken and exposes decoded current user after successful initialization", async () => {
    const win = windowWith({
      fetch: fetchJson({ user }, 200),
      token: "token-reader",
    });
    const state = await withAuthStore(win, (store) =>
      Effect.gen(function* () {
        return {
          token: yield* store.getToken,
          authState: yield* store.getAuthState,
          currentUser: yield* store.getCurrentUser,
        };
      }));

    expect(win.fetch.calls[0]).toMatchObject({
      input: "/api/user",
      authorization: "Token token-reader",
    });
    expect(state).toEqual({
      token: "token-reader",
      authState: "authenticated",
      currentUser: user,
    });
  });

  it("logs in through the local API client and stores the returned token", async () => {
    const win = windowWith({ fetch: fetchJson({ user }, 200) });
    const result = await withAuthStore(win, (store) =>
      Effect.gen(function* () {
        const response = yield* store.login({
          user: {
            email: Email.make("reader@example.com"),
            password: Password.make("password123"),
          },
        });

        return {
          response,
          token: yield* store.getToken,
          authState: yield* store.getAuthState,
        };
      }));

    expect(win.fetch.calls[0]).toMatchObject({
      input: "/api/users/login",
      method: "POST",
      body: {
        user: {
          email: "reader@example.com",
          password: "password123",
        },
      },
    });
    expect(result.response.user).toEqual(user);
    expect(result.token).toBe("token-reader");
    expect(result.authState).toBe("authenticated");
  });

  it("registers through the local API client and stores the returned token", async () => {
    const win = windowWith({ fetch: fetchJson({ user }, 201) });
    const state = await withAuthStore(win, (store) =>
      Effect.gen(function* () {
        yield* store.register({
          user: {
            username: Username.make("reader"),
            email: Email.make("reader@example.com"),
            password: Password.make("password123"),
          },
        });

        return {
          token: yield* store.getToken,
          currentUser: yield* store.getCurrentUser,
        };
      }));

    expect(win.fetch.calls[0]).toMatchObject({
      input: "/api/users",
      method: "POST",
    });
    expect(state.token).toBe("token-reader");
    expect(state.currentUser).toEqual(user);
  });

  it("logs out by clearing token and authenticated user state", async () => {
    const win = windowWith({ fetch: fetchJson({ user }, 200), token: "token-reader" });
    const state = await withAuthStore(win, (store) =>
      Effect.gen(function* () {
        yield* store.logout;

        return {
          token: yield* store.getToken,
          authState: yield* store.getAuthState,
          currentUser: yield* store.getCurrentUser,
        };
      }));

    expect(state).toEqual({
      token: null,
      authState: "unauthenticated",
      currentUser: null,
    });
  });

  it("reads tokens supplied by the auth state service", async () => {
    const win = windowWith({ fetch: fetchJson({ user }, 200), token: "state-token" });
    const authState = await withAuthStore(win, (store) =>
      Effect.gen(function* () {
        return yield* store.getAuthState;
      }));

    expect(win.fetch.calls[0]).toMatchObject({
      input: "/api/user",
      authorization: "Token state-token",
    });
    expect(authState).toBe("authenticated");
  });

  it("clears jwtToken and returns unauthenticated on current-user 4xx responses", async () => {
    const win = windowWith({
      fetch: fetchJson({ errors: { token: ["is invalid"] } }, 401),
      token: "stale-token",
    });
    const state = await withAuthStore(win, (store) =>
      Effect.gen(function* () {
        return {
          token: yield* store.getToken,
          authState: yield* store.getAuthState,
          currentUser: yield* store.getCurrentUser,
        };
      }));

    expect(state).toEqual({
      token: null,
      authState: "unauthenticated",
      currentUser: null,
    });
  });

  it("keeps jwtToken and returns unavailable on network failures", async () => {
    const win = windowWith({
      fetch: failingFetch,
      token: "offline-token",
    });
    const state = await withAuthStore(win, (store) =>
      Effect.gen(function* () {
        return {
          token: yield* store.getToken,
          authState: yield* store.getAuthState,
          currentUser: yield* store.getCurrentUser,
        };
      }));

    expect(state).toEqual({
      token: "offline-token",
      authState: "unavailable",
      currentUser: null,
    });
  });

  it("keeps jwtToken and returns unavailable on current-user 5xx responses", async () => {
    const win = windowWith({
      fetch: fetchJson({ errors: { server: ["unavailable"] } }, 503),
      token: "server-error-token",
    });
    const state = await withAuthStore(win, (store) =>
      Effect.gen(function* () {
        return {
          token: yield* store.getToken,
          authState: yield* store.getAuthState,
        };
      }));

    expect(state.token).toBe("server-error-token");
    expect(state.authState).toBe("unavailable");
  });

  it("keeps jwtToken and returns unavailable when current-user JSON fails schema decoding", async () => {
    const win = windowWith({
      fetch: fetchJson({ user: { ...user, token: null } }, 200),
      token: "decode-error-token",
    });
    const state = await withAuthStore(win, (store) =>
      Effect.gen(function* () {
        return {
          token: yield* store.getToken,
          authState: yield* store.getAuthState,
          currentUser: yield* store.getCurrentUser,
        };
      }));

    expect(state).toEqual({
      token: "decode-error-token",
      authState: "unavailable",
      currentUser: null,
    });
  });

  it("persists token updates through KeyValueStore and Schema in BrowserAuth.Live", async () => {
    const win = windowWith({ fetch: fetchJson({ user }, 200) });

    await run(
      BrowserAuth.use((auth) =>
        auth.login({
          user: {
            email: Email.make("reader@example.com"),
            password: Password.make("password123"),
          },
        })).pipe(
        Effect.andThen(waitForPersistedToken("token-reader")),
      ).pipe(
        Effect.provide(BrowserAuth.Live(win, clientEffectFor(win.fetch))),
      ),
    );

    const persisted = await run(
      AuthSessionStorage.getToken.pipe(
        Effect.provide(AuthSessionStorage.local(() => win.localStorage)),
      ),
    );

    expect(persisted).toBe("token-reader");
  });

  it("ignores empty auth emissions while persisting tokens", async () => {
    const win = windowWith({ fetch: fetchJson({ user }, 200), token: "stored-token" });
    const missingSnapshot: Parameters<typeof AuthSessionStorage.persist>[0] | undefined = undefined;
    const logs: Array<unknown> = [];
    const logger = Logger.make(({ message }) => logs.push(message));

    await run(
      AuthSessionStorage.persist(missingSnapshot).pipe(
        Effect.provide(AuthSessionStorage.local(() => win.localStorage)),
        Effect.provide(Logger.layer([logger])),
      ),
    );

    expect(win.localStorage.getItem("jwtToken")).toBe("stored-token");
    expect(logs).toEqual([]);
  });

  it("adds authorization through an HttpClient middleware backed by BrowserAuthState", async () => {
    const win = windowWith({
      fetch: fetchJson({
        article: {
          slug: "typed",
          title: "Typed",
          description: "Declarative apps",
          body: "Hello",
          tagList: [],
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
      }, 200),
      token: "middleware-token",
    });

    await withAuthStore(win, (store) => store.favoriteArticle("typed", false));

    expect(win.fetch.calls[1]).toMatchObject({
      input: "/api/articles/typed/favorite",
      method: "POST",
      authorization: "Token middleware-token",
    });
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

const clientEffectFor = (fetch: TestFetch) => {
  currentFetch = fetch;
  return makeBrowserClient({ baseUrl: "http://typed.test" }).pipe(Effect.provide(FetchHttpClient.layer));
};

const waitForPersistedToken = (expected: string): Effect.Effect<void, never, AuthSessionStorage> =>
  Effect.gen(function* () {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const token = yield* AuthSessionStorage.getToken;
      if (token === expected) return;
      yield* Effect.sleep("10 millis");
    }
  });

const withAuthStore = <A, E>(
  win: TestWindow,
  useStore: (store: AuthStore) => Effect.Effect<A, E>,
) => {
  currentFetch = win.fetch;
  return run(
    Effect.gen(function* () {
      const client = yield* makeBrowserClient({ baseUrl: "http://typed.test" });
      const store = yield* createAuthStore(client);
      return yield* useStore(store);
    }).pipe(
      Effect.provide(BrowserAuthState.make(Effect.succeed(authSnapshotFor(win)))),
      Effect.provide(FetchHttpClient.layer),
    ),
  );
};

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

const fetchJson = (body: unknown, status: number): TestFetch => {
  const calls: TestFetch["calls"] = [];
  const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      input: urlPath(input),
      authorization: authorization(init?.headers),
      body: jsonBody(init?.body),
      method: init?.method,
    });
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
  };
  return Object.assign(fetch, { calls });
};

const failingCalls: TestFetch["calls"] = [];
const failingFetch: TestFetch = Object.assign(
  async (_input: RequestInfo | URL, _init?: RequestInit) => {
    throw new Error("offline");
  },
  { calls: failingCalls },
);

const authorization = (headers: HeadersInit | undefined): string | undefined =>
  headers === undefined ? undefined : new Headers(headers).get("authorization") ?? undefined;

const urlPath = (input: RequestInfo | URL): string => {
  const url = input instanceof Request ? input.url : String(input);
  return new URL(url).pathname;
};

const jsonBody = (body: BodyInit | null | undefined): unknown =>
  body === undefined || body === null ? undefined : JSON.parse(bodyText(body));

const bodyText = (body: BodyInit): string =>
  typeof body === "string" ? body : body instanceof Uint8Array ? new TextDecoder().decode(body) : "";
