import { Context, Effect, Layer } from "effect";
import * as Schema from "effect/Schema";
import { SqlClient } from "effect/unstable/sql";
import { TagName } from "../../domain/Ids.js";
import { type TagRepositoryError } from "../../domain/RepositoryErrors.js";
import { provideRepositorySql } from "./Common.js";

export interface TagRepositoryService {
  readonly list: () => Effect.Effect<readonly TagName[], TagRepositoryError>;
}

export class TagRepository extends Context.Service<TagRepository, TagRepositoryService>()(
  "@typed/realworld/TagRepository",
) {
  static readonly Live = Layer.effect(
    TagRepository,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      return {
        list: () => provideRepositorySql(listTags, sql),
      };
    }),
  );
}

const listTags: Effect.Effect<readonly TagName[], TagRepositoryError, SqlClient.SqlClient> =
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const rows = yield* sql<{ readonly name: string }>`
      SELECT name FROM tags ORDER BY name ASC
    `;

    return yield* Effect.forEach(rows, (row) => Schema.decodeUnknownEffect(TagName)(row.name));
  });
