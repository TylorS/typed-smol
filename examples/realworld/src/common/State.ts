import * as AsyncData from "@typed/async-data";
import { RefAsyncData } from "@typed/fx";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import type { ApiClientError, RealWorldClient } from "../Api.js";
import type {
  CreateArticleRequest,
  CreateCommentRequest,
  LoginUserRequest,
  RegisterUserRequest,
  SingleArticleResponse,
  SingleCommentResponse,
  UpdateArticleRequest,
  UpdateUserRequest,
  UserResponse,
  ProfileResponse,
} from "../domain/RealWorldApi.js";
import { UserResponse as UserResponseSchema } from "../domain/RealWorldApi.js";

export type AuthState = "loading" | "authenticated" | "unauthenticated" | "unavailable";
export type AuthWorkflowError = ApiClientError | { readonly _tag: "AuthRequired" };

export interface AuthSnapshot {
  readonly state: AuthState;
  readonly token: string | null;
  readonly currentUser: UserResponse["user"] | null;
}

export class BrowserAuthState extends RefAsyncData.Service<
  BrowserAuthState,
  AuthSnapshot,
  ApiClientError
>()("RealWorld/BrowserAuthState") {}

export interface AuthStore {
  readonly createArticle: (
    input: CreateArticleRequest,
  ) => Effect.Effect<SingleArticleResponse, AuthWorkflowError>;
  readonly createComment: (
    slug: string,
    input: CreateCommentRequest,
  ) => Effect.Effect<SingleCommentResponse, AuthWorkflowError>;
  readonly deleteArticle: (slug: string) => Effect.Effect<void, AuthWorkflowError>;
  readonly deleteComment: (slug: string, id: number) => Effect.Effect<void, AuthWorkflowError>;
  readonly favoriteArticle: (
    slug: string,
    favorited: boolean,
  ) => Effect.Effect<SingleArticleResponse, AuthWorkflowError>;
  readonly followProfile: (
    username: string,
    following: boolean,
  ) => Effect.Effect<ProfileResponse, AuthWorkflowError>;
  readonly login: (input: LoginUserRequest) => Effect.Effect<UserResponse, ApiClientError>;
  readonly logout: Effect.Effect<void>;
  readonly register: (input: RegisterUserRequest) => Effect.Effect<UserResponse, ApiClientError>;
  readonly updateArticle: (
    slug: string,
    input: UpdateArticleRequest,
  ) => Effect.Effect<SingleArticleResponse, AuthWorkflowError>;
  readonly updateSettings: (
    input: UpdateUserRequest,
  ) => Effect.Effect<UserResponse, AuthWorkflowError>;
  readonly getToken: Effect.Effect<string | null>;
  readonly getAuthState: Effect.Effect<AuthState>;
  readonly getCurrentUser: Effect.Effect<UserResponse["user"] | null>;
}

export const createAuthStore = (
  client: RealWorldClient,
): Effect.Effect<AuthStore, never, BrowserAuthState> =>
  Effect.gen(function* () {
    const ref = yield* BrowserAuthState.service;
    const readSnapshot = currentSnapshot(ref);
    const setSnapshot = (next: AuthSnapshot) => RefAsyncData.setSuccess(ref, next);
    const setUnauthenticated = () => setSnapshot(snapshot("unauthenticated", null, null));
    const setUnavailable = Effect.fn(function* (token: string) {
      yield* setSnapshot(snapshot("unavailable", token, null));
    });
    const setAuthenticated = Effect.fn(function* (response: UserResponse) {
      yield* setSnapshot(snapshot("authenticated", response.user.token, response.user));
    });
    const requireToken = protectedToken(() =>
      Effect.gen(function* () {
        const snapshot = yield* readSnapshot;
        return snapshot.token;
      })
    );

    const store: AuthStore = {
      createArticle: Effect.fn(function* (input) {
        const token = yield* requireToken;
        return yield* client.articles.create({
          params: {},
          query: {},
          headers: authHeaders(token),
          payload: input,
        });
      }),
      createComment: Effect.fn(function* (slug, input) {
        const token = yield* requireToken;
        return yield* client.comments.create({
          params: { slug },
          query: {},
          headers: authHeaders(token),
          payload: input,
        });
      }),
      deleteArticle: Effect.fn(function* (slug) {
        const token = yield* requireToken;
        return yield* client.articles.delete({
          params: { slug },
          query: {},
          headers: authHeaders(token),
        });
      }),
      deleteComment: Effect.fn(function* (slug, id) {
        const token = yield* requireToken;
        return yield* client.comments.delete({
          params: { slug, commentId: id },
          query: {},
          headers: authHeaders(token),
        });
      }),
      favoriteArticle: Effect.fn(function* (slug, favorited) {
        const token = yield* requireToken;
        const requestInput = { params: { slug }, query: {}, headers: authHeaders(token) };
        const request = favorited
          ? client.articles.unfavorite(requestInput)
          : client.articles.favorite(requestInput);
        return yield* request;
      }),
      followProfile: Effect.fn(function* (username, following) {
        const token = yield* requireToken;
        const requestInput = { params: { username }, query: {}, headers: authHeaders(token) };
        const request = following
          ? client.profiles.unfollow(requestInput)
          : client.profiles.follow(requestInput);
        return yield* request;
      }),
      login: Effect.fn(function* (input) {
        yield* RefAsyncData.setLoading(ref);
        const response = yield* client.users.login({ params: {}, query: {}, payload: input });
        yield* setAuthenticated(response);
        return response;
      }),
      logout: setUnauthenticated(),
      register: Effect.fn(function* (input) {
        yield* RefAsyncData.setLoading(ref);
        const response = yield* client.users.register({ params: {}, query: {}, payload: input });
        yield* setAuthenticated(response);
        return response;
      }),
      updateArticle: Effect.fn(function* (slug, input) {
        const token = yield* requireToken;
        return yield* client.articles.update({
          params: { slug },
          query: {},
          headers: authHeaders(token),
          payload: input,
        });
      }),
      updateSettings: Effect.fn(function* (input) {
        const token = yield* requireToken;
        const response = yield* client.user.update({
          params: {},
          query: {},
          headers: authHeaders(token),
          payload: input,
        });
        yield* setAuthenticated(response);
        return response;
      }),
      getToken: Effect.gen(function* () {
        const snapshot = yield* readSnapshot;
        return snapshot.token;
      }),
      getAuthState: Effect.gen(function* () {
        const snapshot = yield* readSnapshot;
        return snapshot.state;
      }),
      getCurrentUser: Effect.gen(function* () {
        const snapshot = yield* readSnapshot;
        return snapshot.currentUser;
      }),
    };

    yield* restoreAuthState(client, readSnapshot, {
      setAuthenticated,
      setUnauthenticated,
      setUnavailable,
    });

    return store;
  });

const restoreAuthState = (
  client: RealWorldClient,
  readSnapshot: Effect.Effect<AuthSnapshot>,
  setters: {
    readonly setAuthenticated: (response: UserResponse) => Effect.Effect<void>;
    readonly setUnauthenticated: () => Effect.Effect<void>;
    readonly setUnavailable: (token: string) => Effect.Effect<void>;
  },
): Effect.Effect<void> =>
  Effect.gen(function* () {
    const current = yield* readSnapshot;
    const token = current.token;
    if (!token) {
      yield* setters.setUnauthenticated();
      return;
    }

    const result = yield* loadCurrentUser(client, token).pipe(
      Effect.catch(() => Effect.succeed({ _tag: "Unavailable" as const })),
    );
    switch (result._tag) {
      case "Authenticated":
        yield* setters.setAuthenticated(result.response);
        return;
      case "Unauthenticated":
        yield* setters.setUnauthenticated();
        return;
      case "Unavailable":
        yield* setters.setUnavailable(token);
        return;
    }
  });

type CurrentUserLoad =
  | { readonly _tag: "Authenticated"; readonly response: UserResponse }
  | { readonly _tag: "Unauthenticated" }
  | { readonly _tag: "Unavailable" };

const loadCurrentUser: (
  client: RealWorldClient,
  token: string,
) => Effect.Effect<CurrentUserLoad, ApiClientError> =
  Effect.fn(function* (client, token) {
    const response = yield* client.user.current({
      params: {},
      query: {},
      headers: authHeaders(token),
      responseMode: "response-only",
    });

    if (response.status >= 400 && response.status < 500) {
      return { _tag: "Unauthenticated" };
    }

    if (response.status < 200 || response.status >= 300) {
      return { _tag: "Unavailable" };
    }

    const body = yield* response.json;
    const decoded: UserResponse = yield* Schema.decodeUnknownEffect(UserResponseSchema)(body);
    return { _tag: "Authenticated" as const, response: decoded };
  });

const snapshot = (
  state: AuthState,
  token: string | null,
  currentUser: UserResponse["user"] | null,
): AuthSnapshot => ({ state, token, currentUser });

const currentSnapshot = (
  ref: RefAsyncData.RefAsyncData<AuthSnapshot, ApiClientError>,
): Effect.Effect<AuthSnapshot> =>
  Effect.gen(function* () {
    const data = yield* ref;
    return Option.getOrElse(AsyncData.getSuccess(data), () => snapshot("loading", null, null));
  });

const authHeaders = (token: string): Record<string, string> => ({
  authorization: `Token ${token}`,
});

const protectedToken = <E, R>(
  read: () => Effect.Effect<string | null, E, R>,
): Effect.Effect<string, AuthWorkflowError | E, R> =>
  Effect.gen(function* () {
    const token = yield* read();
    if (token == null) {
      return yield* Effect.fail({ _tag: "AuthRequired" as const });
    }

    return token;
  });
