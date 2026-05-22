import { describe, expect, it } from "vitest";
import { RefAsyncData } from "@typed/fx";
import * as Effect from "effect/Effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import type { RealWorldClient } from "../../Api.js";
import { makeBrowserClient } from "../../common/BrowserApiClient.js";
import { BrowserAuthState, createAuthStore } from "../../common/State.js";

const user = {
  email: "reader@example.com",
  token: "external-token",
  username: "reader",
  bio: null,
  image: null,
};

describe("realworld auth store state", () => {
  it("initializes unauthenticated state when no token is present", async () => {
    const debugState = await Effect.runPromise(
      Effect.gen(function* () {
        const store = yield* createAuthStore(unusedClient);

        return {
          token: yield* store.getToken,
          state: yield* store.getAuthState,
          currentUser: yield* store.getCurrentUser,
        };
      }).pipe(
        Effect.provide(BrowserAuthState.make(Effect.succeed({
          state: "loading",
          token: null,
          currentUser: null,
        }))),
      ),
    );

    expect(debugState).toEqual({
      token: null,
      state: "unauthenticated",
      currentUser: null,
    });
  });

  it("creates the generated browser API client with auth state available", async () => {
    const client = await Effect.runPromise(
      makeBrowserClient({ baseUrl: "http://typed.test" }).pipe(
        Effect.provide(BrowserAuthState.make({
          state: "loading",
          token: null,
          currentUser: null,
        })),
        Effect.provide(FetchHttpClient.layer),
      ),
    );

    expect(client).toHaveProperty("users");
  });

  it("creates the generated browser API client with a provided Fetch service", async () => {
    const fetch = async () => new Response("{}");
    const client = await Effect.runPromise(
      Effect.provideService(
        makeBrowserClient({ baseUrl: "http://typed.test" }).pipe(
          Effect.provide(BrowserAuthState.make({
            state: "loading",
            token: null,
            currentUser: null,
          })),
          Effect.provide(FetchHttpClient.layer),
        ),
        FetchHttpClient.Fetch,
        fetch,
      ),
    );

    expect(client).toHaveProperty("users");
  });

  it("samples BrowserAuthState through Effect state reads", async () => {
    const debugState = await Effect.runPromise(
      Effect.gen(function* () {
        const store = yield* createAuthStore(unusedClient);
        const ref = yield* BrowserAuthState.service;

        yield* RefAsyncData.setSuccess(ref, {
          state: "authenticated",
          token: "external-token",
          currentUser: user,
        });

        return {
          token: yield* store.getToken,
          state: yield* store.getAuthState,
          currentUser: yield* store.getCurrentUser,
        };
      }).pipe(
        Effect.provide(BrowserAuthState.make(Effect.succeed({
          state: "loading",
          token: null,
          currentUser: null,
        }))),
      ),
    );

    expect(debugState).toEqual({
      token: "external-token",
      state: "authenticated",
      currentUser: user,
    });
  });
});

const unusedRequest = () => Effect.die("unused test client request");

const unusedClient: RealWorldClient = {
  articles: {
    create: unusedRequest,
    delete: unusedRequest,
    favorite: unusedRequest,
    unfavorite: unusedRequest,
    update: unusedRequest,
  },
  comments: {
    create: unusedRequest,
    delete: unusedRequest,
  },
  profiles: {
    follow: unusedRequest,
    unfollow: unusedRequest,
  },
  user: {
    current: unusedRequest,
    update: unusedRequest,
  },
  users: {
    login: unusedRequest,
    register: unusedRequest,
  },
};
