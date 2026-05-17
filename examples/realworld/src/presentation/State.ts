import { RefSubject } from "@typed/fx";
import * as Effect from "effect/Effect";
import type {
  LoginUserRequest,
  RegisterUserRequest,
  UserResponse,
} from "../domain/RealWorldApi.js";
import type { ClientApiError, RealWorldClient } from "./ClientApi.js";

export type AuthState = "loading" | "authenticated" | "unauthenticated" | "unavailable";

export interface AuthSnapshot {
  readonly state: AuthState;
  readonly token: string | null;
  readonly currentUser: UserResponse["user"] | null;
}

export interface AuthStore {
  readonly initialize: Effect.Effect<void>;
  readonly login: (input: LoginUserRequest) => Effect.Effect<UserResponse, ClientApiError>;
  readonly logout: Effect.Effect<void>;
  readonly register: (input: RegisterUserRequest) => Effect.Effect<UserResponse, ClientApiError>;
  readonly getToken: () => string | null;
  readonly getAuthState: () => AuthState;
  readonly getCurrentUser: () => UserResponse["user"] | null;
}

export type BrowserAuthWindow = {
  readonly localStorage: Storage;
};

export const createAuthStore = (
  win: BrowserAuthWindow,
  client: RealWorldClient,
): Effect.Effect<AuthStore> =>
  Effect.scoped(Effect.gen(function* () {
    const initial = snapshot("loading", readToken(win), null);
    const ref = yield* RefSubject.make(initial);
    let current = initial;

    const setCurrent = (next: AuthSnapshot) =>
      Effect.gen(function* () {
        current = next;
        yield* RefSubject.set(ref, next);
      });

    const setUnauthenticated = () =>
      setCurrent(snapshot("unauthenticated", null, null));
    const setUnavailable = (token: string) =>
      setCurrent(snapshot("unavailable", token, null));
    const setAuthenticated = (response: UserResponse) =>
      Effect.gen(function* () {
        writeToken(win, response.user.token);
        yield* setCurrent(snapshot("authenticated", response.user.token, response.user));
      });

    return {
      initialize: Effect.gen(function* () {
        const token = readToken(win);
        if (!token) {
          yield* setUnauthenticated();
          return;
        }

        yield* client.currentUser(token).pipe(
          Effect.matchEffect({
            onFailure: (error) => handleCurrentUserFailure(win, token, error, {
              setUnauthenticated,
              setUnavailable,
            }),
            onSuccess: setAuthenticated,
          }),
        );
      }),
      login: (input) =>
        client.login(input).pipe(Effect.tap((response) => setAuthenticated(response))),
      logout: Effect.sync(() => clearToken(win)).pipe(
        Effect.andThen(setUnauthenticated()),
      ),
      register: (input) =>
        client.register(input).pipe(Effect.tap((response) => setAuthenticated(response))),
      getToken: () => current.token,
      getAuthState: () => current.state,
      getCurrentUser: () => current.currentUser,
    };
  }));

const handleCurrentUserFailure = (
  win: BrowserAuthWindow,
  token: string,
  error: ClientApiError,
  actions: {
    readonly setUnauthenticated: () => Effect.Effect<void>;
    readonly setUnavailable: (token: string) => Effect.Effect<void>;
  },
): Effect.Effect<void> => {
  if (error._tag === "HttpStatus" && error.status >= 400 && error.status < 500) {
    clearToken(win);
    return actions.setUnauthenticated();
  }

  return actions.setUnavailable(token);
};

const snapshot = (
  state: AuthState,
  token: string | null,
  currentUser: UserResponse["user"] | null,
): AuthSnapshot => ({ state, token, currentUser });

const readToken = (win: BrowserAuthWindow): string | null => {
  const token = win.localStorage.getItem("jwtToken") ?? storageTokenProperty(win);
  return token && token.trim() !== "" ? token : null;
};

const writeToken = (win: BrowserAuthWindow, token: string): void => {
  win.localStorage.setItem("jwtToken", token);
  setStorageTokenProperty(win, token);
};

const clearToken = (win: BrowserAuthWindow): void => {
  win.localStorage.removeItem("jwtToken");
  setStorageTokenProperty(win, null);
};

const storageTokenProperty = (win: BrowserAuthWindow): string | null => {
  const token = (win.localStorage as Storage & { readonly jwtToken?: string }).jwtToken;
  return typeof token === "string" ? token : null;
};

const setStorageTokenProperty = (win: BrowserAuthWindow, token: string | null): void => {
  const storage = win.localStorage as Storage & { jwtToken?: string };
  if (token == null) {
    delete storage.jwtToken;
  } else {
    storage.jwtToken = token;
  }
};
