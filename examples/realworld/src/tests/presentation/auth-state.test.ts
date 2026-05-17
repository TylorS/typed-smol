import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { createAuthStore } from "../../presentation/State.js";
import { installConduitDebug } from "../../presentation/Debug.js";
import { createRealWorldClient } from "../../presentation/ClientApi.js";

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
    const store = await run(createAuthStore(win, createRealWorldClient({ fetch: win.fetch })));

    installConduitDebug(win, store);
    await run(store.initialize);

    expect(win.__conduit_debug__.getToken()).toBeNull();
    expect(win.__conduit_debug__.getAuthState()).toBe("unauthenticated");
    expect(win.__conduit_debug__.getCurrentUser()).toBeNull();
  });

  it("keeps jwtToken and exposes decoded current user after successful initialization", async () => {
    const win = windowWith({
      fetch: fetchJson({ user }, 200),
      token: "token-reader",
    });
    const store = await run(createAuthStore(win, createRealWorldClient({ fetch: win.fetch })));

    installConduitDebug(win, store);
    await run(store.initialize);

    expect(win.fetch.calls[0]).toMatchObject({
      input: "/api/user",
      authorization: "Token token-reader",
    });
    expect(win.localStorage.getItem("jwtToken")).toBe("token-reader");
    expect(win.__conduit_debug__.getToken()).toBe("token-reader");
    expect(win.__conduit_debug__.getAuthState()).toBe("authenticated");
    expect(win.__conduit_debug__.getCurrentUser()).toEqual(user);
  });

  it("logs in through the local API client and stores the returned token", async () => {
    const win = windowWith({ fetch: fetchJson({ user }, 200) });
    const store = await run(createAuthStore(win, createRealWorldClient({ fetch: win.fetch })));

    installConduitDebug(win, store);
    const response = await run(store.login({
      user: {
        email: "reader@example.com",
        password: "password123",
      },
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
    expect(response.user).toEqual(user);
    expect(win.localStorage.getItem("jwtToken")).toBe("token-reader");
    expect(win.__conduit_debug__.getAuthState()).toBe("authenticated");
  });

  it("registers through the local API client and stores the returned token", async () => {
    const win = windowWith({ fetch: fetchJson({ user }, 201) });
    const store = await run(createAuthStore(win, createRealWorldClient({ fetch: win.fetch })));

    installConduitDebug(win, store);
    await run(store.register({
      user: {
        username: "reader",
        email: "reader@example.com",
        password: "password123",
      },
    }));

    expect(win.fetch.calls[0]).toMatchObject({
      input: "/api/users",
      method: "POST",
    });
    expect(win.localStorage.getItem("jwtToken")).toBe("token-reader");
    expect(win.__conduit_debug__.getCurrentUser()).toEqual(user);
  });

  it("logs out by clearing token and authenticated user state", async () => {
    const win = windowWith({ fetch: fetchJson({ user }, 200), token: "token-reader" });
    const store = await run(createAuthStore(win, createRealWorldClient({ fetch: win.fetch })));

    installConduitDebug(win, store);
    await run(store.initialize);
    await run(store.logout);

    expect(win.localStorage.getItem("jwtToken")).toBeNull();
    expect(win.__conduit_debug__.getToken()).toBeNull();
    expect(win.__conduit_debug__.getAuthState()).toBe("unauthenticated");
    expect(win.__conduit_debug__.getCurrentUser()).toBeNull();
  });

  it("reads tokens stored through localStorage.jwtToken property compatibility", async () => {
    const win = windowWith({ fetch: fetchJson({ user }, 200) });
    win.localStorage.jwtToken = "property-token";
    const store = await run(createAuthStore(win, createRealWorldClient({ fetch: win.fetch })));

    installConduitDebug(win, store);
    await run(store.initialize);

    expect(win.fetch.calls[0]).toMatchObject({
      input: "/api/user",
      authorization: "Token property-token",
    });
    expect(win.__conduit_debug__.getAuthState()).toBe("authenticated");
  });

  it("clears jwtToken and returns unauthenticated on current-user 4xx responses", async () => {
    const win = windowWith({
      fetch: fetchJson({ errors: { token: ["is invalid"] } }, 401),
      token: "stale-token",
    });
    const store = await run(createAuthStore(win, createRealWorldClient({ fetch: win.fetch })));

    installConduitDebug(win, store);
    await run(store.initialize);

    expect(win.localStorage.getItem("jwtToken")).toBeNull();
    expect(win.__conduit_debug__.getToken()).toBeNull();
    expect(win.__conduit_debug__.getAuthState()).toBe("unauthenticated");
    expect(win.__conduit_debug__.getCurrentUser()).toBeNull();
  });

  it("keeps jwtToken and returns unavailable on network failures", async () => {
    const win = windowWith({
      fetch: failingFetch,
      token: "offline-token",
    });
    const store = await run(createAuthStore(win, createRealWorldClient({ fetch: win.fetch })));

    installConduitDebug(win, store);
    await run(store.initialize);

    expect(win.localStorage.getItem("jwtToken")).toBe("offline-token");
    expect(win.__conduit_debug__.getToken()).toBe("offline-token");
    expect(win.__conduit_debug__.getAuthState()).toBe("unavailable");
    expect(win.__conduit_debug__.getCurrentUser()).toBeNull();
  });

  it("keeps jwtToken and returns unavailable on current-user 5xx responses", async () => {
    const win = windowWith({
      fetch: fetchJson({ errors: { server: ["unavailable"] } }, 503),
      token: "server-error-token",
    });
    const store = await run(createAuthStore(win, createRealWorldClient({ fetch: win.fetch })));

    installConduitDebug(win, store);
    await run(store.initialize);

    expect(win.localStorage.getItem("jwtToken")).toBe("server-error-token");
    expect(win.__conduit_debug__.getToken()).toBe("server-error-token");
    expect(win.__conduit_debug__.getAuthState()).toBe("unavailable");
  });

  it("keeps jwtToken and returns unavailable when current-user JSON fails schema decoding", async () => {
    const win = windowWith({
      fetch: fetchJson({ user: { ...user, token: null } }, 200),
      token: "decode-error-token",
    });
    const store = await run(createAuthStore(win, createRealWorldClient({ fetch: win.fetch })));

    installConduitDebug(win, store);
    await run(store.initialize);

    expect(win.localStorage.getItem("jwtToken")).toBe("decode-error-token");
    expect(win.__conduit_debug__.getToken()).toBe("decode-error-token");
    expect(win.__conduit_debug__.getAuthState()).toBe("unavailable");
    expect(win.__conduit_debug__.getCurrentUser()).toBeNull();
  });
});

type TestWindow = {
  readonly fetch: TestFetch;
  readonly localStorage: Storage & { jwtToken?: string };
  __conduit_debug__?: {
    readonly getToken: () => string | null;
    readonly getAuthState: () => string;
    readonly getCurrentUser: () => unknown;
  };
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

const fetchJson = (body: unknown, status: number): TestFetch => {
  const calls: TestFetch["calls"] = [];
  const fetch: TestFetch = async (input, init) => {
    calls.push({
      input,
      authorization: init?.headers?.authorization,
      body: init?.body ? JSON.parse(init.body) as unknown : undefined,
      method: init?.method,
    });
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
  };
  Object.defineProperty(fetch, "calls", { value: calls });
  return fetch;
};

const failingFetch: TestFetch = Object.assign(
  async () => {
    throw new Error("offline");
  },
  { calls: [] as TestFetch["calls"] },
);
