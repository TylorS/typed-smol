import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import {
  CreateArticleRequest,
  CreateCommentRequest,
  ErrorResponse,
  LoginUserRequest,
  ProfileResponse,
  RegisterUserRequest,
  SingleArticleResponse,
  SingleCommentResponse,
  UpdateArticleRequest,
  UpdateUserRequest,
  UserResponse,
} from "../domain/RealWorldApi.js";

export type FetchLike = (
  input: string,
  init?: {
    readonly body?: string;
    readonly headers?: Record<string, string>;
    readonly method?: string;
  },
) => Promise<Response>;

export type ClientApiError =
  | { readonly _tag: "HttpStatus"; readonly status: number; readonly errors: ErrorResponse | null }
  | { readonly _tag: "Network"; readonly error: unknown }
  | { readonly _tag: "Decode"; readonly error: unknown };

export interface RealWorldClient {
  readonly currentUser: (token: string) => Effect.Effect<UserResponse, ClientApiError>;
  readonly createArticle: (
    token: string,
    input: CreateArticleRequest,
  ) => Effect.Effect<SingleArticleResponse, ClientApiError>;
  readonly createComment: (
    token: string,
    slug: string,
    input: CreateCommentRequest,
  ) => Effect.Effect<SingleCommentResponse, ClientApiError>;
  readonly deleteArticle: (token: string, slug: string) => Effect.Effect<void, ClientApiError>;
  readonly deleteComment: (
    token: string,
    slug: string,
    id: number,
  ) => Effect.Effect<void, ClientApiError>;
  readonly favoriteArticle: (
    token: string,
    slug: string,
    favorited: boolean,
  ) => Effect.Effect<SingleArticleResponse, ClientApiError>;
  readonly followProfile: (
    token: string,
    username: string,
    following: boolean,
  ) => Effect.Effect<ProfileResponse, ClientApiError>;
  readonly login: (input: LoginUserRequest) => Effect.Effect<UserResponse, ClientApiError>;
  readonly register: (input: RegisterUserRequest) => Effect.Effect<UserResponse, ClientApiError>;
  readonly updateArticle: (
    token: string,
    slug: string,
    input: UpdateArticleRequest,
  ) => Effect.Effect<SingleArticleResponse, ClientApiError>;
  readonly updateUser: (
    token: string,
    input: UpdateUserRequest,
  ) => Effect.Effect<UserResponse, ClientApiError>;
}

export const createRealWorldClient = (
  options: { readonly fetch?: FetchLike; readonly apiBase?: string } = {},
): RealWorldClient => {
  const fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  const apiBase = options.apiBase ?? "";

  return {
    currentUser: (token) =>
      requestJson(UserResponse, fetchImpl, `${apiBase}/api/user`, {
        headers: { authorization: `Token ${token}` },
      }),
    createArticle: (token, input) =>
      requestJson(
        SingleArticleResponse,
        fetchImpl,
        `${apiBase}/api/articles`,
        authJsonRequest("POST", token, input),
      ),
    createComment: (token, slug, input) =>
      requestJson(
        SingleCommentResponse,
        fetchImpl,
        `${apiBase}/api/articles/${pathSegment(slug)}/comments`,
        authJsonRequest("POST", token, input),
      ),
    deleteArticle: (token, slug) =>
      requestNoContent(fetchImpl, `${apiBase}/api/articles/${pathSegment(slug)}`, {
        headers: authHeaders(token),
        method: "DELETE",
      }),
    deleteComment: (token, slug, id) =>
      requestNoContent(
        fetchImpl,
        `${apiBase}/api/articles/${pathSegment(slug)}/comments/${pathSegment(String(id))}`,
        {
          headers: authHeaders(token),
          method: "DELETE",
        },
      ),
    favoriteArticle: (token, slug, favorited) =>
      requestJson(
        SingleArticleResponse,
        fetchImpl,
        `${apiBase}/api/articles/${pathSegment(slug)}/favorite`,
        { headers: authHeaders(token), method: favorited ? "DELETE" : "POST" },
      ),
    followProfile: (token, username, following) =>
      requestJson(
        ProfileResponse,
        fetchImpl,
        `${apiBase}/api/profiles/${pathSegment(username)}/follow`,
        { headers: authHeaders(token), method: following ? "DELETE" : "POST" },
      ),
    login: (input) =>
      requestJson(UserResponse, fetchImpl, `${apiBase}/api/users/login`, jsonRequest("POST", input)),
    register: (input) =>
      requestJson(UserResponse, fetchImpl, `${apiBase}/api/users`, jsonRequest("POST", input)),
    updateArticle: (token, slug, input) =>
      requestJson(
        SingleArticleResponse,
        fetchImpl,
        `${apiBase}/api/articles/${pathSegment(slug)}`,
        authJsonRequest("PUT", token, input),
      ),
    updateUser: (token, input) =>
      requestJson(
        UserResponse,
        fetchImpl,
        `${apiBase}/api/user`,
        authJsonRequest("PUT", token, input),
      ),
  };
};

const requestJson = <A>(
  schema: Schema.Decoder<A>,
  fetchImpl: FetchLike,
  input: string,
  init: {
    readonly body?: string;
    readonly headers?: Record<string, string>;
    readonly method?: string;
  },
): Effect.Effect<A, ClientApiError> =>
  Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () => fetchImpl(input, init),
      catch: (error): ClientApiError => ({ _tag: "Network", error }),
    });
    const body = yield* readJson(response);

    if (!response.ok) {
      return yield* Effect.fail({
        _tag: "HttpStatus" as const,
        status: response.status,
        errors: decodeErrorResponse(body),
      });
    }

    return yield* decode(schema, body);
  });

const requestNoContent = (
  fetchImpl: FetchLike,
  input: string,
  init: {
    readonly headers?: Record<string, string>;
    readonly method?: string;
  },
): Effect.Effect<void, ClientApiError> =>
  Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () => fetchImpl(input, init),
      catch: (error): ClientApiError => ({ _tag: "Network", error }),
    });

    if (!response.ok) {
      const body = yield* readJson(response).pipe(Effect.catch(() => Effect.succeed(null)));
      return yield* Effect.fail({
        _tag: "HttpStatus" as const,
        status: response.status,
        errors: decodeErrorResponse(body),
      });
    }
  });

const jsonRequest = (
  method: "POST" | "PUT",
  body: unknown,
): { readonly body: string; readonly headers: Record<string, string>; readonly method: string } => ({
  body: JSON.stringify(body),
  headers: { "content-type": "application/json" },
  method,
});

const authJsonRequest = (
  method: "POST" | "PUT",
  token: string,
  body: unknown,
): { readonly body: string; readonly headers: Record<string, string>; readonly method: string } => {
  const request = jsonRequest(method, body);
  return {
    ...request,
    headers: { ...request.headers, ...authHeaders(token) },
  };
};

const authHeaders = (token: string): Record<string, string> => ({
  authorization: `Token ${token}`,
});

const pathSegment = (value: string): string => encodeURIComponent(value);

const readJson = (response: Response): Effect.Effect<unknown, ClientApiError> =>
  Effect.tryPromise({
    try: () => response.json() as Promise<unknown>,
    catch: (error): ClientApiError => ({ _tag: "Decode", error }),
  });

const decode = <A>(
  schema: Schema.Decoder<A>,
  body: unknown,
): Effect.Effect<A, ClientApiError> =>
  Effect.try({
    try: () => Schema.decodeUnknownSync(schema)(body),
    catch: (error): ClientApiError => ({ _tag: "Decode", error }),
  });

const decodeErrorResponse = (body: unknown): ErrorResponse | null => {
  try {
    return Schema.decodeUnknownSync(ErrorResponse)(body);
  } catch {
    return null;
  }
};
