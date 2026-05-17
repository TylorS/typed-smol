import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { createRealWorldClient, type RealWorldClient } from "./ClientApi.js";
import { installConduitDebug } from "./Debug.js";
import { createAuthStore, type AuthStore, type BrowserAuthWindow } from "./State.js";

export class BrowserAuth extends Context.Service<BrowserAuth, AuthStore>()(
  "RealWorld/BrowserAuth",
) {
  static readonly Live = (
    win: BrowserAuthWindow & object,
    client: RealWorldClient = createRealWorldClient(),
  ) =>
    Layer.effect(
      BrowserAuth,
      createAuthStore(win, client).pipe(
        Effect.tap((store) => Effect.sync(() => installConduitDebug(win, store))),
        Effect.tap((store) => store.initialize),
      ),
    );

  static readonly use = <A, E, R>(
    f: (store: AuthStore) => Effect.Effect<A, E, R>,
  ): Effect.Effect<A, E, R | BrowserAuth> =>
    Effect.flatMap(BrowserAuth, f);
}
