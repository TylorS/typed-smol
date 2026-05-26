import { Fx, RefAsyncData } from "@typed/fx";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { AuthSessionStorage } from "./AuthSessionStorage.js";
import { BrowserAuthState, createAuthStore, type AuthStore } from "./State.js";
import type { RealWorldClient } from "../Api.js";

export interface BrowserAuthWindow {
  readonly localStorage: Storage;
}

export class BrowserAuth extends Context.Service<BrowserAuth, AuthStore>()(
  "RealWorld/BrowserAuth",
) {
  static readonly WithState = <R>(
    clientEffect: Effect.Effect<RealWorldClient, never, R>,
  ): Layer.Layer<BrowserAuth, never, R | BrowserAuthState | AuthSessionStorage> => {
    const authLayer = Layer.effect(
      BrowserAuth,
      Effect.gen(function* () {
        const client = yield* clientEffect;
        return yield* createAuthStore(client);
      }),
    );

    return Layer.mergeAll(authLayer, AuthTokenReplication);
  };

  static readonly Live = <R>(
    win: BrowserAuthWindow & object,
    clientEffect: Effect.Effect<RealWorldClient, never, R>,
  ) =>
    BrowserAuth.WithState(clientEffect).pipe(
      Layer.provideMerge(BrowserAuthState.make(AuthSessionStorage.authSnapshot)),
      Layer.provideMerge(AuthSessionStorage.local(() => win.localStorage)),
    );

  static readonly use = <A, E = never, R = never>(
    f: (store: AuthStore) => Effect.Effect<A, E, R>,
  ): Effect.Effect<A, E, R | BrowserAuth> =>
    Effect.gen(function* () {
      const store = yield* BrowserAuth;
      return yield* f(store);
    });
}

const AuthTokenReplication = BrowserAuthState.pipe(
  RefAsyncData.value,
  Fx.observeLayer(AuthSessionStorage.persist),
);
