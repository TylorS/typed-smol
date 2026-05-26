import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";
import type { AuthSnapshot } from "./State.js";

const authTokenKey = "jwtToken";
const AuthToken = Schema.String;

export class AuthSessionStorage extends Context.Service<AuthSessionStorage>()(
  "RealWorld/AuthSessionStorage",
  {
    make: Effect.gen(function* () {
      const keyValueStore = yield* KeyValueStore.KeyValueStore;
      return KeyValueStore.toSchemaStore(keyValueStore, AuthToken);
    }),
  },
) {
  static readonly getToken: Effect.Effect<string | null, never, AuthSessionStorage> = Effect.gen(
    function* () {
      const store = yield* AuthSessionStorage;
      const token = yield* store.get(authTokenKey);
      return Option.getOrNull(token);
    },
  ).pipe(Effect.orElseSucceed(() => null));

  static readonly authSnapshot: Effect.Effect<AuthSnapshot, never, AuthSessionStorage> = Effect.gen(
    function* () {
      const token = yield* AuthSessionStorage.getToken;
      return {
        state: "loading" as const,
        token,
        currentUser: null,
      };
    },
  );

  static readonly persist = (
    snapshot: AuthSnapshot | undefined,
  ): Effect.Effect<void, never, AuthSessionStorage> =>
    Effect.gen(function* () {
      if (snapshot === undefined) return;

      const store = yield* AuthSessionStorage;
      if (snapshot.token === null) {
        return yield* store.remove(authTokenKey);
      }

      yield* store.set(authTokenKey, snapshot.token);
    }).pipe(Effect.catchCause((cause) => Effect.logError("Failed to persist auth token", cause)));

  static readonly local = (storage: () => Storage): Layer.Layer<AuthSessionStorage> =>
    Layer.effect(AuthSessionStorage, AuthSessionStorage.make).pipe(
      Layer.provide(KeyValueStore.layerStorage(storage)),
    );
}
