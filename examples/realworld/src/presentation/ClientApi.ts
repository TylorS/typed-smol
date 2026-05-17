import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import {
  ErrorResponse,
  LoginUserRequest,
  RegisterUserRequest,
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
  readonly login: (input: LoginUserRequest) => Effect.Effect<UserResponse, ClientApiError>;
  readonly register: (input: RegisterUserRequest) => Effect.Effect<UserResponse, ClientApiError>;
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
    login: (input) =>
      requestJson(UserResponse, fetchImpl, `${apiBase}/api/users/login`, jsonRequest("POST", input)),
    register: (input) =>
      requestJson(UserResponse, fetchImpl, `${apiBase}/api/users`, jsonRequest("POST", input)),
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

const jsonRequest = (
  method: "POST" | "PUT",
  body: unknown,
): { readonly body: string; readonly headers: Record<string, string>; readonly method: string } => ({
  body: JSON.stringify(body),
  headers: { "content-type": "application/json" },
  method,
});

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
