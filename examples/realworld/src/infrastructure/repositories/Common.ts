import { Effect, Option } from "effect";
import { SqlClient } from "effect/unstable/sql";

export const provideRepositorySql = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  sql: SqlClient.SqlClient,
): Effect.Effect<A, E, Exclude<R, SqlClient.SqlClient>> =>
  Effect.provideService(effect, SqlClient.SqlClient, sql);

export const first = <A>(rows: readonly A[]): Option.Option<A> =>
  rows.length > 0 ? Option.some(rows[0]) : Option.none();

export const currentIsoTimestamp = (): string => new Date().toISOString();
