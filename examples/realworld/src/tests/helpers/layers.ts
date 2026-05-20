import { composeWithLayers } from "@typed/app/runtime";
import { Effect, Layer } from "effect";
import { ApplicationServices } from "../../application/Services.js";
import {
  defaultDataDirectory,
  RealWorldConfig,
  type RealWorldConfigService,
} from "../../infrastructure/Config.js";
import { PasswordHasher } from "../../infrastructure/PasswordHasher.js";
import { SessionTokens } from "../../infrastructure/SessionTokens.js";
import { SqliteLive } from "../../infrastructure/Sql.js";
import { ArticleRepository } from "../../infrastructure/repositories/ArticleRepository.js";
import { CommentRepository } from "../../infrastructure/repositories/CommentRepository.js";
import { ProfileRepository } from "../../infrastructure/repositories/ProfileRepository.js";
import { TagRepository } from "../../infrastructure/repositories/TagRepository.js";
import { UserRepository } from "../../infrastructure/repositories/UserRepository.js";
import { ServerPageData } from "../../page-data/ServerPageData.js";

type ConfigOverrides = Partial<RealWorldConfigService>;

export { defaultDataDirectory };

export const InfrastructureTestLayer = (overrides: ConfigOverrides) =>
  composeWithLayers(Layer.mergeAll(SessionTokens.Live, PasswordHasher.Live), [
    SqliteLive,
    RealWorldConfig.layer(overrides),
  ]);

export const RepositoryTestLayer = Layer.mergeAll(
  UserRepository.Live,
  ProfileRepository.Live,
  ArticleRepository.Live,
  CommentRepository.Live,
  TagRepository.Live,
);

export const ApplicationTestLayer = (overrides: ConfigOverrides) =>
  composeWithLayers(ApplicationServices, [
    RepositoryTestLayer,
    InfrastructureTestLayer(overrides),
  ]);

export const ServerPageTestLayer = (overrides: ConfigOverrides) =>
  composeWithLayers(ServerPageData, [
    ApplicationServices,
    RepositoryTestLayer,
    InfrastructureTestLayer(overrides),
  ]);

export const ArticleRepositoryTestLayer = (overrides: ConfigOverrides) =>
  composeWithLayers(Layer.mergeAll(ArticleRepository.Live, TagRepository.Live), [
    InfrastructureTestLayer(overrides),
  ]);

export const CommentRepositoryTestLayer = (overrides: ConfigOverrides) =>
  composeWithLayers(CommentRepository.Live, [InfrastructureTestLayer(overrides)]);

export const ProfileRepositoryTestLayer = (overrides: ConfigOverrides) =>
  composeWithLayers(ProfileRepository.Live, [InfrastructureTestLayer(overrides)]);

export const UserRepositoryTestLayer = (overrides: ConfigOverrides) =>
  composeWithLayers(UserRepository.Live, [InfrastructureTestLayer(overrides)]);

export const runWithLayer = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  layer: Layer.Layer<R, never, never>,
): Promise<A> => Effect.runPromise(Effect.provide(effect, layer));

export const exitWithLayer = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  layer: Layer.Layer<R, never, never>,
) => Effect.runPromiseExit(Effect.provide(effect, layer));
