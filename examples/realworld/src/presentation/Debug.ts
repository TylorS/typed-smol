import type * as Effect from "effect/Effect";
import type { AuthStore, AuthState } from "./State.js";
import type { UserResponse } from "../domain/RealWorldApi.js";

export interface ConduitDebug {
  readonly getToken: Effect.Effect<string | null>;
  readonly getAuthState: Effect.Effect<AuthState>;
  readonly getCurrentUser: Effect.Effect<UserResponse["user"] | null>;
}

export type DebugWindow = {
  __conduit_debug__?: ConduitDebug;
};

export const installConduitDebug = (
  win: object,
  store: AuthStore,
): ConduitDebug => {
  const debug: ConduitDebug = {
    getToken: store.getToken,
    getAuthState: store.getAuthState,
    getCurrentUser: store.getCurrentUser,
  };
  (win as DebugWindow).__conduit_debug__ = debug;
  return debug;
};
