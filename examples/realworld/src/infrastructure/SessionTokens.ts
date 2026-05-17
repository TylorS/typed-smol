import { randomBytes } from "node:crypto";
import { Context, Effect, Layer } from "effect";
import * as Schema from "effect/Schema";
import { SqlClient } from "effect/unstable/sql";
import { OpaqueToken, type UserId } from "../domain/Ids.js";
import { RealWorldConfig } from "./Config.js";
import {
  currentIsoTimestamp,
  runSql,
  type RepositoryPersistenceError,
} from "./repositories/Common.js";

export type SessionTokenError = RepositoryPersistenceError;

export interface SessionTokensService {
  readonly create: (userId: UserId) => Effect.Effect<OpaqueToken, SessionTokenError>;
}

export class SessionTokens extends Context.Service<
  SessionTokens,
  SessionTokensService
>()("@typed/realworld/SessionTokens") {
  static readonly Live = Layer.effect(
    SessionTokens,
    Effect.gen(function* () {
      const config = yield* RealWorldConfig;

      return {
        create: (userId) =>
          runSql(config, Effect.gen(function* () {
            const sql = yield* SqlClient.SqlClient;
            const token = yield* Schema.decodeUnknownEffect(OpaqueToken)(
              randomBytes(32).toString("base64url"),
            );
            const now = currentIsoTimestamp();

            yield* sql`
              INSERT INTO sessions (user_id, token, created_at, last_seen_at)
              VALUES (${userId}, ${token}, ${now}, ${now})
            `;

            return token;
          })),
      };
    }),
  );
}
