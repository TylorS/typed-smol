import { Context, Effect, Layer } from "effect";
import type { TagsResponse } from "../domain/RealWorldApi.js";
import type { TagRepositoryError } from "../domain/RepositoryErrors.js";
import { TagRepository } from "../infrastructure/repositories/TagRepository.js";

export interface TagsService {
  readonly list: () => Effect.Effect<TagsResponse, TagRepositoryError>;
}

export class Tags extends Context.Service<Tags, TagsService>()(
  "@typed/realworld/Tags",
) {
  static readonly Live = Layer.effect(
    Tags,
    Effect.gen(function* () {
      const repository = yield* TagRepository;

      return {
        list: () => repository.list().pipe(Effect.map((tags) => ({ tags }))),
      };
    }),
  );
}
